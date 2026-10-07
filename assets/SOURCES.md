# Asset Sources — AFTERSTORY

Original, unofficial Phigros main-story celebration film. Prepared 2026-10-05 (Asia/Shanghai).

## Original procedural visuals
- Files: `src/paint.ts`, `src/index.tsx`
- Creator: original animation authored in this workspace for the user.
- Usage: entire film. All geometry, sky, particles, layouts, rings and archive structures are generated from code. No official PV footage, character artwork, jacket art, downloaded model, or stock transition appears in the video.
- The geometric structures and system labels are abstract fan artwork, not additional official lore.

## Music and lyrics
- Title: What do you want more than a Happy ending？
- Artist: 濒笼 (source ID3 artist)
- File: `public/music.mp3`
- Source: user-provided original MP3, copied without modification on 2026-10-05.
- Usage: 00:00.000 through 02:42.725; complete song at original speed, no added SFX.
- Lyrics: USLT lrc/tlrc/awlrc blocks parsed automatically into `src/data/lyrics.json`. Source spelling is retained, including apparent transcription errors and the translation placeholder `//` (not shown onscreen). Exact source is retained in `assets/lyrics-original.txt`.
- Rights: user-provided input; no redistribution license asserted. Initially added to a private repository for the explicitly requested CI rendering. On 2026-10-07 the user set the repository to public and explicitly requested that it remain public.

## Fonts
### Noto Sans CJK
- File: `public/fonts/CJK.woff2`
- Creator: Adobe / Google and respective Noto contributors.
- Original source: https://github.com/notofonts/noto-cjk
- Upstream release: https://github.com/notofonts/noto-cjk/tree/main/Sans/Variable
- Local source: Fedora-installed NotoSansCJK-VF.ttc, JP face, weight 400, subset for all supplied Japanese and Chinese lyrics plus credits.
- Prepared: 2026-10-05.
- License: SIL Open Font License 1.1, `assets/Noto-LICENSE.txt`.
- Usage: Japanese lyrics, Chinese translations, artist credit.
### Inter Display
- Files: `public/fonts/Display.woff2`, `public/fonts/Text.woff2`
- Creator: Rasmus Andersson / Inter contributors.
- Original source: https://github.com/rsms/inter
- Local source: installed InterDisplay-Bold.ttf and InterDisplay-Regular.ttf; subset and converted to WOFF2.
- Prepared: 2026-10-05.
- License: SIL Open Font License, `assets/Inter-LICENSE.txt`.
- Usage: original typographic title (not the official Phigros logo), archive numbers, English design, credits.

## Reference research — not incorporated assets
- Official Phigros account, Chapter 9 4.0.0 PV: https://www.bilibili.com/video/BV16vbN6REhD/
  - Publisher verified as Phigros官方 / Pigeon Games. Page and an in-browser video frame inspected. Large incomplete luminous orbital geometry and atmospheric scale were reference observations. No footage downloaded or reused.
- Official Chapter 8 3.0.0 PV: https://www.bilibili.com/video/BV1EV4y1D7sQ/
  - Official publication and credits read. Full shot-by-shot visual viewing not claimed.
- Official side chapter 3.2.0 极星卫: https://www.bilibili.com/video/BV1284y1o7BL/
  - Official publication and credits read. Full visual viewing not claimed.
- NEW DAWN teaser located in related results: https://www.bilibili.com/video/BV1atY76XEAN/
  - Result is a community upload, not independently established as the original official upload; no assets used.
- Broad visual direction, timing anchors and celebration premise supplied by the user. The animation is an original interpretation, not a recreation of any referenced PV shot sequence.

## Software
- Remotion: https://www.remotion.dev — version locked in package-lock.json; review Remotion's licensing for any future organizational/commercial deployment.
- Three.js: https://github.com/mrdoob/three.js — MIT; geometry and projection math.
- FFmpeg: https://ffmpeg.org — local/CI video mux, encode and verification.
