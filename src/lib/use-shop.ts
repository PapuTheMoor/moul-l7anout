"use client";

import { useEffect, useRef, useState } from "react";
import { SAMPLE_SHOP } from "@/data/seed";
import { confirmTransaction, getSummary, undoLatest } from "@/domain/ledger";
import { parseLocal } from "@/domain/local-parser";
import type { DomainResult, InputSource, InterpretationEngine, ShopState, ShopWorkspaceProps, TransactionProposal, VoiceCommand } from "@/domain/types";
import { interpretInput } from "./client-api";
import { loadShop, saveShop, STORAGE_KEY } from "./storage";
import { useRecorder } from "./use-recorder";
import { parseVoiceCommand } from "./voice-commands";

export function useShop(): ShopWorkspaceProps {
  const [state, setState] = useState<ShopState>(SAMPLE_SHOP);
  const [text, setText] = useState("");
  const [proposal, setProposal] = useState<TransactionProposal | null>(null);
  const [engine, setEngine] = useState<InterpretationEngine>(process.env.NEXT_PUBLIC_DEMO_ONLY === "1" ? "local" : "openai");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const stateRef = useRef(state);
  const sourceRef = useRef<InputSource>("typed");
  const revision = useRef(0);
  const recordingRevision = useRef(0);
  const request = useRef<AbortController | null>(null);
  const blocked = useRef(false);
  const storageAvailable = useRef(true);
  const savedRaw = useRef<string | null>(null);
  const proposalRef = useRef<TransactionProposal | null>(null);
  const pendingReset = useRef(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const restored = loadShop(window.localStorage);
        savedRaw.current = window.localStorage.getItem(STORAGE_KEY);
        if (restored.ok && restored.value) { stateRef.current = restored.value; setState(restored.value); }
        else if (!restored.ok) {
          if (restored.error.startsWith("Stockage local")) { storageAvailable.current = false; setNotice(restored.error); }
          else { blocked.current = true; setError(restored.error); }
        }
      } catch { storageAvailable.current = false; setNotice("Stockage local indisponible. Le carnet fonctionne pour cette session uniquement."); }
      setHydrated(true);
    });
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY || event.newValue === savedRaw.current) return;
      blocked.current = true;
      setError("Ce carnet a changé dans un autre onglet. Rechargez la page pour retrouver la dernière version.");
    };
    window.addEventListener("storage", onStorage);
    return () => { active = false; request.current?.abort(); window.removeEventListener("storage", onStorage); };
  }, []);

  function updateProposal(value: TransactionProposal | null) {
    proposalRef.current = value;
    setProposal(value);
  }

  function invalidate(clearProposal = true) {
    revision.current += 1;
    request.current?.abort();
    setBusy(false);
    if (clearProposal) updateProposal(null);
  }

  function changeText(next: string, source: InputSource = "typed") {
    invalidate();
    pendingReset.current = false;
    setText(next.slice(0, 1000));
    sourceRef.current = source;
    if (!blocked.current) setError(null);
    setNotice(source === "sample" ? "Exemple chargé. Vérifiez la phrase, puis lancez la compréhension." : null);
  }

  async function interpretValue(value: string, source: InputSource) {
    if (!value.trim() || !hydrated) return;
    invalidate(false);
    const currentRevision = revision.current;
    const input = { id: crypto.randomUUID(), text: value.trim(), source };
    setBusy(true);
    if (!blocked.current) setError(null);
    setNotice(null);
    const controller = new AbortController();
    request.current = controller;
    try {
      const command = parseVoiceCommand(input.text);
      if (command) { executeCommand(command); return; }
      pendingReset.current = false;
      const result = engine === "local"
        ? parseLocal(input, stateRef.current)
        : { ok: true as const, value: await interpretInput(input, stateRef.current, controller.signal, proposalRef.current, document.documentElement.lang === "ar" ? "ar" : "fr") };
      if (currentRevision !== revision.current) return;
      if (!result.ok) { updateProposal(null); setError(result.error); return; }
      const interpreted = engine === "local" ? { type: "proposal" as const, proposal: result.value as TransactionProposal } : result.value;
      if ("type" in interpreted && interpreted.type === "command") { executeCommand(interpreted.command); return; }
      if (!("type" in interpreted) || interpreted.type !== "proposal") return;
      pendingReset.current = false;
      updateProposal(interpreted.proposal);
      setNotice(source === "speech" ? "Parlez pour confirmer ou corriger la proposition." : engine === "openai" ? "Proposition comprise par OpenAI. Vérifiez-la avant de confirmer." : "Proposition issue du mode exemples locaux. Vérifiez-la avant de confirmer.");
    } catch (cause) {
      if (currentRevision === revision.current && !controller.signal.aborted) { updateProposal(null); setError(cause instanceof Error ? cause.message : "La compréhension a échoué. Réessayez ou utilisez les exemples locaux."); }
    } finally { if (currentRevision === revision.current) setBusy(false); }
  }

  function confirmationMessage(value: TransactionProposal) {
    return value.kind === "customer" ? "Client ajouté. Le carnet clients est à jour." : value.kind === "repayment" ? "Remboursement enregistré. Le compte client est à jour." : "Vente enregistrée. Votre carnet est à jour.";
  }

  function executeCommand(command: VoiceCommand) {
    if (command !== "confirm" && command !== "cancel" && command !== "reset") pendingReset.current = false;
    if (command === "confirm") {
      if (pendingReset.current) {
        pendingReset.current = false;
        try {
          if (blocked.current || (storageAvailable.current && window.localStorage.getItem(STORAGE_KEY) !== savedRaw.current)) {
            blocked.current = true; setError("Une autre version du carnet existe. Rechargez la page avant de continuer."); return;
          }
        } catch { setError("Stockage local indisponible. La réinitialisation vocale a été annulée."); return; }
        performReset();
      }
      else if (proposalRef.current) commit(confirmTransaction(stateRef.current, proposalRef.current, new Date().toISOString()), confirmationMessage(proposalRef.current));
      else setNotice("Aucune opération à confirmer.");
    } else if (command === "cancel") {
      if (pendingReset.current) { pendingReset.current = false; setNotice("Réinitialisation annulée."); }
      else if (proposalRef.current) { updateProposal(null); setNotice("Brouillon annulé."); }
      else setNotice("Action vocale annulée.");
    } else if (command === "undo") {
      pendingReset.current = false;
      commit(undoLatest(stateRef.current), "Dernière opération annulée. Les montants et le stock ont été restaurés.");
    } else if (command === "reset") {
      pendingReset.current = true;
      setNotice("Dites confirmer pour valider la réinitialisation, ou annuler pour garder le carnet.");
    } else if (command === "language_ar" || command === "language_fr") {
      window.dispatchEvent(new CustomEvent("moul7anout:language", { detail: command === "language_ar" ? "ar" : "fr" }));
      setNotice("Langue changée.");
    } else if (command === "engine_local" || command === "engine_openai") {
      setEngine(command === "engine_local" ? "local" : "openai");
      setNotice(command === "engine_local" ? "Mode exemples locaux activé." : "Mode OpenAI activé.");
    } else {
      const target = { show_customers: "clients", show_products: "produits", show_activity: "activite", show_capture: "capture" }[command];
      document.getElementById(target)?.scrollIntoView({ behavior: "smooth" });
      setNotice("Page affichée.");
    }
  }

  function commit(result: DomainResult<ShopState>, message: string) {
    if (blocked.current) { setError("Rechargez le carnet ou réinitialisez-le pour reprendre les opérations."); return; }
    if (!result.ok) { setError(result.error); return; }
    let savingNotice: string | null = null;
    if (storageAvailable.current) {
      try {
        if (window.localStorage.getItem(STORAGE_KEY) !== savedRaw.current) {
          blocked.current = true; setError("Une autre version du carnet existe. Rechargez la page avant de continuer."); return;
        }
        const saved = saveShop(window.localStorage, result.value);
        if (saved.ok) savedRaw.current = JSON.stringify(result.value);
        else { storageAvailable.current = false; savingNotice = saved.error; }
      } catch { storageAvailable.current = false; savingNotice = "Sauvegarde impossible. Gardez cet onglet ouvert : les opérations restent dans cette session."; }
    }
    stateRef.current = result.value;
    setState(result.value);
    pendingReset.current = false;
    invalidate();
    setError(null);
    setText("");
    setNotice(savingNotice || message);
  }

  const recorder = useRecorder({
    onStart: () => { invalidate(false); recordingRevision.current = revision.current; setNotice("Je vous écoute… Appuyez à nouveau pour terminer (30 secondes maximum)."); setError(null); },
    onTranscribing: () => { if (recordingRevision.current === revision.current) { setBusy(true); setNotice("Transcription en cours avec OpenAI…"); } },
    onTranscript: (transcript) => {
      if (recordingRevision.current !== revision.current) return;
      setText(transcript.slice(0, 1000));
      sourceRef.current = "speech";
      void interpretValue(transcript.slice(0, 1000), "speech");
    },
    onError: (message) => { if (recordingRevision.current === revision.current) { pendingReset.current = false; updateProposal(null); setBusy(false); setError(message); setNotice(null); } },
  });

  function reset() {
    if (!window.confirm("Réinitialiser toutes les opérations et retrouver les données de démonstration ?")) return;
    performReset();
  }

  function performReset() {
    pendingReset.current = false;
    let message = "Carnet réinitialisé. Les données de démonstration sont prêtes.";
    try { window.localStorage.removeItem(STORAGE_KEY); savedRaw.current = null; storageAvailable.current = true; }
    catch { storageAvailable.current = false; message = "Carnet réinitialisé pour cette session. Le stockage local reste indisponible."; }
    blocked.current = false;
    stateRef.current = SAMPLE_SHOP;
    setState(SAMPLE_SHOP);
    invalidate(); setText(""); setError(null); setNotice(message);
  }

  return {
    state, summary: getSummary(state), proposal, text, error, notice, busy, engine, hydrated,
    recording: recorder.recording, canRecord: recorder.canRecord,
    onTextChange: (value) => changeText(value),
    onExample: (value) => changeText(value, "sample"),
    onInterpret: () => { if (!busy) void interpretValue(text, sourceRef.current); },
    onEngineChange: (value) => { pendingReset.current = false; invalidate(); setEngine(value); if (!blocked.current) setError(null); setNotice(value === "local" ? "Mode exemples locaux : phrases prises en charge, sans appel OpenAI." : "Mode OpenAI : votre phrase sera envoyée pour interprétation."); },
    onProposalChange: (value) => { pendingReset.current = false; updateProposal(value); if (!blocked.current) setError(null); },
    onDismissProposal: () => { pendingReset.current = false; updateProposal(null); setNotice(null); },
    onConfirm: () => { if (proposal && !busy && hydrated && !recorder.recording) commit(confirmTransaction(stateRef.current, proposal, new Date().toISOString()), confirmationMessage(proposal)); },
    onUndo: () => { if (!busy && !recorder.recording && hydrated) commit(undoLatest(stateRef.current), "Dernière opération annulée. Les montants et le stock ont été restaurés."); },
    onReset: reset,
    onRecordingToggle: () => { if (!busy && hydrated) { recordingRevision.current = revision.current; void recorder.toggle(); } },
  };
}
