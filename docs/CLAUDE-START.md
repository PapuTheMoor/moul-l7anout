# Prompt to paste into Claude Code

INACTIVE: the user switched to Codex-only development. This prompt is retained as an optional reference, not a current work assignment. Do not execute it unless the user explicitly returns to a Claude Code workflow.

Work in `/Users/omarhajjami/Documents/Codex Community workshop`.
Read CLAUDE.md, docs/PROJECT.md, docs/PRD.md, docs/DESIGN.md, docs/COLLABORATION.md, docs/TASKS.md, and src/domain/types.ts first.

Build Moul7anout's polished responsive workspace for a 90-minute Morocco workshop demo. No paid APIs. Own only src/app/** and src/components/**. Claim the UI row in docs/TASKS.md before editing it. You are not alone in the codebase: Codex owns domain logic, data, browser adapters, dependencies, and configuration. Never revert its changes or edit those paths.

Visual direction: warm paper, deep green, terracotta; a contemporary shop notebook. Put capture -> review -> confirm at the center. Use clear MAD figures, original Darija input, editable transaction cards, accessible status, and meaningful animation. No generic marketing page or decorative charts. Clearly label sample data and sample input. Follow docs/PRD.md for the demo numbers.

Start with composition and components using imported types and synthetic fixtures. Use `ShopWorkspaceProps` from src/domain/types.ts as the integration boundary. Its parent/controller will own domain operations. Until those operations exist, report integration as pending; do not create a competing parser or ledger. Coordinate any prop changes with Codex. Browser microphone support is optional; never pretend sample text is live transcription.

Do not edit package.json or the lockfile. Request any dependency through your task report. Use CSS transitions initially. Do not publish, install global tools, run another agent CLI, or add credentials.

Report changed files, checks run and their outcomes, and remaining integration work. Reserve time for mobile layout and the live demo.
