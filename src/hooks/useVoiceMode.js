import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Voice mode layer for the AI Interview.
 *
 * Input  → Web Speech API (SpeechRecognition)  — free, browser-native, no token cost.
 * Output → Web Speech API (SpeechSynthesis)    — free, browser-native, robotic voice for now.
 *
 * Both APIs are client-side only. This hook never touches the /api/chat path —
 * AIInterview.jsx still owns sending; voice input is just collected differently
 * and routed through the same sendMessage via onTranscriptComplete.
 *
 * Every API access is wrapped so unsupported browsers (e.g. Firefox, which has
 * no SpeechRecognition) fail silently rather than throwing.
 *
 * @param {Object}   opts
 * @param {Function} opts.onTranscriptComplete - called with the final spoken
 *        text when the user taps the mic again to stop (tap-to-stop). The best
 *        available transcript — accumulated final results, else the latest
 *        interim — is passed. AIInterview passes its existing sendMessage here.
 */

// Preferred TTS voices in priority order — natural-sounding English voices on
// the major platforms, falling back to any en-US voice, then the browser default.
const PREFERRED_VOICES = ['Google US English', 'Samantha', 'Microsoft Aria'];

// Resolve a voice for the utterance. getVoices() can return [] on the very first
// call in Chrome (the list loads async via 'voiceschanged'); a null result here
// just means "use the browser default", which is an acceptable fallback.
function pickVoice(synth) {
  let voices;
  try { voices = synth.getVoices() || []; } catch { return null; }
  for (const name of PREFERRED_VOICES) {
    const match = voices.find(v => v.name === name);
    if (match) return match;
  }
  return voices.find(v => /^en[-_]US/i.test(v.lang)) || null;
}

