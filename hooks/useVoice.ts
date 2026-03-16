// =====================================================
// AksharaChitra — useVoice Hook
// =====================================================
// Wraps SpeechRecognition + SpeechSynthesis for poster voice input.
// Handles language switching and browser compat gracefully.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Language } from "../types";

// --------------------------------------------------
// Inline Speech Language Map
// --------------------------------------------------

const LANG_SPEECH_MAP: Record<Language, string> = {
  eng: "en-IN",
  tel: "te-IN",
  hin: "hi-IN",
  tam: "ta-IN",
  kan: "kn-IN",
  mal: "ml-IN",
  ori: "or-IN",
  san: "sa-IN",
};

interface UseVoiceOptions {
  language: Language;
  onTranscript: (text: string) => void;
}

export function useVoice({ language, onTranscript }: UseVoiceOptions) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {

    if (typeof window === "undefined") return;

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SR) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);

    const recog = new SR();

    recog.continuous = false;
    recog.interimResults = false;
    recog.maxAlternatives = 1;
    recog.lang = LANG_SPEECH_MAP[language] ?? "en-IN";

    recog.onresult = (ev: any) => {
      const transcript = ev.results[0][0].transcript.trim();

      if (transcript) {
        onTranscript(transcript);
        speak(transcript, language);
      }
    };

    recog.onend = () => setIsListening(false);

    recognitionRef.current = recog;

    return () => {
      try {
        recog.stop();
      } catch {
        // ignore
      }
    };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update language dynamically

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.lang =
        LANG_SPEECH_MAP[language] ?? "en-IN";
    }
  }, [language]);

  const startListening = useCallback(() => {

    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.lang =
        LANG_SPEECH_MAP[language] ?? "en-IN";

      recognitionRef.current.start();

      setIsListening(true);

    } catch {
      // already started
    }

  }, [language]);

  const stopListening = useCallback(() => {

    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
    } catch {
      // ignore
    }

    setIsListening(false);

  }, []);

  return {
    isListening,
    isSupported,
    startListening,
    stopListening
  };
}

// --------------------------------------------------
// Speech Output
// --------------------------------------------------

export function speak(text: string, language: Language): void {

  if (typeof window === "undefined") return;

  const synth = window.speechSynthesis;

  if (!synth || !text) return;

  const utter = new SpeechSynthesisUtterance(text);

  utter.lang = LANG_SPEECH_MAP[language] ?? "en-IN";
  utter.rate = 1.0;
  utter.pitch = 1.0;

  const voices = synth.getVoices();

  const match = voices.find((v) => v.lang === utter.lang);

  if (match) utter.voice = match;

  synth.cancel();
  synth.speak(utter);
}