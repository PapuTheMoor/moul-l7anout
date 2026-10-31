# Moul7anout

Decision: Moul7anout, voice-led with editable text fallback. Use the supplied OpenAI workshop key; no additional service purchases.
Development mode: Codex only. Codex owns the entire build; there is no Claude Code handoff or dependency.
Goal: a memorable Morocco workshop demo, built in approximately 60 minutes from implementation start.

Promise: say what happened in your shop, review the interpretation, then record it.
MVP: one sample shop. OpenAI interprets typed Darija and transcribes recordings. Explicit local example mode preserves the ledger if the API fails. Darija transcription accuracy must be tested, not assumed.

Stack: Next.js App Router, React, TypeScript, Tailwind CSS; npm lockfile. Local storage for prototype persistence. CSS for initial animations. Add dependencies only when needed.
Framework setup reference: [official Next.js installation guide](https://nextjs.org/docs/app/getting-started/installation).
No additional paid services, accounts, real payments, database, document scanning, or automatic publishing in this sprint.

Commands after installation: `npm run dev`, `npm run lint`, `npm run typecheck`, `npm run build`.
Tests: `npm test`, `npm run test:coverage`, `npm run test:e2e`. Browser tests require installed Chrome and the running localhost:3000 server. Opt-in real API checks: `MOUL7ANOUT_LIVE_CHECK=1 npx playwright test tests/e2e/live-openai.spec.ts`; uses workshop credits and the recording test needs the ignored synthetic audio fixture.
App: http://127.0.0.1:3000. Credentials: ignored root `.env.local`; `OPENAI_API_KEY` or existing `Agents_API_API_key`. Never expose the key in client code or logs.

Folders:
- `src/app/`: routes, page composition, app styles; Codex ownership.
- `src/components/`: accessible UI; Codex ownership.
- `src/domain/`: contracts, parsing, money, ledger; Codex ownership.
- `src/data/`: synthetic fixtures; Codex ownership.
- `src/lib/`: persistence and browser adapters; Codex ownership.
- `tests/`: unit, integration, and browser coverage as features land.
- `docs/`: shared requirements, design, tasks, collaboration, and demo.
- `workflows/`: repeatable development and handoff procedures.
- `.agents/skills/`, `.claude/skills/`: small tool-specific skill adapters.
- `.codex/`, `.claude/`: tool-specific settings kept separate.

Claude adapters remain available but inactive. Do not start Claude Code or wait for it. Brag is installed for Codex and remains the planned end-of-build video tool.

Setup references were read as reference material. The supplied WAT template targets Python automation and cloud deliverables; its shared-workflow principle is adapted here, without replacing this web app with Python scripts. The supplied handoff skill is chat-only; its Windows paths and tool-specific task APIs do not apply on this Mac.
