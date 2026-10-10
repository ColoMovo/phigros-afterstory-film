# AFTERSTORY — Unofficial Phigros Fan Tribute

**UNOFFICIAL FAN TRIBUTE — NOT AFFILIATED WITH PIGEON GAMES.**

本项目为非官方玩家创作，与南京鸽游网络有限公司及《Phigros》官方不存在授权、合作或运营关系。

The current rebuild implements the complete soundtrack timeline. Its director's priority is a journey reaching its end: memory, farewell, forward motion, and a world that remains alive. [EMOTIONAL_DIRECTION.md](EMOTIONAL_DIRECTION.md) describes the music arc, cosmic / human / micro scale changes, THE LEAF, and the remaining visual checks. [WORLD-IDENTITY.md](WORLD-IDENTITY.md) records the world design. Earlier shell / opening reviews do not approve this revision; each change must be assessed from its own encoded CI output.

[src/data/shots.json](src/data/shots.json) currently contains **64 timed Shot Units, 27 ANCHOR units, and 36 declared world names**. It records their boundaries, scene events, cameras, music cues, and transitions. These counts describe the implementation, not artistic acceptance. The Remotion composition combines depth-buffered Three.js scenes, five CI-generated original Blender clips, original Canvas artwork, and six selected intervals from three archived generated world plates. Generated source audio is muted; the film uses the full original user-provided soundtrack.

The first 12 seconds share one native scene and camera trajectory: near shutters uncover the shell, its side opening leads into a curved chamber, and the chamber reveals the island world already behind it. The 5.321s, 7.3833s, 9.3s and 10.5s event boundaries share camera position, gaze, velocity, FOV, and roll. `opening-joins.jpg` samples the encoded frames around those boundaries. Memory papers and human-scale waiting places are original artwork and geometry. Official reference recordings teach visual and emotional grammar only: no reference footage, screenshot, official character, UI, logo asset, or song illustration enters the active composition.

[src/data/emotion-map.json](src/data/emotion-map.json) covers all 64 shots with 30 continuous emotional sections and 48 absolute-time control nodes. Its warmth, openness, wind, and optional glitch budget drive authored scene controls. Scale and recurring-leaf entries distinguish implementation evidence from pending review. The values are director intentions, never measured audience emotions or visual-quality scores.

## Development

```sh
npm ci
# Restore the archived user-provided MP3 to public/music.mp3. It is ignored by Git.
npm run verify-assets
npm run typecheck
node scripts/verify-emotion-map.mjs
npm run studio
# Inspect a few development frames rather than exporting a formal review locally:
STILL_TIMES=9.9,27.6,35,84,121.7,150.6 node scripts/render.mjs dev-stills
# Optional extremely short development smoke:
node scripts/render.mjs smoke
```

The original music is a necessary user-provided input. Music and recording rights remain with their respective creators / rights holders. The repository contains an AES-256-GCM encrypted CI input; its decryption key is supplied through the authorized `AUDIO_DECRYPTION_KEY` Actions Secret and is never logged or included in artifacts. A public clone needs the exact archived input or an authorized decryption path to reproduce the soundtrack. [assets/SOURCES.md](assets/SOURCES.md) separates reference materials from render inputs, and [assets/music-source-provenance.json](assets/music-source-provenance.json) separates the user file's ID3 metadata from the in-game displayed credit. The current user copy and archived render input have different ID3 blocks but the recorded decoded audio is identical; do not silently replace the manifest's file hash.

The repository stays **public**. The current plaintext MP3 is removed from Git and ignored locally. Historical Git blobs were retained at the user's explicit request; removing a current file does not remove those blobs. Do not rewrite `main` history or change repository visibility. Review artifacts contain the soundtrack within the film, never a standalone MP3 or decryption key.

## Formal rendering: GitHub Actions only

```sh
gh workflow run render-video.yml --ref HYBRID_REBUILD -f target=opening-review -f opening_seconds=17.7
gh workflow run render-video.yml --ref HYBRID_REBUILD -f target=hybrid-preview
gh workflow run render-video.yml --ref HYBRID_REBUILD -f target=final
# Four absolute ranges, reusing final Blender assets from a verified assembly:
gh workflow run render-video.yml --ref HYBRID_REBUILD -f target=parallel-final -f physical_run_id=38090288881 -f physical_source_sha=2f1a68b2f69b505f79cee42d571a0c06ab1ad71f
```

Run these commands from this checkout with authenticated `gh`. Select the intended source branch explicitly. [.github/workflows/render-video.yml](.github/workflows/render-video.yml) exposes these targets:

