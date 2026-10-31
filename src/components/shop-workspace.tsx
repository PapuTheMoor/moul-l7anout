"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUpRight, BookOpen, CalendarDays, Check, CircleHelp, Flower2, LayoutDashboard, List, Package, RotateCcw, ShieldCheck, Store } from "lucide-react";
import type { ShopWorkspaceProps } from "@/domain/types";
import { CaptureStudio } from "./capture-studio";
import { ProposalCard } from "./proposal-card";
import { CustomerLedger, ProductShelf, RecentActivity } from "./shop-panels";
import { AnimatedMoney, physicalSpring } from "./animated-money";
import { LanguageContext, useLanguage, type Language } from "./language";

const navigation = [
  { id: "overview", label: "Vue d’ensemble", icon: LayoutDashboard },
  { id: "clients", label: "Carnet clients", icon: BookOpen },
  { id: "produits", label: "Produits", icon: Package },
  { id: "activite", label: "Activité", icon: List },
];

export function ShopWorkspace(props: ShopWorkspaceProps) {
  const [language, setLanguage] = useState<Language>("ar");
  return <LanguageContext.Provider value={language}><WorkspaceContent {...props} language={language} setLanguage={setLanguage} /></LanguageContext.Provider>;
}

function WorkspaceContent(props: ShopWorkspaceProps & { language: Language; setLanguage: (language: Language) => void }) {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState("overview");
  const [showHelp, setShowHelp] = useState(false);
  const metrics = useRef<HTMLElement>(null);
  const lastCount = useRef(props.summary.transactionCount);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (props.hydrated && lastCount.current !== props.summary.transactionCount) metrics.current?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
    lastCount.current = props.summary.transactionCount;
  }, [props.summary.transactionCount, props.hydrated, reducedMotion]);
  const date = new Intl.DateTimeFormat(props.language === "ar" ? "ar-MA" : "fr-FR", { day: "numeric", month: "long", timeZone: "Africa/Casablanca" }).format(new Date());
  const completed = props.notice?.includes("enregistré") || props.notice?.includes("annulée");
  return (
    <div className="shop-workspace" dir={props.language === "ar" ? "rtl" : "ltr"} lang={props.language}>
      <aside className="sidebar" aria-label={t("Navigation principale", "القائمة الرئيسية")}>
        <a className="brand" href="#overview" aria-label={t("Moul7anout, accueil", "مول الحانوت، الصفحة الرئيسية")}><Store size={27} strokeWidth={1.5} aria-hidden="true" /><span>Moul<span className="brand-seven">7</span>anout<span className="brand-subtitle">{t("Le carnet du quotidien", "دفتر الحانوت")}</span></span></a>
        <div className="shop-identity"><span className="shop-avatar" lang="ar">ح</span><div><strong>{t("Hanout du quartier", "حانوت الحومة")}</strong><span>{t("Casablanca · boutique démo", "الدار البيضاء · حانوت تجريبي")}</span></div></div>
        <nav className="sidebar-nav">{navigation.map(({ id, label, icon: Icon }) => <a href={`#${id}`} className={activeSection === id ? "active" : ""} key={id} onClick={() => setActiveSection(id)} aria-label={t(label, ({"Vue d’ensemble":"الرئيسية", "Carnet clients":"دفتر الزبناء", "Produits":"المنتوجات", "Activité":"الحركات"} as Record<string, string>)[label])} aria-current={activeSection === id ? "location" : undefined}><Icon size={19} strokeWidth={1.7} aria-hidden="true" /><span>{t(label, ({"Vue d’ensemble":"الرئيسية", "Carnet clients":"دفتر الزبناء", "Produits":"المنتوجات", "Activité":"الحركات"} as Record<string, string>)[label])}</span>{id === "clients" && <span className="nav-count">{props.state.customers.length}</span>}</a>)}</nav>
        <div className="sidebar-story"><Flower2 size={27} strokeWidth={1.3} aria-hidden="true" /><p>{t("Moins de paperasse.", "حسابات واضحة.")}<br /><em>{t("Plus de tranquillité.", "وراحة البال.")}</em></p><span>{t("Votre hanout mérite un bon carnet.", "حانوتك يستاهل دفتر مزيان.")}</span></div>
        <div className="sidebar-bottom"><button className="sidebar-help" type="button" onClick={() => setShowHelp((value) => !value)} aria-expanded={showHelp}><CircleHelp size={18} aria-hidden="true" /><span>{t("Comment ça marche ?", "كيفاش كيخدم؟")}</span><ArrowUpRight size={15} aria-hidden="true" /></button><button className="reset-button" type="button" disabled={props.busy || !props.hydrated || props.recording} onClick={props.onReset}><RotateCcw size={16} aria-hidden="true" /> {t("Réinitialiser le carnet", "رجع الدفتر من الأول")}</button><div className="sidebar-footer">{t("Pensé pour nos hanouts.", "معمول لحوانتنا.")}<span>MA</span></div></div>
      </aside>

      <main className="main-workspace" id="overview">
        <header className="topbar"><div className="breadcrumb"><span>{t("Mon hanout", "حانوتي")}</span><span>/</span><strong>{t("Le carnet", "الدفتر")}</strong></div><div className="topbar-right"><div className="language-switch" role="group" aria-label="Langue / اللغة"><button type="button" aria-pressed={props.language === "ar"} onClick={() => props.setLanguage("ar")}>الدارجة</button><button type="button" aria-pressed={props.language === "fr"} onClick={() => props.setLanguage("fr")}>FR</button></div><span className="demo-badge"><span /> {t("Données de démonstration", "بيانات تجريبية")}</span><span className="owner-avatar" aria-label={t("Compte de démonstration", "حساب تجريبي")}>M</span></div></header>
        <div className="workspace-content">
          <section className="hero-heading" aria-labelledby="page-heading"><div><h1 id="page-heading">{t("Votre hanout,", "حانوتك،")} <em>{t("l’esprit tranquille.", "وراحة بالك.")}</em></h1><p>{t("Parlez comme toujours. Gardez les comptes autrement.", "هضر كيف ديما، وخلي حساباتك واضحة.")}</p></div><span className="date-note"><CalendarDays size={17} aria-hidden="true" />{date}</span></section>

          <AnimatePresence initial={false}>{showHelp && <motion.section className="help-panel" key="help" aria-label={t("Comment ça marche", "كيفاش كيخدم")} initial={reducedMotion ? false : { opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={reducedMotion ? { duration: 0.12, ease: "linear" } : physicalSpring}><div><strong>{t("Racontez", "هضر")}</strong><p>{t("Parlez ou écrivez une vente, un crédit ou un remboursement.", "هضر ولا كتب على بيعة، كريدي ولا خلاص.")}</p></div><div><strong>{t("Vérifiez", "راجع")}</strong><p>{t("Corrigez le client, les produits et les quantités si besoin.", "راجع الزبون والمنتوجات والكمية وصححهم إلا بغيتي.")}</p></div><div><strong>{t("Validez", "أكد")}</strong><p>{t("Le carnet et les stocks changent après confirmation.", "الدفتر والسلعة كيتبدلو غير من بعد التأكيد.")}</p></div></motion.section>}</AnimatePresence>

          <section className="metrics-grid" aria-label={t("Résumé du carnet", "ملخص الدفتر")} ref={metrics}>
            <div className="metric-card"><span className="metric-label">{t("Ventes enregistrées", "البيعات المسجلة")}</span><AnimatedMoney className="metric-value" testId="summary-sales" centimes={props.summary.salesCentimes} /><p>{props.language === "ar" ? `${props.summary.transactionCount} حركة فالدفتر` : `${props.summary.transactionCount} opération${props.summary.transactionCount !== 1 ? "s" : ""} dans le carnet`}</p></div>
            <div className="metric-card"><span className="metric-label">{t("Argent encaissé", "الفلوس المقبوضة")}</span><AnimatedMoney className="metric-value" testId="summary-cash" centimes={props.summary.cashCentimes} /><p>{t("Comptant + remboursements", "الكاش + الخلاص")}</p></div>
            <div className="metric-card credit-metric"><span className="metric-label">{t("Crédit clients", "كريدي الزبناء")}</span><AnimatedMoney className="metric-value" testId="summary-credit" centimes={props.summary.creditCentimes} /><p>{t("À récupérer, sans rien oublier", "باقي خاصو يتخلص")}</p></div>
          </section>

          <div className="main-columns">
            <div className="capture-column">
              <CaptureStudio {...props} />
              <div className="workspace-live-region" aria-live="polite" aria-atomic="true">{props.notice && <motion.div className={`notice-banner ${completed ? "is-complete" : ""}`} key={props.notice} initial={reducedMotion ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} transition={reducedMotion ? { duration: 0.12, ease: "linear" } : physicalSpring}>{completed ? <Check size={19} aria-hidden="true" /> : <ShieldCheck size={18} aria-hidden="true" />}<span>{props.notice}</span></motion.div>}</div>
              {props.error && <div className="error-banner" role="alert"><CircleHelp size={19} aria-hidden="true" /><div><strong>{t("On reprend tranquillement.", "نعاودو بشوية.")}</strong><span>{props.error}</span></div></div>}
            </div>
            <div className="ledger-column"><AnimatePresence initial={false}>{props.proposal && <ProposalCard key={props.proposal.id} {...props} />}</AnimatePresence><CustomerLedger {...props} /></div>
          </div>

          <ProductShelf state={props.state} />
          <RecentActivity {...props} />
          <footer className="workspace-footer"><span><ShieldCheck size={15} aria-hidden="true" /> {t("Carnet local · données de démonstration", "دفتر محلي · بيانات تجريبية")}</span><span>{t("Un prototype marocain, fait avec soin.", "نموذج مغربي مصنوع بعناية.")}</span></footer>
        </div>
      </main>
    </div>
  );
}
