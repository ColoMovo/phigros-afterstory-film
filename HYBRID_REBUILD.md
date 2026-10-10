# Hybrid rebuild

The full source film is preserved locally as `output/baseline-v1.mp4` with an exact-copy receipt in `output/baseline-v1.json`. It is not a new export or an approved visual baseline. Work continues on `HYBRID_REBUILD`; the public repository and existing history remain unchanged.

## First quality gate

Only GLASS MEMORY, RED MACHINE and NEW DAWN are queued initially, one generation each. Original Blender camera/silhouette references are in `assets/generated-ai/references`; their source is `scripts/blender/hybrid-previs.py`. These three local images are composition previs, not finished film shots. All official video/art/UI remains reference-only and is not uploaded to the generator.

The observed Google Flow setup offers Veo 3.1 - Quality, first-frame input, landscape 16:9, one output, 8 seconds and 720p. Higher-resolution download/upscale is checked when a result exists. The requested 20–30-second pools can be assembled from multiple sources after the initial visual gate; the first gate does not substitute a lower-quality model for extra duration. Each prompt independently defines subject, world, composition, material, light, camera, motion, color and negative constraints.

The original first frames were completed, but the Chrome extension upload interface required an additional file-URL permission that has not been granted. Without changing that security setting, the initial three tests use explicitly recorded text-to-video prompts (`*-text.txt`). They do not claim first-frame anchoring. The original references remain ready for a later authorized image-to-video comparison.

Actual outputs must be downloaded into `assets/generated-ai/<world>/`, then recorded with provider/model, exact prompt, date, duration, resolution, SHA256, first-frame provenance and honest quality decision in `manifest.json`. The populated manifest records actual downloaded clips; review-pending entries are not accepted film sources. There is no implicit remote clip and no generated placeholder.

## Weak-segment queue

These are replacement candidates, not a promise to replace successful existing shots or to insert every test plate:

| Original music time | Problem / intended event | Initial candidate |
| --- | --- | --- |
| 47–50s | Sparse warm primitives; enclosing material and near miss | RED MACHINE |
| 82–84s | Fibre sample in emotional passage | Keep rebuilt deterministic farewell |
| 87–90s | Leaf insert breaks farewell continuity | Keep rebuilt deterministic split |
| 94–97s | Isolated line lacks a world | Keep rebuilt deterministic absence |
| 103–106s | Long static noise | Short post glitch + controlled reconnection |
| 107–112s | Gallery plant breaks acceleration | Keep reconstructed portal / bridge |
| 121–124s | Low-detail number field | Retain exact numerals; GLASS atmosphere if selected |
| 124–128s | Separate models lack common gravity | Continuous convergence / original precise geometry |
| 129–133s | Flat circle | Keep rebuilt close cropped curved void |
| 135–149s | Dawn lacks evolving atmosphere | NEW DAWN + controlled release / exact 09 |

GLASS can also replace a short weak archive/traversal segment before the first climax. Exact placements and best source windows are decided only after viewing downloaded outputs; source clips never dictate final shot duration.

## Offline composition and checks

`src/data/ai-shot-selections.json` contains explicit source in/out times and final music in/out times. `scripts/verify-ai-assets.mjs` checks identity, local paths, container/codec/duration/resolution, SHA256, selected windows and decoded readability in CI; it stages only accepted inputs into ignored `public/generated-ai`. Optional missing sources leave the original procedural world visible. The bundle uses `staticFile` and `OffthreadVideo`, never a Flow URL. All generated audio is muted; the final mux uses the unchanged original user MP3 at zero offset.

Original procedural worlds render underneath every selected AI plate, and controlled typography/judgment cuts/graphic layers render over it. The pilot preserves the opening shell, number architecture, five Cycles bridge shots and the editorial continuous acts. At least 20–35% original language is a floor, not an AI replacement target.

