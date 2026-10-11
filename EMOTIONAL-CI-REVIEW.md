# Emotional CI review — final parallel export

This record describes the **actual encoded export** and the review evidence attached to GitHub Actions run [38123011135](https://github.com/ColoMovo/phigros-afterstory-film/actions/runs/38123011135). It is an evidence record, not an automatic artistic approval.

## Render identity

- Render source commit: `ffd4a651ad0fb7ce8da1e9a929f884f5ae224d47` (`Make final credit and sky lyrics renderable`)
- Physical Blender source reused by CI: `2f1a68b2f69b505f79cee42d571a0c06ab1ad71f`
- CI render run: `38123011135`
- Final file: `phigros-main-story-celebration.mp4`
- MP4 SHA-256: `8441f1ad58737b10a6341562c9dae1bb41c7825ca8e9a272d2a0a317f2e69437`
- Original soundtrack input SHA-256 recorded by CI: `0d94177a1ce9ff8579fff4ecc9ad6962138910c03adff5534acc30c7599627f3`
- Source fingerprint: `66459141a7f9a767bb18e2484328c90bee2ed850405c0599432f05fb37f3ff94`

## Technical verification

The CI artifact `film-verification.json` reports a complete decode of the 9,764-frame 1920×1080/60 export. The encoded file has one H.264 video stream and one AAC audio stream, both starting at zero. Video duration is `162.733333` seconds on the 60 fps frame grid; the original soundtrack is `162.725011` seconds in the muxed AAC stream. Zero-offset audio correlation is `0.9999805199801681`.

The final stream is explicitly tagged `yuv420p`, limited `tv` range, BT.709 matrix/transfer/primaries. Four absolute video chunks were assembled and the three encoded join boundaries passed the RGB pixel comparison in `final-chunk-assembly.json`. The CI editorial review package decoded the first climax, farewell, final build, and ending clips successfully.

## Actual visual checks

The encoded contact sheet and 70 keyframes were inspected after artifact download. The film’s visual path is present in the final file: signal and shell opening; cyan shell/core reveal; leaf, canopy and floating terrain; chapter-number/archival structures; glass and red-machine worlds; stair/ascend escalation; memory and seat-scale farewell; reconnection and whiteout; open sky with the recurring leaf; final end card and credit.

Specific encoded frames checked:

- `film-keyframes/03-dawn.png`: opening shell/core reveal and lyric entry.
- `film-keyframes/17-memory.png`: flat memory/seat insert, preserving the human-scale return.
- `film-keyframes/68-sky.png`: open sky, 09, leaf/platform return, and readable bright lyric treatment.
- `film-keyframes/70-question.png`: readable music credit `Apollo “HALO” program ft. 安月名莉子 × 大瀬良あい`, separate from the title, with `UNOFFICIAL FAN TRIBUTE` and `NOT AFFILIATED WITH PIGEON GAMES`.
- `film-keyframes/69-endcard.png`: quiet `PHIGROS / MAIN STORY / COMPLETE / 2019—2026 / THANK YOU FOR THE JOURNEY` closure.
- `final-chunk-boundaries.jpg`: the three actual encoded chunk joins.

The ending review also contains the whiteout and the return to the small platform/door/bench/leaf scale before the credit. The native closing space is intentionally sparse; it is a human-scale emotional release after the dense worlds, not a missing render section. The remaining material transition between some authored/native and generated plates is a documented aesthetic limitation, not a decode or delivery failure.

## Reproduction and rights boundary

Formal opening, preview, final, contact-sheet generation, and MP4 verification remain GitHub Actions jobs. The protected `AUDIO_DECRYPTION_KEY` is used only in CI; the repository does not publish the standalone MP3 or the decryption key. The project remains an unofficial fan tribute. Official/game recordings are reference material only; the final render uses the authored/procedural and explicitly selected local plates listed in `assets/SOURCES.md`.

The stable local copy is `output/phigros-main-story-celebration.mp4`; the complete CI evidence is under `output/ci-final-parallel-ffd4a65/` after downloading the run artifact.
