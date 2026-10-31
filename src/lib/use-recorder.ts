"use client";

import { useEffect, useRef, useState } from "react";
import { transcribeAudio } from "./client-api";

type RecorderCallbacks = {
  onStart: () => void;
  onTranscribing: () => void;
  onTranscript: (text: string) => void;
  onError: (message: string) => void;
};

export function useRecorder(callbacks: RecorderCallbacks) {
  const [recording, setRecording] = useState(false);
  const [canRecord, setCanRecord] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const starting = useRef(false);
  const generation = useRef(0);
  const handlers = useRef(callbacks);

  useEffect(() => { handlers.current = callbacks; });
  useEffect(() => {
    mounted.current = true;
    Promise.resolve().then(() => { if (mounted.current) setCanRecord(typeof navigator.mediaDevices?.getUserMedia === "function" && typeof window.MediaRecorder !== "undefined"); });
    return () => {
      mounted.current = false;
      generation.current += 1;
      controller.current?.abort();
      if (timer.current) clearTimeout(timer.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function processRecording(parts: readonly Blob[], mimeType: string, token: number, media: MediaStream) {
    media.getTracks().forEach((track) => track.stop());
    if (!mounted.current || token !== generation.current) return;
    if (timer.current) clearTimeout(timer.current);
    if (!mounted.current) return;
    setRecording(false);
    const audio = new Blob([...parts], { type: mimeType });
    if (audio.size === 0 || audio.size > 10 * 1024 * 1024) {
      handlers.current.onError("Enregistrement vide ou trop long. Réessayez avec une phrase courte.");
      return;
    }
    handlers.current.onTranscribing();
    const activeController = new AbortController();
    controller.current = activeController;
    try {
      const text = await transcribeAudio(audio, activeController.signal);
      if (mounted.current && token === generation.current) handlers.current.onTranscript(text);
    } catch (error) {
      if (mounted.current && token === generation.current && !activeController.signal.aborted) handlers.current.onError(error instanceof Error ? error.message : "Transcription impossible. Utilisez le clavier.");
    }
  }

  async function toggle() {
    if (recorder.current?.state === "recording") { recorder.current.stop(); return; }
    if (starting.current) return;
    if (typeof navigator.mediaDevices?.getUserMedia !== "function" || typeof window.MediaRecorder === "undefined") {
      handlers.current.onError("Le microphone n'est pas disponible dans ce navigateur. La saisie texte reste accessible."); return;
    }
    starting.current = true;
    generation.current += 1;
    const token = generation.current;
    controller.current?.abort();
    if (timer.current) clearTimeout(timer.current);
    try {
      const media = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (!mounted.current || token !== generation.current) { media.getTracks().forEach((track) => track.stop()); return; }
      stream.current = media;
      const mimeType = ["audio/webm;codecs=opus", "audio/mp4", "audio/webm"].find((type) => MediaRecorder.isTypeSupported(type));
      const active = new MediaRecorder(media, mimeType ? { mimeType } : undefined);
      recorder.current = active;
      let parts: readonly Blob[] = [];
      active.ondataavailable = (event) => { if (event.data.size) parts = [...parts, event.data]; };
      active.onstop = () => { void processRecording(parts, active.mimeType, token, media); };
      active.onerror = () => {
        media.getTracks().forEach((track) => track.stop());
        if (timer.current) clearTimeout(timer.current);
        if (mounted.current && token === generation.current) { setRecording(false); handlers.current.onError("L'enregistrement a échoué. Utilisez la saisie texte."); }
      };
      handlers.current.onStart();
      active.start();
      setRecording(true);
      timer.current = setTimeout(() => { if (active.state === "recording") active.stop(); }, 30_000);
    } catch {
      stream.current?.getTracks().forEach((track) => track.stop());
      if (mounted.current && token === generation.current) handlers.current.onError("Accès au microphone refusé ou indisponible. Vous pouvez écrire votre phrase.");
    } finally { starting.current = false; }
  }

  return { recording, canRecord, toggle };
}