export function useVoiceMode({ onTranscriptComplete } = {}) {
  const [voiceModeActive, setVoiceModeActive] = useState(false);
  const [isListening,     setIsListening]     = useState(false);
  const [isSpeaking,      setIsSpeaking]      = useState(false);
  const [transcript,      setTranscript]      = useState('');

  // SpeechRecognition support is resolved once from the window. A later
  // permission denial ('not-allowed') flips voiceSupported to false too, so the
  // UI can switch from the mic to the permission-denied notice.
  const SpeechRecognitionImpl =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : undefined;
  const [voiceSupported, setVoiceSupported] = useState(Boolean(SpeechRecognitionImpl));

  const recognitionRef     = useRef(null);
  const finalTranscriptRef = useRef(''); // accumulated final results for the active session
  const currentAudioRef    = useRef(null); // active OpenAI TTS <audio> element, for cancellation

  // Keep the completion callback in a ref so recognition handlers always call
  // the latest sendMessage without re-subscribing listeners on every render.
  const onCompleteRef = useRef(onTranscriptComplete);
  useEffect(() => { onCompleteRef.current = onTranscriptComplete; }, [onTranscriptComplete]);

  // Stop and tear down any active recognition session WITHOUT firing the
  // completion callback. Used for resets and full teardown; the user-facing
  // stop is stopListening() below. Safe to call repeatedly.
  const stopRecognition = useCallback(() => {
    const rec = recognitionRef.current;
    if (rec) {
      // Detach handlers before stopping so a late onend can't flip state back.
      try {
        rec.onresult = null;
        rec.onerror  = null;
        rec.onend    = null;
        rec.stop();
      } catch { /* no-op */ }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Tap-to-stop: stop the mic, take the best available transcript, fire the
  // completion callback, then reset. Driven by a second tap on the mic button.
  const stopListening = useCallback(() => {
    const rec = recognitionRef.current;
    if (!rec) return;

    // Detach handlers before stopping so the imminent onend can't reset state
    // out from under us, then stop the mic.
    try {
      rec.onresult = null;
      rec.onerror  = null;
      rec.onend    = null;
      rec.stop();
    } catch { /* no-op */ }
    recognitionRef.current = null;

    // Best available transcript: accumulated final results, else the latest
    // interim still showing in the UI.
    const result = finalTranscriptRef.current.trim() || transcript.trim();

    finalTranscriptRef.current = '';
    setTranscript('');
    setIsListening(false);

    if (result) {
      try { onCompleteRef.current?.(result); } catch { /* no-op */ }
    }
  }, [transcript]);

  // ── Speech recognition (STT) ───────────────────────────────────────────────
  const startListening = useCallback(() => {
    if (!SpeechRecognitionImpl) { setVoiceSupported(false); return; }

    // A new recording session must silence any TTS still playing.
    try { window.speechSynthesis?.cancel(); } catch { /* no-op */ }
    setIsSpeaking(false);

    // Tear down any prior session before opening a fresh one.
    stopRecognition();
    setTranscript('');
    finalTranscriptRef.current = ''; // reset accumulator for the new session

    let recognition;
    try {
      recognition = new SpeechRecognitionImpl();
    } catch {
      setVoiceSupported(false);
      return;
    }

    // Tap-to-stop: continuous keeps the mic open until stopListening() stops it
    // explicitly, instead of ending after the first utterance.
    recognition.continuous      = true;
    recognition.interimResults  = true;
    recognition.lang            = 'en-US';
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      // Accumulate final results into the ref; surface finals + the live interim
      // in the UI. Nothing auto-sends — completion is driven by stopListening().
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i];
        const t   = res[0].transcript;
        if (res.isFinal) finalTranscriptRef.current += t + ' ';
        else             interim += t;
      }
      setTranscript((finalTranscriptRef.current + interim).trim());
    };

    recognition.onerror = (event) => {
      if (event.error === 'not-allowed') {
        // Permission denied — surface the mic-permission notice in the UI.
        setVoiceSupported(false);
      } else if (event.error === 'no-speech') {
        // Nothing heard — reset to idle silently.
      } else {
        console.error('[useVoiceMode] recognition error:', event.error);
      }
      recognitionRef.current = null;
      setIsListening(false);
    };

    recognition.onend = () => {
      // Tap-to-stop drives completion via stopListening() (which detaches this
      // handler first). A stray onend — e.g. the browser ending the session on
      // its own — just resets the mic indicator.
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsListening(true);
    } catch {
      // start() throws if called while already started — reset and ignore.
      recognitionRef.current = null;
      setIsListening(false);
    }
  }, [SpeechRecognitionImpl, stopRecognition]);

  // ── Speech synthesis (TTS) ─────────────────────────────────────────────────
  // Output is now OpenAI TTS via the /api/tts proxy, with a silent fallback to
  // browser SpeechSynthesis on any error so voice mode never hard-fails.

  const stopSpeaking = useCallback(() => {
    // Stop any OpenAI audio and revoke its blob URL so it can't leak.
    const audio = currentAudioRef.current;
    if (audio) {
      try { audio.pause(); } catch { /* no-op */ }
      try { URL.revokeObjectURL(audio.src); } catch { /* no-op */ }
      currentAudioRef.current = null;
    }
    // Also cancel the SpeechSynthesis fallback if it happens to be active.
    try { window.speechSynthesis?.cancel(); } catch { /* no-op */ }
    setIsSpeaking(false);
  }, []);

  // Fallback path: the original browser SpeechSynthesis implementation, reached
  // only when the OpenAI TTS request or playback fails.
  const fallbackSpeak = useCallback((text) => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (!synth || typeof window.SpeechSynthesisUtterance === 'undefined') return;
    if (!text?.trim()) return;
    try {
      synth.cancel(); // never overlap utterances
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.rate  = 0.95; // slightly slower than default for clarity
      utterance.pitch = 1.0;
      const voice = pickVoice(synth);
      if (voice) utterance.voice = voice;
      utterance.onend   = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      setIsSpeaking(true);
      synth.speak(utterance);
    } catch {
      setIsSpeaking(false);
    }
  }, []);

  // speakText(fullText, shortText): speaks the voice-optimized shortText through
  // OpenAI TTS. fullText is kept for the "hear full response" path.
  const speakText = useCallback(async (fullText, shortText) => {
    // shortText is what gets spoken (3-4 sentence version);
    // fullText is stored for the "hear full response" path.
    const textToSpeak = shortText || fullText;
    if (!textToSpeak?.trim()) return;

    // Cancel any in-progress speech first.
    stopSpeaking();
    setIsSpeaking(true);

    try {
      const response = await fetch('/api/tts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ text: textToSpeak }),
      });

      if (!response.ok) throw new Error('TTS fetch failed');

      const audioBlob = await response.blob();
      const audioUrl  = URL.createObjectURL(audioBlob);
      const audio     = new Audio(audioUrl);

      // Store ref for cleanup / cancellation.
      currentAudioRef.current = audio;

      audio.onended = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl); // cleanup blob URL
        currentAudioRef.current = null;
      };

      audio.onerror = () => {
        setIsSpeaking(false);
        URL.revokeObjectURL(audioUrl);
        currentAudioRef.current = null;
        fallbackSpeak(textToSpeak); // silent fallback to SpeechSynthesis
      };

      await audio.play();
    } catch (err) {
      console.error('[voice] TTS API error:', err);
      setIsSpeaking(false);
      // Silent fallback to SpeechSynthesis on any error (missing key, network,
      // non-200, blocked autoplay) — voice mode must never hard-fail.
      fallbackSpeak(textToSpeak);
    }
  }, [stopSpeaking, fallbackSpeak]);

  const toggleVoiceMode = useCallback(() => {
    setVoiceModeActive(prev => !prev);
  }, []);

  // Full teardown — cancel recognition + TTS (OpenAI audio and the synthesis
  // fallback), clear timers, reset to idle.
  const teardown = useCallback(() => {
    stopRecognition();
    const audio = currentAudioRef.current;
    if (audio) {
      try { audio.pause(); } catch { /* no-op */ }
      try { URL.revokeObjectURL(audio.src); } catch { /* no-op */ }
      currentAudioRef.current = null;
    }
    try { window.speechSynthesis?.cancel(); } catch { /* no-op */ }
    setIsSpeaking(false);
    setTranscript('');
    finalTranscriptRef.current = '';
  }, [stopRecognition]);

  // Tear everything down when voice mode turns off: while it's on this effect's
  // cleanup is armed, so flipping voiceModeActive → false (or unmounting while
  // active) runs teardown() exactly once. Driving it from the cleanup keeps
  // setState out of the effect body.
  useEffect(() => {
    if (!voiceModeActive) return undefined;
    return () => teardown();
  }, [voiceModeActive, teardown]);

  // Belt-and-suspenders: always tear down on unmount.
  useEffect(() => () => teardown(), [teardown]);

  // Warm the voice list so pickVoice() has data before the first speakText call.
  useEffect(() => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    if (!synth) return undefined;
    try { synth.getVoices(); } catch { /* no-op */ }
    const onVoices = () => { try { synth.getVoices(); } catch { /* no-op */ } };
    synth.addEventListener?.('voiceschanged', onVoices);
    return () => synth.removeEventListener?.('voiceschanged', onVoices);
  }, []);

  return {
    voiceModeActive,
    toggleVoiceMode,
    isListening,
    isSpeaking,
    startListening,
    stopListening,
    stopSpeaking,
    speakText,
    voiceSupported,
    transcript,
  };
}
