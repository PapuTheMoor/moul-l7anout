# Design direction

Concept: the familiar shop notebook made calm, legible, and interactive.
Suggested palette: paper #F6F2E8, ink #173E32, terracotta #B85C3C, muted #67766A. Confirm contrast in the actual combinations used.
Use a readable system font initially, tabular numerals for money, generous spacing, and restrained rounded corners. Avoid network font dependencies during the demo.

Desktop: narrow shop identity/navigation rail; central daily overview and recent activity; prominent capture/preview panel. Mobile: capture first, overview second, ledger third.
Primary action: one visible input area, microphone enhancement, and labeled example phrase. Avoid competing CTAs.
Language: French labels and familiar Darija examples initially; Arabic strings use `dir="auto"`. Currency remains MAD. Do not promise full multilingual support.

Meaningful motion: recording indicator only while actually recording; proposal enters when available; affected values highlight only after confirmation; undo visibly restores them. Use 150–250ms transitions and honor prefers-reduced-motion.
Trust details: show the original input, catalog unit prices, credit status, editable quantities, and explicit confirmation. Never animate fabricated activity.
Scope: one polished workspace. No marketing landing page, login, onboarding tour, or decorative analytics charts.

## Skill-guided refinement

Requested by the user after the first working build: apply Impeccable, UI/UX Pro Max and Apple Design to the existing interface. Mode: Operate. Preserve the warm-paper/deep-green/terracotta shop identity, product truth and complete tested ledger behavior.

Focus: bring voice capture and review into the first desktop viewport, reduce oversized introductory spacing, replace tiny helper text with readable type, and give primary controls comfortable targets. Place new drafts next to capture on desktop and directly after it on mobile. Keep balances and client context visible without a dashboard of decorative cards.

Use Apple-style immediate press feedback and critically damped, interruptible springs for stateful elements. Animate actual value changes, real recording state and review/success transitions only. Floating chrome may use translucency for hierarchy; content surfaces stay legible and solid. Reduced motion gets static/crossfade equivalents, reduced transparency gets solid chrome, and contrast preference strengthens boundaries.

Impeccable context ran once and resolved this existing design file as authority. No PRODUCT.md exists; this is a refinement of the incumbent surface, not a new visual-world setup. The UI/UX database's palette/style results did not fit this small shop ledger and were not persisted; verified UX target-size guidance is used. No Next.js-specific motion entry matched after the allowed retry; Apple Design and Motion documentation govern motion.

Verification budget: one batched desktop/mobile visual and defect pass, one consolidated correction batch, then at most one confirmation pass. Run Impeccable's mechanical detector once on changed UI files. Refresh demo assets after the final interface is settled.
