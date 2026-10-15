# 2026-10-15 render repair

The previous delivery's technical validation was successful, but did not validate the visual defects reported by the user. This revision addresses those defects in the actual active renderer. Most of the film is native Three.js, five short sources are Blender renders, and the prior revision added three photographic AI source families. Changing only Blender visibility cannot fix the native renderer.

## Changes to verify from CI output

- `src/data/ai-shot-selections.json` is now empty. The previous photographic glass/red/dawn footage remains archived, but does not enter this revision. Glass at 34 seconds is a new authored frosted aperture corridor in the same native pipeline; the existing red-machine and evolving-dawn native worlds now remain visible.
- Native profile extrusions have three-segment bevels. Shared box geometry has rounded edges, island silhouettes use 48 points and smooth normals, and cables have smoother cross-sections. Rough surfaces carry deterministic micro-roughness; half-resolution SSAO adds contact depth before the shared tone/output pass. None of these changes claims to make a scene beautiful automatically.
- Render helpers and marked production helpers are hidden. The former guide-like lines were mostly authored fine cables, not exported camera paths: thin decorative cables and scene annotations are suppressed without suppressing the structural ribs. The 27 converging splines and the five colonnade lane lines have been removed.
- The shell path detours around the right-hand physical lip; the canopy camera is above the tree. The number-monument roll is reduced from 90 degrees to a clamped 0.35-radian motion. A stateless triangle-surface clearance pass keeps the lens away from opaque native meshes. It excludes particles and transparent surfaces, so visual review of those remains necessary.
- A single post-composite subtitle owner replaces the rotating, vertical, clipped, giant-glyph, and scene-plane lyric variants. The lyric and Chinese adaptation occupy one bounded horizontal block with stable dark backing. The complete phrase stays visible, including on the sky and farewell frames. Titles/numeric architecture remain graphic elements.
- The supplied transcription is preserved in `assets/lyrics-original.txt`. `assets/lyric-corrections.json` records 28 editorial line corrections and the comparison source. This source is a **community transcription**, not an official lyric sheet. Special readings/kanji are not treated as ordinary spelling. The Chinese adaptation is revised and unofficial. Original line onsets remain; old word-level karaoke was disabled rather than inventing timings for corrected words.
- `scripts/review-repairs.py` creates CI-only encoded-frame and passage evidence at the reported problem times. Render completion, source checks and contact generation remain separate from artistic acceptance.

## Validation boundary

The music, 64 shot boundaries, unofficial identity and existing emotional arc remain. Local static frames are development inspection only. The authoritative new movie, issue contact sheet and full decode/music verification must come from GitHub Actions. `EMOTIONAL-CI-REVIEW.md` describes the older `ffd4a65` export; it is not approval of this repair or evidence that these new changes have rendered.
