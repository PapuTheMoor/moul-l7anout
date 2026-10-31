"use client";

import { ArrowDownLeft, ArrowUpRight, Banknote, BookOpen, Check, Coffee, Droplets, Milk, Package, ShoppingBag, Undo2, Wheat } from "lucide-react";
import type { ShopWorkspaceProps } from "@/domain/types";
import { initials, money } from "./format";
import { AnimatedMoney } from "./animated-money";
import { useLanguage } from "./language";

type CustomerProps = Pick<ShopWorkspaceProps, "state" | "busy" | "hydrated" | "onExample">;

export function CustomerLedger({ state, busy, hydrated, onExample }: CustomerProps) {
  const { t } = useLanguage();
  const total = state.customers.reduce((sum, customer) => sum + customer.balanceCentimes, 0);
  return (
    <section className="customer-card paper-card" id="clients" aria-labelledby="clients-heading">
      <div className="customer-card-title"><h2 id="clients-heading">{t("Les bons comptes.", "الحساب واضح.")}</h2><span className="count-badge">{state.customers.length} {t("clients", "زبناء")}</span></div>
      <p className="section-description">{t("Un petit crédit, une grande confiance.", "الكريدي والثقة بيناتنا.")}</p>
      <div className="customer-list">{state.customers.map((customer, index) => <div className="customer-row" key={customer.id}><span className={`customer-avatar avatar-${index % 3}`}>{initials(customer.name)}</span><div className="customer-details"><strong>{customer.name}</strong><span>{customer.balanceCentimes > 0 ? t("Crédit en cours", "باقي عليه الكريدي") : t("Tout est réglé", "خالص كلشي")}</span></div><strong className={`customer-balance ${customer.balanceCentimes === 0 ? "is-settled" : ""}`} data-testid={`customer-balance-${customer.id}`}>{customer.balanceCentimes === 0 ? <><Check size={14} aria-hidden="true" /> {t("Réglé", "خالص")}</> : <AnimatedMoney centimes={customer.balanceCentimes} />}</strong><button className="repayment-button" type="button" aria-label={t(`Préparer le remboursement de ${customer.name}`, `وجد خلاص ${customer.name}`)} title={t(`Préparer le remboursement de ${customer.name}`, `وجد خلاص ${customer.name}`)} disabled={!hydrated || busy || customer.balanceCentimes <= 0} onClick={() => { onExample(`${customer.name} khlles ${customer.balanceCentimes / 100} dirham`); document.getElementById("capture")?.scrollIntoView({ block: "start" }); }}><ArrowDownLeft size={18} aria-hidden="true" /></button></div>)}</div>
      <div className="credit-total"><div><span>{t("Total à récupérer", "المجموع اللي باقي")}</span><small lang="ar" dir="rtl">الحساب واضح</small></div><AnimatedMoney centimes={total} /></div>
      <p className="card-footnote"><ArrowDownLeft size={15} aria-hidden="true" /> {t("La flèche prépare un remboursement. Vous le validez ensuite.", "السهم كيوجد الخلاص، ومن بعد كتأكد.")}</p>
    </section>
  );
}

const productIcons = { milk: Milk, bread: Wheat, water: Droplets, sugar: Package, tea: Coffee };

export function ProductShelf({ state }: Pick<ShopWorkspaceProps, "state">) {
  const { t, language } = useLanguage();
  return <section className="product-section" id="produits" aria-labelledby="products-heading"><div className="panel-title"><h2 id="products-heading">{t("Les essentiels du hanout.", "سلعة الحانوت.")}</h2><span className="subtle-tag">{state.products.length} {t("produits de démonstration", "منتوجات تجريبية")}</span></div><div className="product-grid">{state.products.map((product) => {
    const Icon = productIcons[product.id as keyof typeof productIcons] ?? Package;
    return <article className={`product-card product-${product.id}`} key={product.id}><span className="product-art"><Icon size={30} strokeWidth={1.5} aria-hidden="true" /></span><div className="product-information"><h3>{language === "ar" ? ({ milk: "الحليب", bread: "الخبز", water: "الماء", sugar: "السكر", tea: "أتاي" } as Record<string, string>)[product.id] ?? product.name : product.name}</h3><strong>{money(product.priceCentimes)}</strong><span className="stock-line"><span className={product.stock < 5 ? "low-stock-dot" : "stock-dot"} /><span><strong data-testid={`product-stock-${product.id}`}>{product.stock}</strong> {t("en stock", "فالستوك")}</span></span></div></article>;
  })}</div></section>;
}

type ActivityProps = Pick<ShopWorkspaceProps, "state" | "busy" | "hydrated" | "onUndo">;

export function RecentActivity({ state, busy, hydrated, onUndo }: ActivityProps) {
  const { t } = useLanguage();
  const transactions = [...state.transactions].reverse().slice(0, 6);
  return <section className="activity-card paper-card" id="activite" aria-labelledby="activity-heading"><div className="panel-title"><h2 id="activity-heading">{t("Chaque geste, une trace.", "كل حركة مقيدة.")}</h2><button className="text-button" type="button" onClick={onUndo} disabled={!hydrated || busy || !state.transactions.length}><Undo2 size={17} aria-hidden="true" /> {t("Annuler la dernière opération", "رجع آخر عملية")}</button></div>{transactions.length ? <div className="activity-list">{transactions.map((transaction) => {
    const proposal = transaction.proposal;
    const isRepayment = proposal.kind === "repayment";
    const customer = proposal.kind === "customer" ? undefined : state.customers.find((item) => item.id === proposal.customerId);
    const title = proposal.kind === "customer" ? t(`Nouveau client · ${proposal.name}`, `زبون جديد · ${proposal.name}`) : isRepayment ? t(`${customer?.name ?? "Client"} a remboursé`, `${customer?.name ?? "الزبون"} خلص`) : proposal.payment === "credit" ? t(`Achat à crédit · ${customer?.name ?? "Client"}`, `شراء بالكريدي · ${customer?.name ?? "الزبون"}`) : t("Vente comptant", "بيعة بالكاش");
    return <div className="activity-row" key={proposal.id}><span className={`activity-icon ${isRepayment ? "repayment" : ""}`}>{isRepayment ? <Banknote size={19} aria-hidden="true" /> : <ShoppingBag size={19} aria-hidden="true" />}</span><div className="activity-details"><strong>{title}</strong><span dir="auto">{proposal.originalInput}</span></div><div className="activity-amount"><strong>{money(transaction.totalCentimes)}</strong><span>{new Date(transaction.recordedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Casablanca" })}</span></div><ArrowUpRight className="activity-arrow" size={17} aria-hidden="true" /></div>;
  })}</div> : <div className="activity-empty"><span className="empty-notebook"><BookOpen size={27} strokeWidth={1.5} aria-hidden="true" /></span><div><strong>{t("Une nouvelle page commence.", "صفحة جديدة بدات.")}</strong><p>{t("Votre première opération apparaîtra ici après confirmation.", "أول عملية غاتبّان هنا من بعد ما تأكدها.")}</p></div></div>}</section>;
}
