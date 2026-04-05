'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVoiceInputOptions {
  /** Basılı tutarken anlık metin (noktalama + ara sonuçlar) */
  onLiveTranscript: (text: string) => void;
  /** Parmağı kaldırınca, tanıma bittiğinde son metin */
  onHoldComplete: (finalText: string) => void;
  onError?: (error: string) => void;
}

interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  startHold: () => void;
  endHold: () => void;
}

export function useVoiceInput({
  onLiveTranscript,
  onHoldComplete,
  onError,
}: UseVoiceInputOptions): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const holdingRef = useRef(false);
  const finalTranscriptRef = useRef('');
  const releasedRef = useRef(false);
  const intentionalStopRef = useRef(false);

  const onLiveRef = useRef(onLiveTranscript);
  const onCompleteRef = useRef(onHoldComplete);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onLiveRef.current = onLiveTranscript;
  }, [onLiveTranscript]);
  useEffect(() => {
    onCompleteRef.current = onHoldComplete;
  }, [onHoldComplete]);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const recognition: any = new SpeechRecognition();
    recognition.lang = 'tr-TR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const piece = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscriptRef.current += piece;
        } else {
          interim += piece;
        }
      }
      const combined = `${finalTranscriptRef.current}${interim}`.trim();
      onLiveRef.current(combined);
    };

    recognition.onerror = (event: any) => {
      const silent = event.error === 'aborted' || event.error === 'no-speech';
      const messages: Record<string, string> = {
        'not-allowed': 'Mikrofon izni reddedildi.',
        'no-speech': 'Ses algılanamadı, tekrar dene.',
        network: 'Bağlantı hatası.',
      };
      if (!silent) {
        const msg = messages[event.error] ?? (event.error ? `Hata: ${event.error}` : '');
        if (msg) onErrorRef.current?.(msg);
      }
      holdingRef.current = false;
      releasedRef.current = false;
      intentionalStopRef.current = false;
      setIsListening(false);
      finalTranscriptRef.current = '';
    };

    recognition.onend = () => {
      setIsListening(false);
      holdingRef.current = false;
      const text = finalTranscriptRef.current.trim();
      finalTranscriptRef.current = '';
      if (releasedRef.current && intentionalStopRef.current && text) {
        onCompleteRef.current(text);
      }
      releasedRef.current = false;
      intentionalStopRef.current = false;
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.abort();
      } catch {
        /* ignore */
      }
    };
  }, []);

  const startHold = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    finalTranscriptRef.current = '';
    releasedRef.current = false;
    intentionalStopRef.current = false;

    try {
      recognition.abort();
    } catch {
      /* ignore */
    }

    holdingRef.current = true;
    setIsListening(true);

    const tryStart = () => {
      try {
        recognition.start();
      } catch {
        setTimeout(() => {
          try {
            recognition.start();
          } catch {
            holdingRef.current = false;
            setIsListening(false);
            onErrorRef.current?.('Mikrofon başlatılamadı.');
          }
        }, 120);
      }
    };
    tryStart();
  }, []);

  const endHold = useCallback(() => {
    if (!holdingRef.current) return;
    holdingRef.current = false;
    releasedRef.current = true;
    intentionalStopRef.current = true;

    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.stop();
      } catch {
        setIsListening(false);
        releasedRef.current = false;
        intentionalStopRef.current = false;
      }
    }
  }, []);

  return { isListening, isSupported, startHold, endHold };
}