`hybrid-preview` is a formal GitHub Actions target. It exports the full music timeline as `hybrid-preview.mp4`, `final-build-review.mp4` (110–145s), `ending-review.mp4`, a blind contact sheet, source/decode reports and actual encoded visual-activity/audio-RMS chart. An input audit or passing render is not a visual acceptance decision; accepted source windows and the mixed film must both be inspected.

## First mined pilot, after actual CI source review

Actions run 38055119650 compared every second-round edit against its real parent. Glass material layering improved visibly. The red camera edit and dawn orbit retest did not demonstrate their requested correction; no camera superiority is claimed. The pilot uses glass V02 (2.75 s), short coherent forward intervals from red V01 after the failed reshoot attempt (6.1167 s total), and stable dawn A (6.8 s in two intervals). The entire generated-source contribution is about 15.67 s / 9.63% of the film; the original geometry, graphic worlds and five Cycles bridges remain dominant.

The selected dawn runs from 142.3 to 149.1 s with one source island and one continuous source camera, a new-leaf event, and a final quarter-second dissolve into original empty sky. Native duplicate island geometry is hidden only when that verified local plate exists; optional-input fallback restores the complete original dawn. Exact 01–09 remnants are authored in post, and 09 releases into the final sky. Credits identify original geometry and generated world plates. This is a limited preview gate, not final visual acceptance.

## Actual complete preview review

Actions run 38055849071 completed the entire 162.73-second preview at 960×540 / 30 fps / 4882 frames. The downloaded MP4 matches its CI checksum, passes complete decode, and has soundtrack correlation 0.99998052 at zero offset. These are preview delivery checks, not 1080p60 final delivery or artistic approval.

Actual encoded stages exposed oversized surface relief blocking the dark body's curvature at 131–132 seconds, clustered chapter numerals, a weak dawn translation annotation, and credits appearing over a mid-grey fade at 154.48 seconds. The correction retains the existing worlds: smaller surface relief, visible matte engraved strata, a continuous lateral approach aligned with the fissure, separate numeral banks, clearer photo-plate annotation, and a black credits background before text enters. The report now identifies archived generated plates only when verified source evidence overlaps the actual rendered interval. Development stills and type checking pass; the corrected complete preview requires its own Actions verification.

## Corrected complete preview: encoded review

Actions run [38058304467](https://github.com/ColoMovo/phigros-afterstory-film/actions/runs/38058304467) completed commit `36c1f598ed2d8ed4543463ab541e8b333c5164f3`. The downloaded MP4 is 34,304,061 bytes with SHA256 `e3e4b3f4181347d48a64cf2985bebbe7fecb9181de7a456b86702cc07a9c0efe`, matching the CI receipt. It contains 4,882 H.264 frames at 960×540 / 30 fps, video duration 162.733333 s and AAC audio duration 162.725011 s, both starting at zero. Full decode passes and zero-offset soundtrack correlation remains 0.99998052. The film, sidecar, physical, editorial and anchor reports identify the same source commit; the three archived generated inputs match their actual local source hashes. The smoke interval with no generated plate correctly declares an empty generated-input list.

Actual same-time images confirm the separated numeral banks at 125.699 s and readable black-background credits at 154.48 s, 155.033 s and 156.633 s. The warm opening is now visible at 132.274 s, but its broad, flat appearance still obscures convincing shell thickness and curvature; this is an improvement in visibility, not approval of the black-core spectacle. Dawn's island, leaf and 09 remain intact at 146.156 s, while the fine Chinese annotation is still faint.

The next quality-floor priorities are the shallow value separation in the 58–66 s staircase, lyric contrast across the black-white canyon, clearer reconstruction cause/effect at 98–113 s, and the evolving sky release at 135–142 s. These should improve existing shots rather than add arbitrary worlds. This run is a complete mixed-pipeline preview, not a final 1080p60 export or artistic acceptance. The two original-control Omni world/rule experiments remain pending browser import permission; no bypass or alternate upload channel was used.
