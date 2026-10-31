# Task board

Current development mode: Codex only. All implementation, design, integration, and demo tasks belong to Codex. Claude Code is inactive.

## Frontend refinement requested after the first build

Complete: applied the user-invoked Impeccable, UI/UX Pro Max and Apple Design skills to the existing frontend. Prominent voice counter, adjacent review, readable type/targets and interruptible springs. Parent completed one initial batched inspection, one correction batch and one confirmation pass; four browser regressions pass and fresh source review found no blockers. All71 unit/integration tests, lint, types and production build pass after refinement. Details: docs/FRONTEND-REVIEW.md. Demo video and poster refreshed to match the final interface.

| Task | Owner | Paths | Status |
|---|---|---|---|
| Shared setup, PRD, types, synthetic fixtures | Codex | root config, docs, src/domain/types.ts, src/data/seed.ts | Complete |
| UI and interaction design | Codex UI worker | src/components/**, src/app/globals.css | Complete; desktop/mobile reviewed |
| Pure ledger, parser, validation | Codex domain worker | src/domain/ledger.ts, local-parser.ts, validation.ts, tests/unit/** | Complete;52 unit tests |
| OpenAI routes, browser controller and audio | Codex parent | src/lib/**, src/app/api/**, src/app/page.tsx, tests/integration/** | Complete; real provider verified |
| Integration and responsive browser checks | Codex | tests/e2e/**, docs/DEMO.md | Complete;6 browser tests |
| Launch video | Codex video worker | brag-output/** | Complete;20-second1080p MP4 and poster |
| Brag and local renderer installation | Codex | .agents/skills/**, .claude/skills/**, package files, docs/DEMO.md | Complete; real render verified |

Implemented: real OpenAI text/audio interpretation; editable sale/cash/credit and repayment proposals; explicit confirmation; immutable stock, balances and cash; Undo; validated local persistence; corruption recovery; reset; local example engine; responsive notebook UI. PRD v0.2 and design/plan are in docs/superpowers.

Current verification:71 unit/integration tests PASS. Domain coverage95.13% statements,92.15% branches,100% functions/lines. Four deterministic browser tests PASS: credit->repayment->undo->reload->reset;390px no overflow; microphone-denied feedback; stale-transcription protection. Two opt-in real OpenAI browser tests PASS: new typed Darija cash sale and MediaRecorder->upload->transcription->interpretation using a disclosed synthetic Arabic/Darija audio fixture. This is not a human-accent accuracy evaluation.

Lint, TypeScript and production build PASS. Real provider understood credit/variant/repayment phrases and clarified an unknown banana product. Synthetic4-second Arabic/Darija audio transcribed correctly. Client bundle scan checked21JS files: key not found. Reviewer found2 recording bugs; both reproduced RED and fixed GREEN with browser regressions. Draft focus/scroll and truthful storage/audio labels corrected.

Verification on 2026-10-31: `npm install` completed; `npm run build`, `npm run typecheck`, and `npm run lint` passed. Reviewer found no setup blocker; callable contracts were added following review. Internal document-reference check found no missing referenced project files.

Dependency audit: `npm audit --omit=dev` returned zero vulnerabilities. Full audit reported 16 moderate development-tool findings rooted in minimatch and inherited by ESLint-related packages, including ESLint 9.39.5 and eslint-config-next 16.4.3; no high or critical findings. These remain unresolved. Do not apply suggested forced major downgrades to unrelated old lint packages. Review compatible tooling updates separately.

Running state: local development server at http://127.0.0.1:3000, execution session43563. Stop with Ctrl-C in that session. Key moved from docs/.env to ignored root .env.local; server accepts existing custom variable or OPENAI_API_KEY. Claude Code not launched. No Git repository/deployment created.

Limits: fixed synthetic catalog/customers, single device, no production authentication/cloud sync. Browser recording cap30seconds; server enforces10MB, not independent duration verification. Rehearse a real Darija voice and microphone permission on the presentation device. No service purchase or publishing.

Final refreshed video: `brag-output/brag.mp4` (20.000s,1920x1080,30fps,600frames,H.264/AAC,1,679,207bytes), `brag.jpg` poster baked into frame0, and `share-copy.txt` with audio credits. The first video was independently checked, and the frontend-refreshed render's metadata was verified again. Hyperframes check:0 errors,9 non-blocking craft/structure warnings documented in brag-output/verification.md. No publishing.
