# Phigros · After the Last Page

**UNOFFICIAL FAN TRIBUTE.** Independent fan production; no official affiliation, authorization, collaboration or endorsement is implied.

This is a fresh cinematic edit built around the complete user-supplied song. It uses tactile mineral / ceramic / glass worlds, an occasional living leaf, and an emotional progression from remembered places through parting to a world that continues. Existing low-poly prototype footage is not part of this timeline.

## Authoritative edit

`film.json` defines 51 shot units across 162.72544217687076 seconds, 28 bilingual lyric lines, sparse chapter markers, the closing question and credits. The first 20 seconds form an independently renderable review edit using downloaded inputs. Later source entries marked `pending-source-download-and-QA` are a production plan and are not evidence that those clips exist or have passed review. Replace their metadata after actual download and inspection before a final render.

The final target is 1920×1080, 60 fps, 9764 frames, H.264/AAC in MP4. Most generated source motion is native 24 fps; 60 fps is the delivery frame rate, not a claim of newly captured 60 fps motion. No interpolation is applied to conceal synthesis errors.

## Reproducible rendering

Formal renders and review contact sheets run only in GitHub Actions using `.github/workflows/tonight-master.yml` at the repository root. The workflow decrypts the existing authorized encrypted song with `AUDIO_DECRYPTION_KEY` into `private/song.mp3`, renders, checks the encoded output, uploads the explicit deliverable paths and deletes the clear input.

Local read-only preflight:

```bash
python scripts/render.py --mode review --validate
python scripts/render.py --mode final --validate
```

CI render and verification:

```bash
python scripts/render.py --mode review
python scripts/verify.py --mode review
python scripts/render.py --mode final
python scripts/verify.py --mode final
```

The final path is `output/tonight-master.mp4`; the 20-second review is `output/review.mp4`. A review must never be presented as the complete film. Technical checks do not replace viewing the encoded film.

## Audio and text

The original user music is used from sample zero through its original end. Every generated source audio stream is discarded. There are no added sound effects, tempo changes, edited song sections or music fade-outs. `AUDIO_INPUT_EQUIVALENCE.json` documents that the current user input and existing authorized CI copy differ in file metadata but decode to identical 48 kHz stereo PCM.

Japanese text comes from the supplied community-corrected transcription. Chinese lines are the supplied unofficial fan adaptation. Neither is represented as an official verified lyric sheet. Unusual orthography is retained deliberately; word-level karaoke is disabled because the supplied timing supports line onsets only. Gaps after the first verse and during the farewell remain free of lingering subtitle text. `assets/text/font-coverage.json` records local JP/SC font coverage checks.

The original song is never committed in clear text or offered as a standalone public repository asset. Source music remains a separately owned third-party work.

## Visual review requirements

Keep provider watermarks. Inspect the actual encoded opening, transitions, complete farewell, reveal and tail. Reject severe temporal deformation, surprise letterboxing, unintended text, collisions, subtitles that overlap imagery or become unreadable, and any style regression to the abandoned prototype. The short archived glass/red inserts are optional selections with explicit source provenance; they are not a replacement for new worlds.

The closing card runs 149.8–153.8 seconds. Black-backed credits run 153.8–160.4 seconds; 160.4 seconds to the original song end is pure black without text or grain.

See `SOURCES.md` for the separation between reference materials and actual production inputs.
