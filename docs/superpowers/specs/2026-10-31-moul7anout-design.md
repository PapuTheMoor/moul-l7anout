# Moul7anout build design

Intent: demonstrate a Moroccan shopkeeper recording a purchase in Darija, then settling customer credit. The user authorized moving into build; defaults here are Codex choices, not field-validated requirements.

## Approaches and scope

Choose voice-led input with an editable transcript and typed fallback. The text-led alternative is the same core flow without recording. A clearly labeled bounded local-example parser is a service-outage fallback. OpenAI handles transcription and interpretation, regular code handles money and stock. One shop, five synthetic products, three customers. No accounts, real payments, cloud sync, document scanning, additional service purchases or publishing.

## Structure and contracts

Parent owns `src/domain/types.ts`, API routes, controller, data, dependency/config and docs. UI worker owns `src/components/**` and `src/app/globals.css`. Domain worker owns `src/domain/ledger.ts`, `local-parser.ts`, `validation.ts` and unit tests. Never revert another worker's changes.

Shared types define sale and repayment proposals and controlled `ShopWorkspaceProps`. `confirmTransaction(state,proposal,recordedAt)`, `undoLatest(state)`, `getSummary(state)`, `parseLocal(input,state)` and `validateShopState(input)` are pure domain boundaries returning typed results. UI only renders and dispatches callbacks. Parent controller owns network requests, race guards, localStorage and audio lifecycle.

## Behavior

Input -> editable transcript -> draft -> corrections -> explicit confirmation -> immutable ledger. Credit sale:2 milks at700centimes, stock24->22, Ahmed3500->4900, cash unchanged. Repayment4900: Ahmed4900->0, cash+4900, sales/stock unchanged. Reject negative/fractional quantities, unknown IDs, excess stock and overpayment. Aggregate repeated product lines; duplicate confirmation IDs are idempotent. Record original prices. Undo latest reverses all effects, including after reload. Reset requires confirmation.

## Language layer and privacy

Server POST `/api/interpret`: text<=1000chars, CaptureInput, known customer balances; strict OpenAI JSON extraction into sale/repayment or clarification, schema validation, no ledger writes. Server POST `/api/transcribe`: audio<=10MB and30seconds recorded, allowed audio MIME, returns editable text. Requests timeout25seconds, local limit20/minute and cross-origin rejection. Credentials in root `.env.local`, never client bundles/logs. Only user-invoked synthetic text/audio goes to OpenAI; app server retains no recording. Unknown provider failures return sanitized errors and leave ledger unchanged.

## Interface

A contemporary shop notebook: warm paper#F6F2E8, deep green#173E32, terracotta#B85C3C, strong typography, tabular MAD figures. French labels and Darija examples with Arabic auto-direction. Capture and review dominate; supporting customer ledger, products and activity. Visible sample-data and active-engine labels. No fake activity or recognition. Accessible focus/status, reduced motion, desktop and390px layouts. Recorded input can be edited before interpretation.

## Resilience and verification

Validate storage and show explicit recovery on corruption/denied storage. Stale responses cannot replace newer text. Release microphone tracks on cancel/error/unmount. API/microphone failure preserves typed/local path. Write failing domain/API tests before implementation; >=80% domain coverage. Browser flow covers credit, repayment, undo, reload, reset and mobile. Separately verify a real synthetic OpenAI interpretation; do not call untested speech/video verified. Lint, types and production build must pass. Brag local video follows the working live flow and never publishes automatically.
