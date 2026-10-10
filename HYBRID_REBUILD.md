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
