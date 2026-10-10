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
