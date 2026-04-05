'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseVoiceInputOptions {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
}

interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  toggle: () => void;
  stop: () => void;
}

export function useVoiceInput({ onTranscript, onError }: UseVoiceInputOptions): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);

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
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const messages: Record<string, string> = {
        'not-allowed': 'Mikrofon izni reddedildi.',
        'no-speech': 'Ses algılanamadı, tekrar dene.',
        'network': 'Bağlantı hatası.',
        'aborted': '',
      };
      const msg = messages[event.error] ?? `Hata: ${event.error}`;
      if (msg) onError?.(msg);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [onTranscript, onError]);

  const toggle = useCallback(() => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.abort();
      setIsListening(false);
    } else {
      try {
        recognition.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  }, [isListening]);

  const stop = useCallback(() => {
    recognitionRef.current?.abort();
    setIsListening(false);
  }, []);

  return { isListening, isSupported, toggle, stop };
}
