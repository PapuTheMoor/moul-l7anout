# Moul7anout — workshop PRD

Status: v0.2, implemented and verified locally. Codex chose the defaults below; exact verification results and limits are in docs/TASKS.md.
Constraint: approximately 60 minutes to a working local demo. Use the supplied OpenAI workshop key server-side; no additional service purchases.
Detailed design: `docs/superpowers/specs/2026-10-31-moul7anout-design.md`; implementation plan: `docs/superpowers/plans/2026-10-31-moul7anout.md`.

## Problem and user

Hypothesis to validate: a small Moroccan shopkeeper can capture sales and customer credit more easily through familiar language than through a conventional inventory form. This workshop prototype demonstrates the interaction; it does not claim field validation.
Primary user: one shopkeeper operating a small catalog on one device.
Primary job: record a sale or customer credit without losing track of stock or balances.

## Product promise

Say it. Check it. Record it. The interface defaults to Arabic Darija and can be switched to French.
The app turns spoken or typed Darija into an editable transaction proposal with OpenAI. The shopkeeper confirms before business state changes. Prices and arithmetic come from deterministic code. Local example mode is visibly labeled and never impersonates an AI response.

## Hero journey

1. Open the sample shop; see a clearly labeled demo badge, cash received today, outstanding customer credit, and recent activity.
2. Tap a labeled sample input or type: `Ahmed khda jouj l7lib, mazal makhlessch`.
3. Show the exact input and a proposal: Ahmed, milk x2, 7 MAD each, 14 MAD total, on credit.
4. Highlight fields with missing information; allow corrections before confirmation.
5. Confirm once. Milk stock falls from 24 to 22, Ahmed's balance rises from 35 to 49 MAD, and cash received remains unchanged.
6. Record Ahmed paying49 MAD: debt becomes zero, cash increases49 MAD, sales and stock unchanged.
7. Undo reverses the latest event atomically, including after reload. Reset requires confirmation.

## Must ship

- Five sample products, three customers, MAD currency, and visible sample-data label.
- Typed input plus one-click sample phrases; always distinguish sample text from actual recording.
- OpenAI structured extraction against the five-product catalog; clarify unknown products/customers rather than guessing. Typed text remains available.
- Microphone recording -> transcription -> automatic interpretation -> review. Speak an explicit confirmation to save, or edit and confirm on screen. Tap the microphone to start and stop each utterance; this is not an always-listening assistant. Cap recording at30 seconds /10 MB; clean up tracks on all paths.
- Create a new customer from a spoken or typed request, review the name, and explicitly confirm before adding them. Newly added customers can be selected for credit sales and repayments.
- Support spoken confirm, cancel, undo, navigation and language switching. A spoken reset requires a second explicit confirmation.
- Explicitly labeled local parser for the supported credit, cash-sale and repayment examples.
- Editable transaction preview, confirm, and undo of the latest transaction.
- Stock and customer-credit updates; separate sales value from cash received.
- Repayments reduce debt and increase cash without changing sales or stock. Reject overpayment.
- Local persistence with validation of stored data and a reset control.
- Responsive 390px mobile and desktop layouts, keyboard operation, accessible status updates, reduced-motion support.
- Friendly failure for unsupported phrases, unknown products, missing customers on credit, invalid quantity, and insufficient stock.

## Optional after core works

- A small deterministic Darija summary of today's shop activity. No financial forecasts.
- Brag launch video after the live app works.

## Not in this sprint

Document scanning/Fhemni, receipt printing, authentication, cloud sync, payments, WhatsApp, suppliers, full accounting, arbitrary voice understanding, multi-shop support, production readiness.

## Rules

- Store money as integer centimes. Format as MAD at display time.
- Derive line prices from catalog IDs, never guessed from the sentence.
- No state changes during input parsing or preview editing.
- Confirm must be idempotent for a proposal ID, including double-clicks.
- Reject non-positive or fractional quantities; reject unknown IDs and excess stock.
- Credit requires an explicit known customer; never silently create a debtor. Customer creation itself requires an explicit, separately confirmed proposal.
- Apply stock, sales, and balances atomically with immutable state.
- Aggregate duplicate product lines; prevent duplicate IDs and stale AI responses. Retain recorded unit prices.
- Reject damaged stored state and explain how to reset; do not silently invent a recovery.
- Use synthetic data. OpenAI receives the transcript/audio only when the user invokes that feature; this app does not store audio server-side. Keys remain server-only.
- Validate all inputs/output and persisted state. Limit text1000 characters, browser recordings30seconds, server uploads10MB, provider timeout25seconds, local API rate20 requests/minute. The server byte cap does not independently verify audio duration. Reject cross-origin writes.

## Acceptance and verification

- Hero credit example produces exactly 14 MAD and the stock/balance changes above; cash unchanged.
- Cash sale increases cash received, leaves credit unchanged, and reduces stock correctly.
- Repayment increases cash and reduces debt without changing sales/stock; reject overpayment and reverse correctly with Undo.
- Undo restores all effects; double confirmation records only one sale.
- Invalid input cannot alter the ledger. Reload preserves valid confirmed transactions.
- A complete browser test covers sample -> preview -> confirm -> undo; cover parser/ledger with unit and integration tests. Target at least 80% coverage of implemented domain code per workshop ECC instructions.
- Lint, types, and production build pass; manually check desktop/mobile and speech-unavailable mode.

## Design and pitch

Visual direction: a contemporary Moroccan shop notebook, warm paper, deep green, restrained terracotta, legible numerals, and one dominant capture interaction. See `docs/DESIGN.md`.
Pitch: "A shopkeeper should not need to become an accountant to remember who bought what and who still owes money."
Evidence for judges: one correct visible transaction, confirmation before change, reversible results, and an honest explanation of prototype limits.

## 60-minute budget

- 0–5: freeze contracts/specs and verify provider access.
- 5–25: UI and ledger in parallel; API/controller integration.
- 25–40: editing, repayment, undo, persistence and recording.
- 40–50: tests, browser verification and fixes.
- 50–60: mobile polish and rehearsal; Brag only if the live flow is ready.

Cut video before correctness, confirmation, typed fallback or rehearsal. Voice quality remains a live-test item.
