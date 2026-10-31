# Codex-only development

Shared source of truth: `docs/PRD.md`, `docs/DESIGN.md`, `src/domain/types.ts`, and `docs/TASKS.md`.
The user chose to work solely with Codex. Codex handles the full project in this workspace. Claude Code adapter files and `docs/CLAUDE-START.md` are inactive; do not launch another coding CLI or wait for a Claude handoff.

## Ownership

- Codex: dependencies/config, UI in `src/app/**` and `src/components/**`, domain logic in `src/domain/**`, fixtures in `src/data/**`, browser adapters in `src/lib/**`, all tests, and final demo.
- Shared contracts: maintain one source in `src/domain/types.ts`; UI imports these types.
- Callable contract: pure `confirmTransaction`, `undoLatest`, `getSummary`, `parseLocal`, `validateProposal`, and `validateShopState` functions; `ShopWorkspaceProps` defines the controlled UI boundary. Implementations are complete. Preserve proposal IDs and use catalog prices.
- Docs: Codex owns product, design, task status, and demo documentation. If Codex delegates a subtask, assign non-overlapping paths and record ownership before edits.

Never revert unfamiliar edits. Codex owns package.json and package-lock.json; serialize dependency changes if using Codex subagents.
Use separate files for UI modules. Domain operations return new state and never import React. Browser adapters may use effects/storage but must not mutate domain objects.

## Working agreement

1. Read shared docs and task status.
2. State the exact paths you own; claim the row before editing.
3. Freeze contract before parallel implementation. Propose changes before editing it.
4. Add meaningful tests before behavior, then implement and verify. Review code after changes.
5. Report changed paths, commands run, results, and blockers accurately.
6. No push, publishing, deployment, or credential changes without user instruction.

The provided session-handoff pattern is available through skill adapters. It produces a chat summary on request; it does not overwrite shared docs or global memory.
