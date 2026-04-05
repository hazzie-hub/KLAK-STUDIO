/** Türkçe TTS — mümkünse erkek sesi seçer. */
function pickTurkishMaleVoice(
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | undefined {
  const tr = voices.filter(
    (v) =>
      v.lang.toLowerCase().startsWith('tr') ||
      /turkish|türkçe/i.test(v.name),
  );
  if (tr.length === 0) return undefined;

  const maleHints =
    /yusuf|tolga|ahmet|mehmet|emir|barış|cem|murat|fuat|erkek|male|bass|low|#male|microsoft.*tolga|google.*tr.*male/i;
  const femaleHints =
    /yelda|ayşe|zeynep|filiz|female|kadın|#female|microsoft.*ayca|microsoft.*emel/i;

  const male = tr.find(
    (v) => maleHints.test(v.name) || (v.voiceURI && maleHints.test(v.voiceURI)),
  );
  if (male) return male;

  const notFemale = tr.filter(
    (v) => !femaleHints.test(v.name) && !(v.voiceURI && femaleHints.test(v.voiceURI)),
  );
  if (notFemale.length > 0) return notFemale[0];

  return tr[0];
}

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

      const voices = window.speechSynthesis.getVoices();
      const voice = pickTurkishMaleVoice(voices);
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang || 'tr-TR';
        utterance.pitch = 0.92;
      } else {
        utterance.pitch = 0.88;
      }

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
