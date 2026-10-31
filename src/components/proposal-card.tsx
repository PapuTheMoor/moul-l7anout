"use client";

import { ArrowRight, Check, Plus, ReceiptText, Trash2, X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { motion, useIsPresent, useReducedMotion } from "motion/react";
import type { ShopWorkspaceProps, TransactionProposal } from "@/domain/types";
import { money } from "./format";
import { AnimatedMoney, physicalSpring } from "./animated-money";
import { useLanguage } from "./language";

type Props = Pick<ShopWorkspaceProps, "state" | "proposal" | "busy" | "onProposalChange" | "onConfirm" | "onDismissProposal">;

export function ProposalCard({ state, proposal, busy: pending, onProposalChange, onConfirm, onDismissProposal }: Props) {
  const { t } = useLanguage();
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
  const total = proposal.kind === "customer" ? 0 : proposal.kind === "repayment" ? proposal.amountCentimes : proposal.lines.reduce((sum, line) => sum + (state.products.find((product) => product.id === line.productId)?.priceCentimes ?? 0) * line.quantity, 0);
  const customer = proposal.kind === "customer" ? undefined : state.customers.find((item) => item.id === proposal.customerId);
  const update = (value: TransactionProposal) => onProposalChange(value);
  return (
    <motion.section className="proposal-card" aria-labelledby={headingId} aria-hidden={!present} inert={!present} style={{ pointerEvents: present ? undefined : "none" }} initial={reducedMotion ? false : { opacity: 0, y: 16, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, scale: 0.985 }} transition={reducedMotion ? { duration: 0.12, ease: "linear" } : physicalSpring}>
      <div className="proposal-topline"><span className="draft-tag"><ReceiptText size={15} aria-hidden="true" /> {t("Brouillon à vérifier", "راجع قبل التأكيد")}</span><button className="icon-button" type="button" disabled={busy} onClick={onDismissProposal} aria-label={t("Fermer la proposition", "سد الاقتراح")}><X size={19} aria-hidden="true" /></button></div>
      <h2 id={headingId} ref={heading} tabIndex={-1}>{proposal.kind === "customer" ? t("Un nouveau client.", "زبون جديد.") : proposal.kind === "repayment" ? t("Un compte qui s’allège.", "الحساب كينقص.") : t("Voilà ce que j’ai compris.", "ها شنو فهمت.")}</h2>
      <p className="original-input" dir="auto">“{proposal.originalInput}”</p>
      {proposal.kind === "customer" ? <div className="proposal-fields"><label>{t("Nom du client", "سمية الزبون")}<input aria-label={t("Nom du client", "سمية الزبون")} dir="auto" value={proposal.name} disabled={busy} maxLength={100} onChange={(event) => update({ ...proposal, name: event.target.value })} /></label></div> : proposal.kind === "sale" ? (
        <>
          <div className="proposal-fields two-fields"><label>{t("Règlement", "طريقة الخلاص")}<select aria-label={t("Mode de règlement", "طريقة الخلاص")} value={proposal.payment} disabled={busy} onChange={(event) => update({ ...proposal, payment: event.target.value as "cash" | "credit" })}><option value="credit">{t("À crédit", "كريدي")}</option><option value="cash">{t("Comptant", "كاش")}</option></select></label><label>{t("Client", "الزبون")}<select aria-label={t("Client de l’opération", "زبون العملية")} value={proposal.customerId ?? ""} disabled={busy} onChange={(event) => update({ ...proposal, customerId: event.target.value || null })}><option value="">{t("Client de passage", "زبون عابر")}</option>{state.customers.map((item) => <option value={item.id} key={item.id}>{item.name}</option>)}</select></label></div>
          <div className="proposal-line-labels"><span>{t("Produit", "المنتوج")}</span><span>{t("Qté", "العدد")}</span><span>{t("Total", "المجموع")}</span><span /></div>
          <div className="proposal-lines">{proposal.lines.map((line, index) => {
            const product = state.products.find((item) => item.id === line.productId);
            return <div className="proposal-line" key={`${index}-${line.productId}`}><label><span className="sr-only">Produit {index + 1}</span><select aria-label={t(`Produit ${index + 1}`, `المنتوج ${index + 1}`)} value={line.productId} disabled={busy} onChange={(event) => update({ ...proposal, lines: proposal.lines.map((item, itemIndex) => itemIndex === index ? { ...item, productId: event.target.value } : item) })}>{state.products.map((item) => <option key={item.id} value={item.id}>{item.name} · {money(item.priceCentimes)}</option>)}</select><span className="unit-price">{product ? money(product.priceCentimes) : t("Produit inconnu", "منتوج مجهول")} / {t("unité", "الواحدة")}</span></label><input aria-label={t(`Quantité produit ${index + 1}`, `عدد المنتوج ${index + 1}`)} type="number" inputMode="numeric" min={1} step={1} value={line.quantity} disabled={busy} onChange={(event) => update({ ...proposal, lines: proposal.lines.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Number(event.target.value) } : item) })} /><strong>{money((product?.priceCentimes ?? 0) * line.quantity)}</strong><button className="icon-button remove-line" type="button" aria-label={t(`Retirer produit ${index + 1}`, `حيد المنتوج ${index + 1}`)} disabled={busy || proposal.lines.length < 2} onClick={() => update({ ...proposal, lines: proposal.lines.filter((_, itemIndex) => itemIndex !== index) })}><Trash2 size={16} aria-hidden="true" /></button></div>;
          })}</div>
          <button className="text-button add-line" type="button" disabled={busy || proposal.lines.length >= 5} onClick={() => update({ ...proposal, lines: [...proposal.lines, { productId: state.products[0].id, quantity: 1 }] })}><Plus size={16} aria-hidden="true" /> {t("Ajouter un produit", "زيد منتوج")}</button>
        </>
      ) : <div className="proposal-fields two-fields"><label>{t("Client", "الزبون")}<select aria-label={t("Client du remboursement", "الزبون اللي خلص")} value={proposal.customerId} disabled={busy} onChange={(event) => update({ ...proposal, customerId: event.target.value })}>{state.customers.map((item) => <option value={item.id} key={item.id}>{item.name} · {money(item.balanceCentimes)} {t("à régler", "باقي")}</option>)}</select></label><label>{t("Montant reçu (DH)", "شحال خلص (درهم)")}<input aria-label={t("Montant du remboursement", "مبلغ الخلاص")} type="number" min={0.01} step={0.01} inputMode="decimal" value={proposal.amountCentimes / 100} disabled={busy} onChange={(event) => update({ ...proposal, amountCentimes: Math.round(Number(event.target.value) * 100) })} /></label></div>}
      <div className="proposal-total"><div><span>{proposal.kind === "customer" ? t("Nouveau client", "زبون جديد") : proposal.kind === "repayment" ? t("Remboursement reçu", "الخلاص المقبوض") : proposal.payment === "credit" ? t("À ajouter au crédit", "غادي يتزاد فالكريدي") : t("À encaisser", "غادي يتقبض")}</span><small>{proposal.kind === "customer" ? t("Solde initial : 0 DH", "الحساب فالأول: ٠ درهم") : proposal.kind === "repayment" ? t(`Compte de ${customer?.name ?? "votre client"}`, `حساب ${customer?.name ?? "الزبون"}`) : t("Prix du catalogue · calcul vérifié", "الثمن من الكاتالوغ · الحساب مدقق")}</small></div>{proposal.kind !== "customer" && <AnimatedMoney centimes={total} />}</div>
      <div className="proposal-buttons"><button className="secondary-button" type="button" disabled={busy} onClick={onDismissProposal}>{t("Annuler", "إلغاء")}</button><motion.button className="primary-button" type="button" disabled={busy || (proposal.kind === "customer" ? !proposal.name.trim() : !Number.isSafeInteger(total) || total <= 0)} tabIndex={busy || (proposal.kind === "customer" ? !proposal.name.trim() : !Number.isSafeInteger(total) || total <= 0) ? -1 : 0} onClick={onConfirm} whileTap={reducedMotion ? undefined : { scale: 0.98 }} transition={physicalSpring}><Check size={17} aria-hidden="true" /> {proposal.kind === "customer" ? t("Ajouter le client", "زيد الزبون") : t("Confirmer l’opération", "أكد العملية")} <ArrowRight size={17} aria-hidden="true" /></motion.button></div>
    </motion.section>
  );
}
