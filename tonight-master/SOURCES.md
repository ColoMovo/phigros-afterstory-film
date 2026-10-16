# Sources and production boundaries

## Reference Materials

Official Phigros PVs, game recordings, community visual analysis and the user's production/correction texts inform visual grammar and the brief. No PV frame, game UI, extracted official asset, character art, chapter artwork or unconfirmed third-party illustration is an asset in this edit. Reference materials are not treated as freely reusable simply because they are public.

The user distilled the applicable fan-work requirements directly into the task. Missing original policy pages and reference videos do not block production, and their missing contents are not guessed. This file does not claim independent legal verification of a 2026 policy document.

Community lyric comparison reference supplied/rechecked during production:
https://wikiwiki.jp/phigros/What%20do%20you%20want%20more%20than%20a%20Happy%20ending%3F

This is a community source, not an official lyric sheet. Japanese unconventional written forms and readings remain provenance-limited. The Chinese lines are an unofficial adaptation from the user handoff.

## Materials Used In Final Render

This section describes the configured production inputs. A source marked pending in `film.json` has **not** yet entered an encoded final. The render manifest and final verification report identify which local files actually entered each CI artifact.

### Original generated picture

New video sources are original text-to-video generations in the user's Google Flow project:

**PHIGROS · TONIGHT MASTER · 2026-10-16**
https://flow.google.com/project/7bd1887f-22e4-4122-b5e7-340149da4592

Exact per-source prompts, selected model, intended duration and download status are recorded in `prompts/flow-shots.json`. The configured sources are named in `film.json`; existing files have their SHA-256, duration, dimensions and native frame rate recorded there. Future-source paths with empty hashes are explicitly pending and must be replaced with real probed input metadata before final acceptance. The project does not use official footage as generation input. Original imagery is not a claim that model outputs are error-free or exclusive.

All generated source audio is removed. Visible provider watermarks remain; nothing in this pipeline is authorized to crop, obscure or remove them.

### Limited earlier original sources

Two original sources from the prior project may appear as short, reviewed inserts. Their original generation records and prompt lineage are preserved under `prompts/archived-origin/`.

| Local source | Original source | Model | Configured use |
| --- | --- | --- | --- |
| `assets/video/glass-memory-v01.mp4` | `WORLD_GLASS_V03_EMOTION.mp4` | Google Flow / Omni 1.1 Flash | Only source 1.70–4.45 seconds, 2.75 seconds of tactile memory |
| `assets/video/red-machine-v01.mp4` | `WORLD_RED_V01.mp4` | Google Flow / Veo 3.1 Quality | Two brief source selections as concentrated pressure, never generated audio |

The glass clip is an edit of an earlier original generated clip; its source lineage is preserved. Prior acceptance evidence is context, not proof that this new film's use is visually accepted. No previous low-poly Blender scene is used.

### Music

The one soundtrack is the user's supplied **What do you want more than a Happy ending?** input, used complete without additional music or effects. The project does not infer music redistribution rights or official sublicensing from the song's presence in Phigros.

Credit spelling used for this render: **Apo11o "HALO" program ft. 安月名莉子 × 大瀬良あい**, following the community song record and project handoff. This attribution does not assert permission from the music rights holders. The local file's uploader/tag name is not substituted for the music creators.

The clear original stays ignored in `private/`. CI uses the previously authorized encrypted input and GitHub Actions Secret. No clear MP3 is added to this public branch. Existing repository history is retained according to the user's explicit choice; this production does not rewrite it.

### Fonts and text

- `fonts/NotoSansCJK-VF.ttc`: Noto Sans CJK JP / SC, supplied locally for reproducible Japanese and Simplified Chinese glyph coverage. License: `fonts/Noto-LICENSE.txt` (SIL Open Font License).
- `assets/text/community-corrected-lines.UNVERIFIED.json`: user-handoff community transcription and unofficial Chinese adaptation; no official verification claim.
- Native chapter numbers, straight line transitions, final 09/question and credits are original typography in the FFmpeg/ASS compositor, with only one readable bilingual subtitle system.

## Disclosure

The film must say **UNOFFICIAL FAN TRIBUTE**. It is an independent fan work, not official Phigros promotion or a collaboration. Generated video is used as picture material, with Google Flow / Veo / Omni disclosed in the credits and source records. Reference use and final asset use remain separate throughout.
