"use client";

import { ArrowRight, Check, Plus, ReceiptText, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { motion, useIsPresent, useReducedMotion } from "motion/react";
import type { ShopWorkspaceProps, TransactionProposal } from "@/domain/types";
import { money } from "./format";
import { AnimatedMoney, physicalSpring } from "./animated-money";

type Props = Pick<ShopWorkspaceProps, "state" | "proposal" | "busy" | "onProposalChange" | "onConfirm" | "onDismissProposal">;

export function ProposalCard({ state, proposal, busy: pending, onProposalChange, onConfirm, onDismissProposal }: Props) {
  const heading = useRef<HTMLHeadingElement>(null);
  const headingId = useId();
  const focusedProposal = useRef<string | null>(null);
  const proposalId = proposal?.id;
  const reducedMotion = useReducedMotion();
  const present = useIsPresent();
  const busy = pending || !present;
  useEffect(() => {
    if (!proposalId || !present || focusedProposal.current === proposalId) return;
    focusedProposal.current = proposalId;
    heading.current?.focus({ preventScroll: true });
    if (window.innerWidth < 900) heading.current?.closest("section")?.scrollIntoView({ behavior: reducedMotion ? "instant" : "smooth", block: "start" });
  }, [proposalId, reducedMotion, present]);
  if (!proposal) return null;
  const total = proposal.kind === "repayment" ? proposal.amountCentimes : proposal.lines.reduce((sum, line) => sum + (state.products.find((product) => product.id === line.productId)?.priceCentimes ?? 0) * line.quantity, 0);
  const customer = state.customers.find((item) => item.id === proposal.customerId);
  const update = (value: TransactionProposal) => onProposalChange(value);
  return (
    <motion.section className="proposal-card" aria-labelledby={headingId} aria-hidden={!present} inert={!present} style={{ pointerEvents: present ? undefined : "none" }} initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.985 }} transition={reducedMotion ? { duration: 0.12, ease: "linear" } : physicalSpring}>
      <div className="proposal-topline"><span className="draft-tag"><ReceiptText size={15} aria-hidden="true" /> Brouillon à vérifier</span><button className="icon-button" type="button" disabled={busy} onClick={onDismissProposal} aria-label="Fermer la proposition"><X size={19} aria-hidden="true" /></button></div>
      <h2 id={headingId} ref={heading} tabIndex={-1}>{proposal.kind === "repayment" ? "Un compte qui s’allège." : "Voilà ce que j’ai compris."}</h2>
      <p className="original-input" dir="auto">“{proposal.originalInput}”</p>
      {proposal.kind === "sale" ? (
        <>
          <div className="proposal-fields two-fields"><label>Règlement<select aria-label="Mode de règlement" value={proposal.payment} disabled={busy} onChange={(event) => update({ ...proposal, payment: event.target.value as "cash" | "credit" })}><option value="credit">À crédit</option><option value="cash">Comptant</option></select></label><label>Client<select aria-label="Client de l’opération" value={proposal.customerId ?? ""} disabled={busy} onChange={(event) => update({ ...proposal, customerId: event.target.value || null })}><option value="">Client de passage</option>{state.customers.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label></div>
          <div className="proposal-line-labels"><span>Produit</span><span>Qté</span><span>Total</span><span /></div>
          <div className="proposal-lines">{proposal.lines.map((line, index) => {
            const product = state.products.find((item) => item.id === line.productId);
            return <div className="proposal-line" key={`${index}-${line.productId}`}><label><span className="sr-only">Produit {index + 1}</span><select aria-label={`Produit ${index + 1}`} value={line.productId} disabled={busy} onChange={(event) => update({ ...proposal, lines: proposal.lines.map((item, itemIndex) => itemIndex === index ? { ...item, productId: event.target.value } : item) })}>{state.products.map((item) => <option key={item.id} value={item.id}>{item.name} · {money(item.priceCentimes)}</option>)}</select><span className="unit-price">{product ? money(product.priceCentimes) : "Produit inconnu"} / unité</span></label><input aria-label={`Quantité produit ${index + 1}`} type="number" inputMode="numeric" min={1} step={1} value={line.quantity} disabled={busy} onChange={(event) => update({ ...proposal, lines: proposal.lines.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Number(event.target.value) } : item) })} /><strong>{money((product?.priceCentimes ?? 0) * line.quantity)}</strong><button className="icon-button remove-line" type="button" aria-label={`Retirer produit ${index + 1}`} disabled={busy || proposal.lines.length < 2} onClick={() => update({ ...proposal, lines: proposal.lines.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={16} aria-hidden="true" /></button></div>;
          })}</div>
          <button className="text-button add-line" type="button" disabled={busy || proposal.lines.length >= 5} onClick={() => update({ ...proposal, lines: [...proposal.lines, { productId: state.products[0].id, quantity: 1 }] })}><Plus size={16} aria-hidden="true" /> Ajouter un produit</button>
        </>
      ) : <div className="proposal-fields two-fields"><label>Client<select aria-label="Client du remboursement" value={proposal.customerId} disabled={busy} onChange={(event) => update({ ...proposal, customerId: event.target.value })}>{state.customers.map((item) => <option value={item.id} key={item.id}>{item.name} · {money(item.balanceCentimes)} à régler</option>)}</select></label><label>Montant reçu (DH)<input aria-label="Montant du remboursement" type="number" min={0.01} step={0.01} inputMode="decimal" value={proposal.amountCentimes / 100} disabled={busy} onChange={(event) => update({ ...proposal, amountCentimes: Math.round(Number(event.target.value) * 100) })} /></label></div>}
      <div className="proposal-total"><div><span>{proposal.kind === "repayment" ? "Remboursement reçu" : proposal.payment === "credit" ? "À ajouter au crédit" : "À encaisser"}</span><small>{proposal.kind === "repayment" ? `Compte de ${customer?.name ?? "votre client"}` : "Prix du catalogue · calcul vérifié"}</small></div><AnimatedMoney centimes={total} /></div>
      <div className="proposal-buttons"><button className="secondary-button" type="button" disabled={busy} onClick={onDismissProposal}>Annuler</button><motion.button className="primary-button" type="button" disabled={busy || !Number.isSafeInteger(total) || total <= 0} tabIndex={busy || !Number.isSafeInteger(total) || total <= 0 ? -1 : 0} onClick={onConfirm} whileTap={reducedMotion ? undefined : { scale: 0.98 }} transition={physicalSpring}><Check size={17} aria-hidden="true" /> Confirmer l’opération <ArrowRight size={17} aria-hidden="true" /></motion.button></div>
    </motion.section>
  );
}
