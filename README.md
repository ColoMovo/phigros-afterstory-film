# AFTERSTORY / Phigros main-story fan tribute

An original 162.725442-second procedural film with the complete user-supplied song **What do you want more than a Happy ending？ — 濒笼**. Unofficial and not affiliated with Pigeon Games.

## Reproduce

Node 22, Python 3.12, FFmpeg. Linux Chromium libraries are installed explicitly by the included workflow. All visual resources and portable fonts are bundled; no network requests occur during scene rendering.

```sh
npm ci
npx remotion browser ensure
npm run fetch-assets
npm run verify-assets
npm run typecheck
npm run render:test         # six seconds of the densest section, 540p30
node scripts/render.mjs test60 # identical segment at 1080p60
npm run render:stills
npm run render:preview     # entire film, 960x540, 30 fps
npm run render:final       # entire film, 1920x1080, 60 fps
pip install numpy pillow
python scripts/contact-sheet.py
python scripts/verify-video.py
```

`npm run studio` opens the editable Remotion timeline. To use an existing Chromium binary locally set `CHROME_PATH=/path/to/chrome`. CI uses the Remotion-pinned Headless Shell. Set `RENDER_CONCURRENCY` to control parallel frame rendering (default 2).

## GitHub Actions

Open **Actions → Render Afterstory → Run workflow → quality: preview / final**. A six-second **1080p60** complexity test must pass before a full render is allowed. Pushes to `main` run only the smoke test. Dispatch runs upload MP4, keyframes, contact sheet, provenance, and machine-readable audio/video verification. A final dispatch also includes a 540p30 preview made from the final render.

The private repository contains the authorized original MP3. It must remain private with that file present. An optional `AUTHORIZED_AUDIO_URL` secret can restore a missing audio input, with its exact SHA-256 verified. Do not publish the music or original lyrics metadata as public repository assets.

## Files

- `src/index.tsx`: one Remotion composition; frame rate and dimensions change via `quality` only.
- `src/paint.ts`: deterministic Three.js mesh projection, Canvas painter, lyrics and designed cuts. No WebGL context or GPU is required. Three.js supplies cached actual three-dimensional mesh geometry; the CPU renderer projects and depth-sorts faces, rather than displaying a background cube.
- `src/data/lyrics.json`: exact embedded Japanese/Chinese line lyrics plus parsed AWLRC token times.
- `src/data/audio-analysis.json`: 60 Hz RMS, spectral flux, bass/mid/high, seven spectrum bands, transient candidates, low-energy regions and director anchors.
- `scripts/analyze.py`: repeatable source parsing and audio analysis, needs `numpy mutagen` and FFmpeg.
- `scripts/subset-fonts.py`: provenance helper for creating the already-bundled WOFF2 subsets. This helper references the original local font installation; **normal clones and CI never need it**, as the resulting redistributable subsets and licenses are tracked.
- `assets/SOURCES.md`: asset and research provenance.
- `output/phigros-main-story-celebration.mp4`: full H.264/AAC final.
- `output/preview.mp4`: full H.264/AAC preview.

## Direction and limits

Archive → nine-layer memory → irreversible ascent → separation → reconstruction → convergence → split dark sphere revealing dawn → afterstory and extinction. A moving fine white line changes gravity, divides compositions, becomes an orbital plane and finally a horizon. The 78.299–98.076 section deliberately drops density; 135.258 is the visual reveal. The final second is black.

Lyric text comes directly from supplied metadata, including apparent Japanese/Chinese transcription errors; it has not been silently rewritten. Token timing is used as a graphic cue, not a karaoke strip. Spectral-flux peaks are candidates, not a claim of perfectly inferred musical beats. All apparent chapter data and system language are abstract original fan design, not newly asserted official lore.

Video frames must have integral duration. Final 60 fps uses ceil(162.725442 × 60) frames; video length differs by less than one frame. Muxed audio begins at timestamp zero, uses the complete source at original speed, and is checked by correlation at zero lag against the original decoded song.
