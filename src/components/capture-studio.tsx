"use client";

import { ArrowUpRight, Check, Keyboard, LoaderCircle, Mic, Sparkles, Square } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { ShopWorkspaceProps } from "@/domain/types";
import { physicalSpring } from "./animated-money";
import { useLanguage } from "./language";

const examples = [
  { label: "Achat à crédit", text: "Ahmed khda jouj l7lib, mazal makhlessch" },
  { label: "Vente comptant", text: "B3t jouj khobz cash" },
  { label: "Remboursement", text: "Ahmed khlles 49 dirham" },
];

export function CaptureStudio(props: ShopWorkspaceProps) {
  const { language, t } = useLanguage();
  const demoOnly = process.env.NEXT_PUBLIC_DEMO_ONLY === "1";
  const disabled = props.busy || !props.hydrated;
  const reducedMotion = useReducedMotion();
  return (
    <section className={`capture-card ${props.recording ? "is-recording" : ""}`} id="capture" aria-labelledby="capture-heading">
      <div className="capture-title-row">
        <h2 id="capture-heading">{t("Dites-le, c’est noté.", "هضر، وحنا نقيدو.")}</h2>
        <span className={`engine-indicator ${props.engine === "local" ? "is-local" : ""}`}><span />{props.engine === "openai" ? "OpenAI" : t("Exemples locaux", "أمثلة محلية")}</span>
      </div>
      <p className="capture-description">{t("Une vente, un crédit, un remboursement, un nouveau client.", "بيعة، كريدي، خلاص، ولا زبون جديد.")}<br />{t("Racontez simplement ce qui vient de se passer.", "قول لينا غير شنو وقع فالحانوت.")}</p>

      <div className="voice-surface">
        <div className="voice-label">
          <strong>{props.recording ? t("Je vous écoute…", "كنسمع ليك…") : t("B darija, comme au hanout.", "بالدارجة، كيف فالحانوت.")}</strong>
          <span>{props.recording ? t("Appuyez pour terminer · 30 secondes maximum", "ضغط باش تسالي · حتى لـ ٣٠ ثانية") : t("Appuyez, parlez. Vous gardez le dernier mot.", "ضغط وهضر، والتأكيد ديما عندك.")}</span>
          <span className="audio-disclosure">{demoOnly ? t("Démo sans clé : saisie écrite et exemples locaux", "نسخة تجريبية بلا مفتاح: كتب أو جرب الأمثلة المحلية") : t("Transcription audio via OpenAI", "تحويل الصوت لنص عبر OpenAI")}</span>
        </div>
        <motion.button
          type="button"
          className={`mic-button ${props.recording ? "is-recording" : ""}`}
          onClick={props.onRecordingToggle}
          disabled={disabled || !props.canRecord || demoOnly}
          tabIndex={disabled || !props.canRecord || demoOnly ? -1 : 0}
          aria-label={props.recording ? t("Terminer l’enregistrement", "سالي التسجيل") : t("Enregistrer une opération en Darija", "سجل عملية بالدارجة")}
          aria-pressed={props.recording}
          title={props.canRecord ? t("Enregistrer en Darija", "سجل بالدارجة") : t("Microphone indisponible : utilisez le texte", "الميكرو ما خدامش، كتب بلاصتو")}
          whileTap={reducedMotion ? undefined : { scale: 0.94 }}
          whileHover={reducedMotion || disabled ? undefined : { scale: 1.035 }}
          transition={physicalSpring}
        >
          {props.recording ? <Square size={28} fill="currentColor" aria-hidden="true" /> : <Mic size={36} strokeWidth={1.6} aria-hidden="true" />}
        </motion.button>
      </div>
      {!props.canRecord && props.hydrated && <p className="microphone-hint">{t("Le microphone n’est pas disponible. Vous pouvez écrire votre phrase.", "الميكرو ما خدامش. تقدر تكتب الجملة ديالك.")}</p>}

      <div className="input-caption"><label htmlFor="shop-input"><Keyboard size={16} aria-hidden="true" /> {t("Ou écrivez en darija, arabe ou français", "ولا كتب بالدارجة، العربية ولا الفرنسية")}</label><span>{props.text.length}/1000</span></div>
      <textarea id="shop-input" className="shop-input" rows={2} dir="auto" aria-label={t("Que s’est-il passé dans votre hanout ?", "شنو وقع فالحانوت؟")} placeholder={t("Ahmed khda jouj l7lib, mazal makhlessch…", "أحمد خدا جوج حليب ومازال ما خلصش…")} value={props.text} maxLength={1000} onChange={(event) => props.onTextChange(event.target.value)} disabled={!props.hydrated || props.recording} />

      <div className="capture-actions">
        <div className="engine-switch" role="group" aria-label={t("Mode d’interprétation", "طريقة الفهم")}>
          <button type="button" className={props.engine === "openai" ? "selected" : ""} aria-pressed={props.engine === "openai"} disabled={disabled || props.recording || demoOnly} onClick={() => props.onEngineChange("openai")}><Sparkles size={14} aria-hidden="true" /> OpenAI</button>
          <button type="button" className={props.engine === "local" ? "selected" : ""} aria-pressed={props.engine === "local"} disabled={disabled || props.recording} onClick={() => props.onEngineChange("local")}>{t("Exemples locaux", "أمثلة محلية")}</button>
        </div>
        <motion.button type="button" className="primary-button interpret-button" disabled={disabled || props.recording || !props.text.trim()} tabIndex={disabled || props.recording || !props.text.trim() ? -1 : 0} onClick={props.onInterpret} whileTap={reducedMotion ? undefined : { scale: 0.98 }} transition={physicalSpring}>
          {props.busy ? <LoaderCircle className="spin" size={17} aria-hidden="true" /> : <Sparkles size={17} aria-hidden="true" />}
          {props.busy ? t("Un instant…", "تسنى شوية…") : t("Comprendre l’opération", "فهم العملية")}
          {!props.busy && <ArrowUpRight size={17} aria-hidden="true" />}
        </motion.button>
      </div>

      <div className="example-section"><span className="example-label">{t("Essayez avec un exemple de saisie", "جرب بمثال مكتوب")}</span><div className="example-buttons">{examples.map((example) => <button type="button" key={example.label} aria-label={t(example.label, ({"Achat à crédit":"شراء بالكريدي", "Vente comptant":"بيعة بالكاش", "Remboursement":"خلاص"} as Record<string, string>)[example.label])} onClick={() => props.onExample(example.text)} disabled={disabled || props.recording} title={example.text}>{t(example.label, ({"Achat à crédit":"شراء بالكريدي", "Vente comptant":"بيعة بالكاش", "Remboursement":"خلاص"} as Record<string, string>)[example.label])}<ArrowUpRight size={14} aria-hidden="true" /></button>)}<button type="button" onClick={() => props.onExample(language === "ar" ? "زيد زبون جديد سميتو ياسين" : "Ajoute un nouveau client Yassine")} disabled={disabled || props.recording}>{t("Nouveau client", "زبون جديد")}<ArrowUpRight size={14} aria-hidden="true" /></button></div></div>
      <p className="voice-help">{demoOnly ? t("La voix et OpenAI seront disponibles après configuration d’une clé serveur.", "الصوت و OpenAI غادي يخدمو من بعد إعداد المفتاح فالخادم.") : t("Essayez à la voix : « ajoute Sarah », « confirme », « annule » ou « français ».", "جرب بالصوت: «زيد زبون سارة»، «أكد»، «تراجع»، «مسح الدفتر»، «خلص سارة ٢٠ درهم».")}</p>
      <p className="trust-caption"><Check size={15} aria-hidden="true" /> {t("Rien n’est enregistré sans votre confirmation.", "حتى حاجة ما كتتقيد حتى تأكدها.")}</p>
    </section>
  );
}
