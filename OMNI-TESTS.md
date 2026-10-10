# Omni editing tests

Veo creates source worlds. Omni is the primary requested editing/camera-control stage. Blender defines spatial intent and deterministic bridges; Remotion owns time, typography and final glitch. This is the production direction, not a claim that Omni has already proved better camera control.

The Flow interface identifies the available video editor as **Omni 1.1 Flash**. The three newly generated Veo world baselines are retained. The dawn eight-second baseline is used for three independent camera edits, returning to the original history thumbnail before each edit: A slow forward dolly, B low-angle near-surface tracking, C a limited 15-degree orbit plus dolly. Each prompt locks geometry, materials, light, object motion, world layout and duration. B initially failed to load; the UI Retry operation subsequently returned a completed thumbnail. No result has been accepted from thumbnails alone.

`assets/generated-ai/omni-tests/versions.json` records the version tree and exact submitted prompts. All four camera-test files are now downloaded at original 720p/24fps, measured eight seconds each and registered with SHA256. They were exported from their individual history controls, rather than the scene-level export that repeatedly returned V01. Downloaded files still require a visual decision before film integration. Editing a good output never overwrites V01 or another branch.

## Additional controlled experiments

`scripts/blender/omni-controls.py` creates two original six-second silent control clips in CI only. They have simple materials intentionally:

- `dark-surface`: a large cropped coherent curved shell, a narrow warm seam and stable near-surface camera trajectory. Edit only material, atmosphere and lighting while preserving silhouette, camera path, timing and composition.
- `judgement-rule`: five stationary designed wedges, a thin horizontal line and a stable forward camera. Ask Omni to rotate the line and rotate gravity with it; objects must react while the camera remains stable. The original objects do not already fall, so the edit must actually establish the rule.

The controls are inputs for tests, not filler film shots. There are no official assets, lyrics, readable numbers or logos in them. Their `.blend`, original script and CI decode receipts preserve provenance. Import to Flow requires the already-requested extension file-URL permission, or a user-supplied equivalent upload; it is not silently enabled.

## Comparison gate

The `omni-review` Actions target uses the four actual local clips, checks SHA256, resolution, duration and full decode, then makes `omni-camera-comparison.mp4`, `omni-camera-contact-sheet.jpg` and a verification receipt. It does not reshoot, fetch from Flow or infer success from prompts. The comparison is silent to isolate source movement and avoid AI-generated sound. Selected film footage remains muted and uses the untouched user soundtrack.

Review camera direction, foreground parallax, horizon stability, target position, total orbit, identity of the island/sprout, timing and artifacts. Keep only improved intervals. A failed camera edit returns to the preceding version; cropping is a later editing option, not the initial substitute for trying Omni.

The world-edit and spatial-rule tests remain pending until their actual control videos are imported and edited. No cloud result is labeled final. The manifest now records three downloaded Veo baselines and three Omni camera variants as review-pending, with no timeline selections. Duplicate earlier dawn exports were excluded rather than mislabeled as camera variants.

## First actual camera decision

Actions run 38053837570 decoded all four distinct files and exported a synchronized silent comparison. Inspection of the 0.3 / 4.0 / 7.6-second stages does not show the requested superiority: A and C closely retain V01; B introduces a near platform in the middle and returns to wide framing by the end. B is rejected as a continuous path, C has not demonstrated the requested orbit. The production preference remains Omni editing first, but this is not a validated camera-control capability. A second independent C2 edit uses a shorter instruction and orbit only; it is downloaded and pending CI comparison.

Both six-second silent Blender controls passed rendering, measured frame count and full decode in Actions run 38053840830. They are archived with `.blend` and CI receipts in `assets/generated-ai/controls`. Flow import remains blocked by the browser upload permission system, including after the user explicitly reauthorized the two files. No alternate upload channel or browser-security workaround was used. These tests are pending, not passed.

Existing Flow sources remain usable: an independent material-only glass edit and an independent camera-only red-machine edit have been downloaded. They are compared against their V01 parents in `omni-edit-*.mp4` and contact sheets before timeline selection. They do not substitute for the original Blender world/rule experiments.

The exact nine-block prompts for the pending original-control experiments are prepared in `omni-tests/blender-world-edit.txt` and `blender-spatial-rule.txt`. The gravity test specifies down -> down-left -> left as the boundary turns clockwise, and explicitly forbids rotating the entire image or camera to simulate the rule. These prompts have not been submitted while import is denied.
