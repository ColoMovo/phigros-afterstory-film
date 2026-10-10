# AFTERSTORY — Unofficial Phigros Fan Tribute

**UNOFFICIAL FAN TRIBUTE — NOT AFFILIATED WITH PIGEON GAMES.**

本项目为非官方玩家创作，与南京鸽游网络有限公司及《Phigros》官方不存在授权、合作或运营关系。

The current rebuild is a complete timed film implementation with independently rebuilt world identities; see WORLD-IDENTITY.md for the visible palette / light / medium / scale / camera differences. Technical checks and a shot manifest do not establish visual acceptance. Earlier shell / opening reviews are superseded; this revision must be assessed from its own CI output.

`src/data/shots.json` records continuous start / end, world, heroObject, cameraMotion, palette, density, transition, musicCue, lyricsCue, renderMethod, function and event. `src/shot-library.ts` renders every shot from absolute song time using depth-buffered Three.js geometry and five CI-generated original Blender clips on the same Remotion timeline. The first 12 seconds are one shared native scene: near shutters uncover the shell, its side opening leads into a curved chamber, and the chamber reveals the island world already behind it. The 5.321s, 7.3833s, 9.3s and 10.5s event boundaries preserve camera position, gaze, velocity, FOV and roll. A CI-generated opening-joins sheet shows the five encoded frames around each boundary. Archive images are original procedural artwork. No official PV frame, character, UI, logo or song illustration appears in the active composition.

## Development

```sh
npm ci
# Restore the user's exact MP3 to public/music.mp3 locally. It is ignored by Git.
npm run verify-assets
npm run typecheck
npm run studio
node scripts/render.mjs dev-stills
# Optional extremely short development smoke:
node scripts/render.mjs smoke
```

The original music is a necessary user-provided input. Third-party rights remain with the respective rights holders. No standalone music release is created. The public repository contains an AES-256-GCM encrypted CI input; the key is provided only through the protected `AUDIO_DECRYPTION_KEY` Actions Secret. Public clones without that input cannot reproduce audio until the user's MP3 is restored. See `assets/SOURCES.md` for input attribution and exact SHA256.

## Formal rendering: GitHub Actions only

```sh
gh workflow run render-video.yml -f target=opening-review -f opening_seconds=17.7
gh workflow run render-video.yml -f target=preview
gh workflow run render-video.yml -f target=final
```

Targets: `smoke`, `physical-review`, `opening-review` (alias `opening`), `preview`, `final`. Formal rendering outside Actions is intentionally rejected. Every run verifies source assets and typechecks, bundles the actual composition, renders a 3-second 1080p60 complex-world smoke, decodes it, then renders and verifies the requested target.

- Opening review: configurable 12–58.315 seconds (default 58.315), 960×540 / 30 fps, `opening-review.mp4`, `opening-contact-sheet.jpg`, actual encoded shot samples, plus labeled and blind contact sheets, verification and manifest.
- Preview: entire 162.725-second song, 960×540 / 30 fps, `preview.mp4`, `contact-sheet.jpg`, labeled and blind contact sheets and verification.
- Final: entire song, 1920×1080 / 60 fps (native scenes 60 unique frames/sec; five Cycles clips 30fps repeated exactly twice), `phigros-main-story-celebration.mp4`, contact sheet and verification.

Verification checks H264 / AAC, dimensions, frame count, zero timestamps, full decode, original-input hash and audio correlation at zero offset. The contact sheet is extracted from encoded MP4 frames rather than separately rerendered source stills. Actions artifacts include source attribution and the shot manifest, never a standalone MP3 or key. No runtime network images / fonts are used.

This pass prioritizes world coverage and state changes. Further art-direction polish must be driven by actual CI frames and motion review; do not mistake scene-family names for proof of distinct visual states.

Five combined Cycles shots are reconstructed from source in four seeded absolute frame ranges per shot. Preview uses 960×540, 8 samples; final uses 1920×1080, 16 samples, denoised. The job verifies every PNG and source fingerprint before encoding. `VISUAL-QA.md` records observed event failures and corrections. Stage contact sheets use four frames from each actual encoded independent anchor; there are 70 timed units and 37 anchors in this revision. No count is an artistic acceptance claim.

## Editorial quality-floor revision

See [EDITORIAL-REBUILD.md](EDITORIAL-REBUILD.md) for the revised music arc, continuous acts and judgment-line roles. Dispatch the `revised-preview` Actions target for the five requested editorial artifacts and the measured visual-activity/RMS chart. This review does not replace or claim acceptance of the previous native final.
# Hybrid quality gate

The first three original generative world tests, source provenance, offline integration and weak-shot replacement queue are described in [HYBRID_REBUILD.md](HYBRID_REBUILD.md). Passing asset checks does not assert that generated footage has passed visual review.
