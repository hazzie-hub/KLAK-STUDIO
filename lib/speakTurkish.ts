/** Tarayıcı Speech Synthesis — Türkçe ses tercihi. */
export function speakTurkish(text: string): Promise<void> {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const speak = () => {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'tr-TR';
      utterance.rate = 1;
      utterance.pitch = 1;

      const voices = window.speechSynthesis.getVoices();
      const tr =
        voices.find((v) => v.lang.toLowerCase().startsWith('tr')) ??
        voices.find((v) => /turkish|türkçe/i.test(v.name));
      if (tr) utterance.voice = tr;

      utterance.onend = () => resolve();
      utterance.onerror = () => resolve();
      window.speechSynthesis.speak(utterance);
    };

    let started = false;
    const trySpeak = () => {
      if (started) return;
      started = true;
      window.speechSynthesis.removeEventListener('voiceschanged', trySpeak);
      speak();
    };

    if (window.speechSynthesis.getVoices().length > 0) {
      trySpeak();
      return;
    }

    window.speechSynthesis.addEventListener('voiceschanged', trySpeak);
    setTimeout(trySpeak, 400);
  });
}
