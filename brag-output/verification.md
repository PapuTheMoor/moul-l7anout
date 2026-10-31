# Launch-video verification

- Hyperframes0.8.223 `check --json`: PASS, zero errors. Refreshed-render report: `composition/.hyperframes/artifacts/checks/52cdcb8d-2a63-4550-8ac2-623e080cd8c8.json`.
- Non-blocking warnings: five timeline-structure suggestions (inline scenes could be separate editable subcompositions), one small-type craft warning, three reading-time craft warnings. Layout, contrast, motion, runtime and audio checks have zero errors.
- Initial composition: six representative snapshots were visually inspected at1.5,5,9.5,13.5,15.5,18.8seconds. The repayment subtitle explicitly changes so it does not falsely say cash stays unchanged during repayment.
- Frontend refresh: replaced the actual UI assets with the final parent-provided1440×1050 captures of the refined green voice counter and adjacent draft. No new app screenshots or visual QA were run; the parent supplied its completed bounded visual passes. Storyboard, copy, timing and audio were preserved.
- Local render:1920x1080,30fps,20seconds,600frames, H.264 video/AAC audio, two workers. No narration or generated media APIs.
- Refreshed final export independently probed:20.000000seconds,1920×1080,30/1fps,600video frames,H.264/AAC,1,679,207bytes. Rendered into a candidate file and replaced the previous final only after rendering, poster bake and metadata validation succeeded.
- Poster chosen at5seconds, a settled frame with the actual product interface and brand-matched copy. Poster pixels replace only frame0; audio and duration retained.
- Synthetic names/amounts only. The video demonstrates the real app flow through an actual UI capture and faithful animated transaction cards; it is not a recording of a live microphone session.
- Bundled Sascha Ende Vol12 music and CC0 Kenney SFX credited in `share-copy.txt`. Audio-reactive RMS extraction ran locally using the installed media-use helper.
- No application/config/package files changed. No publishing performed.

Re-render from `composition/`: `npx --no-install hyperframes render --output ../brag.mp4 --fps 30 --workers 2 --quality delivery --skill brag`. Reapply poster-frame0 bake afterward as described in the Brag skill.
