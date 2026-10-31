# 75-second demo

Preparation: reset the sample shop, verify milk stock 24 and Ahmed balance 35 MAD. Close unrelated tabs. Keep typed input available. Label the shop and all seeded records as demo data.

- 0–10s: "A shopkeeper sells all day. Remembering who paid and who still owes money is another job."
- 10–20s: record or type `Ahmed khda jouj l7lib, mazal makhlessch` in OpenAI mode. Stop recording, review the transcript, then click Comprendre l’opération. Rehearse microphone permission and a real Darija voice on this device first.
- 20–35s: show customer, milk x2, catalog price 7 MAD, total 14 MAD, credit. "Nothing changes until I check it."
- 35–45s: confirm. Point to stock24 ->22, Ahmed35 ->49 MAD, cash unchanged.
- 45–60s: enter Ahmed khlles49dirham or use Remboursement, review and confirm. Ahmed is Réglé, cash49 MAD, sales remain14 MAD.
- 60–70s: undo repayment. Ahmed returns to49 MAD; stock remains22. "A mistake is reversible."
- 70–75s: "OpenAI understands the words. The shopkeeper confirms. Code keeps the accounts. Next, we test this with real shopkeepers."

Fallback: if microphone fails, use typed input. If quota/network fails, select Exemples locaux and use a supported example. Do not describe sample text as live recognition or local parsing as OpenAI.
Before presenting: rehearse the same flow twice, check both desktop and narrow viewport, and verify reload persistence once.

## Brag launch video — generated and verified

Deliverables: `brag-output/brag.mp4` (20seconds,1080p,30fps), `brag-output/brag.jpg` poster, `brag-output/share-copy.txt` with required music/SFX credits. Actual UI and faithful animated transaction cards; not a recorded live microphone session. Hyperframes check passes with0 errors and9 non-blocking craft/structure warnings; see brag-output/verification.md. Poster is baked into frame0. Nothing published.

[Brag upstream](https://github.com/latent-spaces/brag) is installed project-locally at `.agents/skills/brag/`, pinned to commit `669ab9286aa28b6c3ee30e75f181ee74319d012a`. Claude Code uses `.claude/skills/brag/`, a symlink to the same installation. Bundled reference files, music, and SFX are included. The skill should be available on the next Codex turn; restart an already-open Claude Code session if it does not discover the new skill.

Hyperframes `0.8.223` is a pinned development dependency. Its bundled `hyperframes`, `hyperframes-cli`, and `media-use` skills are linked into both agents' skill directories. The supporting `hyperframes-registry` skill is installed from upstream commit `a04b45a6db0d1f724be9cf1985c3b13657195f0d`, also shared with Claude Code. Run `npm install` to restore package-backed skill links after a fresh checkout.

Check the renderer environment with `npm run demo:doctor`. Node, FFmpeg, FFprobe, and cached Chrome were detected. Optional Kokoro narration and MusicGen are not installed; Docker is stopped. The local music-backed render completed without those optional components.

After the product interactions work and the live demo is rehearsed, invoke:

```
/brag --tone polished --format landscape --duration 20 --title Moul7anout
```

In Codex, natural language also works: "Use the installed brag skill to make a 20-second polished landscape launch video for Moul7anout."

Direction: show the real implemented UI, Darija input -> editable credit proposal -> confirm -> stock and Ahmed's balance update. Preserve the warm paper/green/terracotta design. Clearly label prototype/sample data. Use bundled audio, omit voiceover and paid services, and retain required asset credits. Do not imply unsupported speech understanding. Deliver the MP4, poster, and share copy locally; do not publish automatically.

Default output is `brag-output/`; use a timestamped directory for subsequent runs to preserve the delivered video. Generated output folders are gitignored.

Dependency compatibility note: Hyperframes pins vulnerable Undici7.25.0; this project overrides it to patched7.30.1. Doctor and the real render work. Full npm audit reports16 moderate lint-tool findings, zero high/critical; production audit is clean.
