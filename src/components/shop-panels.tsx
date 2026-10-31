"use client";

import { ArrowDownLeft, ArrowUpRight, Banknote, BookOpen, Check, Coffee, Droplets, Milk, Package, ShoppingBag, Undo2, Wheat } from "lucide-react";
import type { ShopWorkspaceProps } from "@/domain/types";
import { initials, money } from "./format";
import { AnimatedMoney } from "./animated-money";

type CustomerProps = Pick<ShopWorkspaceProps, "state" | "busy" | "hydrated" | "onExample">;

export function CustomerLedger({ state, busy, hydrated, onExample }: CustomerProps) {
  const total = state.customers.reduce((sum, customer) => sum + customer.balanceCentimes, 0);
  return (
    <section className="customer-card paper-card" id="clients" aria-labelledby="clients-heading">
      <div className="customer-card-title"><h2 id="clients-heading">Les bons comptes.</h2><span className="count-badge">{state.customers.length} clients</span></div>
      <p className="section-description">Un petit crédit, une grande confiance.</p>
      <div className="customer-list">{state.customers.map((customer, index) => <div className="customer-row" key={customer.id}><span className={`customer-avatar avatar-${index % 3}`}>{initials(customer.name)}</span><div className="customer-details"><strong>{customer.name}</strong><span>{customer.balanceCentimes > 0 ? "Crédit en cours" : "Tout est réglé"}</span></div><strong className={`customer-balance ${customer.balanceCentimes === 0 ? "is-settled" : ""}`} data-testid={`customer-balance-${customer.id}`}>{customer.balanceCentimes === 0 ? <><Check size={14} aria-hidden="true" /> Réglé</> : <AnimatedMoney centimes={customer.balanceCentimes} />}</strong><button className="repayment-button" type="button" aria-label={`Préparer le remboursement de ${customer.name}`} title={`Préparer le remboursement de ${customer.name}`} disabled={!hydrated || busy || customer.balanceCentimes <= 0} onClick={() => { onExample(`${customer.name} khlles ${customer.balanceCentimes / 100} dirham`); document.getElementById("capture")?.scrollIntoView({ block: "start" }); }}><ArrowDownLeft size={18} aria-hidden="true" /></button></div>)}</div>
      <div className="credit-total"><div><span>Total à récupérer</span><small lang="ar" dir="rtl">الحساب واضح</small></div><AnimatedMoney centimes={total} /></div>
      <p className="card-footnote"><ArrowDownLeft size={15} aria-hidden="true" /> La flèche prépare un remboursement. Vous le validez ensuite.</p>
    </section>
  );
}

const productIcons = { milk: Milk, bread: Wheat, water: Droplets, sugar: Package, tea: Coffee };

export function ProductShelf({ state }: Pick<ShopWorkspaceProps, "state">) {
  return <section className="product-section" id="produits" aria-labelledby="products-heading"><div className="panel-title"><h2 id="products-heading">Les essentiels du hanout.</h2><span className="subtle-tag">{state.products.length} produits de démonstration</span></div><div className="product-grid">{state.products.map((product) => {
    const Icon = productIcons[product.id as keyof typeof productIcons] ?? Package;
    return <article className={`product-card product-${product.id}`} key={product.id}><span className="product-art"><Icon size={30} strokeWidth={1.5} aria-hidden="true" /></span><div className="product-information"><h3>{product.name}</h3><strong>{money(product.priceCentimes)}</strong><span className="stock-line"><span className={product.stock < 5 ? "low-stock-dot" : "stock-dot"} /><span><strong data-testid={`product-stock-${product.id}`}>{product.stock}</strong> en stock</span></span></div></article>;
  })}</div></section>;
}

type ActivityProps = Pick<ShopWorkspaceProps, "state" | "busy" | "hydrated" | "onUndo">;

export function RecentActivity({ state, busy, hydrated, onUndo }: ActivityProps) {
  const transactions = [...state.transactions].reverse().slice(0, 6);
  return <section className="activity-card paper-card" id="activite" aria-labelledby="activity-heading"><div className="panel-title"><h2 id="activity-heading">Chaque geste, une trace.</h2><button className="text-button" type="button" onClick={onUndo} disabled={!hydrated || busy || !state.transactions.length}><Undo2 size={17} aria-hidden="true" /> Annuler la dernière opération</button></div>{transactions.length ? <div className="activity-list">{transactions.map((transaction) => {
    const proposal = transaction.proposal;
    const isRepayment = proposal.kind === "repayment";
    const customer = state.customers.find((item) => item.id === proposal.customerId);
    const title = isRepayment ? `${customer?.name ?? "Client"} a remboursé` : proposal.payment === "credit" ? `Achat à crédit · ${customer?.name ?? "Client"}` : "Vente comptant";
    return <div className="activity-row" key={proposal.id}><span className={`activity-icon ${isRepayment ? "repayment" : ""}`}>{isRepayment ? <Banknote size={19} aria-hidden="true" /> : <ShoppingBag size={19} aria-hidden="true" />}</span><div className="activity-details"><strong>{title}</strong><span dir="auto">{proposal.originalInput}</span></div><div className="activity-amount"><strong>{money(transaction.totalCentimes)}</strong><span>{new Date(transaction.recordedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Casablanca" })}</span></div><ArrowUpRight className="activity-arrow" size={17} aria-hidden="true" /></div>;
  })}</div> : <div className="activity-empty"><span className="empty-notebook"><BookOpen size={27} strokeWidth={1.5} aria-hidden="true" /></span><div><strong>Une nouvelle page commence.</strong><p>Votre première opération apparaîtra ici après confirmation.</p></div></div>}</section>;
}