| Target | Scope and principal output |
| --- | --- |
| `smoke` | 41–44 seconds of the soundtrack, 1920×1080 / 60 fps; `smoke.mp4` and technical verification. |
| `physical-review` | Five original Blender sources, encoded event stages and source-fingerprint verification; no full film or soundtrack export. |
| `opening-review`, alias `opening` | Configurable 12–58.315 seconds, default 58.315; 960×540 / 30 fps; `opening-review.mp4`, opening joins, encoded samples and contact sheets. |
| `preview` | Complete soundtrack, 960×540 / 30 fps; `preview.mp4`, encoded samples, contact sheets and verification. |
| `revised-preview` | Same full preview specification; `revised-preview.mp4`, plus editorial segment reviews and visual-activity / audio-RMS diagnostics. |
| `hybrid-preview` | Same full preview specification with the current selected local source plates; `hybrid-preview.mp4`, source checks, and editorial reviews. |
| `omni-review` | Comparisons of actual archived source versions, contact sheets and provenance checks; source audio is excluded. This does not perform or approve an Omni generation. |
| `omni-previs` | Original Blender `dark-surface` and `judgement-rule` control footage for later editing tests; this does not confirm upload or a completed Flow edit. |
| `final` | Complete soundtrack, 1920×1080 / 60 fps; `phigros-main-story-celebration.mp4`, editorial reviews, encoded contact sheets and verification. |
| `parallel-final` | The same complete final specification in four inclusive absolute frame ranges, then video stream copy and one full original-audio mux. The registered workflow calls `render-final-parallel.yml` from the same commit. Its actual three joins, complete decode, music synchronization and visual review still require CI output. |

Formal opening, preview, final, contact-sheet generation, and MP4 verification run in Actions. [scripts/render.mjs](scripts/render.mjs) rejects formal film modes outside Actions; local use is limited to development, realtime preview, static-frame inspection, and an extremely short smoke. Do not spoof the CI environment to export locally.

The film-render jobs verify inputs, source selections, emotion-map structure, opening camera continuity, and TypeScript; render and decode a three-second 1080p60 smoke; then render and verify the requested scope. `physical-review` and the two Omni targets have their own source-review jobs. The soundtrack duration is **162.72544217687076 seconds**: the complete preview has **4,882 frames**, and the final has **9,764 frames**. Container duration is rounded to the video frame grid; the soundtrack is used at original speed and zero offset. Native scenes are evaluated at the output frame rate; five 30 fps Cycles clips repeat each source frame twice in the 60 fps final.

Verification checks H264 / AAC, dimensions, frame count, zero timestamps, full decode, archived input hash, and audio correlation at zero offset. Contact sheets use **actual encoded MP4 frames**, not separately rendered stills. Four event stages are sampled for each eligible ANCHOR present in the requested scope; a full film has 27 such anchors. Artifacts include source attribution, the shot manifest, director intentions, and verification reports. No remote image, font, or Flow URL is resolved per frame.

The five Cycles sources use four seeded absolute frame chunks per shot. Their preview profile is 960×540 with 8 samples; final is 1920×1080 with 16 samples and denoising. Source fingerprints and PNG sequences are checked before assembly; unchanged chunks may be restored from cache.

The optional parallel final keeps the complete 9,764-frame composition clock. Its four video-only ranges are `0–2440`, `2441–4881`, `4882–7322`, and `7323–9763`. All four must share the checkout, input hashes, render parameters and verified final Blender source commit. The supplied source run must contain the named `physical-assets-<commit>` artifact with matching fingerprints. Generation reference PNGs are checked as reproduction inputs; this does not turn them into final-frame assets. Assembly checks the decoded final frames against their original chunks at all three joins and runs the existing full-film verification. Separate H.264 GOPs can change the resulting bytes and SHA; no speed improvement or visual acceptance is claimed before an actual run.

## What a successful check establishes

- **Code / schema:** the complete timeline, valid inputs, compatible types, and recorded director intentions. An `implemented-in-code` leaf checkpoint still requires perceptibility and continuity checks.
- **CI / media:** the requested commit produced decodable encoded frames, the correct soundtrack timing, and reproducible local source integration. A green run confirms these checks, not a finished emotional experience.
- **Visual / emotional review:** watch the actual encoded film with the full music. Check whether pressure gives way to light, human-scale places can be read, the leaf survives medium changes, farewell feels continuous, and the ending opens into a livable world. Contact sheets and activity / RMS charts assist inspection but cannot prove these qualities.

[VISUAL-QA.md](VISUAL-QA.md) records observed failures and corrections. [EMOTIONAL_DIRECTION.md](EMOTIONAL_DIRECTION.md) gives the current emotional acceptance criteria. A `final` target selects output specifications; its name alone does not imply visual approval.

## Editorial quality-floor revision

See [EDITORIAL-REBUILD.md](EDITORIAL-REBUILD.md) for the continuous acts and judgement-line roles. `revised-preview`, `hybrid-preview`, and `final` produce first-climax, farewell, final-build, and ending reviews alongside the measured visual-activity / audio-RMS diagnostics. These reports do not automatically approve the native or hybrid film.

## Hybrid quality gate

The first three original generative world tests, source provenance, offline integration and weak-shot replacement queue are described in [HYBRID_REBUILD.md](HYBRID_REBUILD.md). Passing asset checks does not assert that generated footage has passed visual review.
