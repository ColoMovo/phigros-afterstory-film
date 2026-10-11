"""Assemble four verified, silent final chunks in GitHub Actions.

--validate-only checks JSON contracts without opening any media. Full decode,
audio correlation and editorial review remain the existing CI review scripts.
"""
from __future__ import annotations

import argparse
from fractions import Fraction
import hashlib
import json
import math
import os
from pathlib import Path
import re
import subprocess
import tempfile


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output"
CHUNKS = 4
FRAMES_PER_CHUNK = 2441
TOTAL_FRAMES = 9764
FPS = 60
WIDTH, HEIGHT = 1920, 1080
MUSIC_DURATION = 162.72544217687076
AUDIO_SHA = "0d94177a1ce9ff8579fff4ecc9ad6962138910c03adff5534acc30c7599627f3"
HEX_SHA = re.compile(r"[0-9a-f]{64}\Z")
GIT_SHA = re.compile(r"[0-9a-f]{40}\Z")
PER_CHUNK_FIELDS = {"index", "startFrame", "endFrame", "frames", "sha256"}
REQUIRED_FIELDS = {
    "schemaVersion", *PER_CHUNK_FIELDS, "totalFrames", "fps", "width", "height",
    "sourceCommit", "physicalSourceCommit", "musicDuration", "sourceAudioSHA256",
    "sourceFingerprint", "inputHashes", "codec", "pixelFormat", "muted",
    "colorRange", "colorSpace", "colorTransfer", "colorPrimaries",
    "quality", "composition", "shotCount", "encoding",
}


def require(condition: bool, message: str) -> None:
    if not condition:
        raise RuntimeError(message)


def unique_object(pairs):
    value = {}
    for key, item in pairs:
        require(key not in value, f"Duplicate JSON key: {key}")
        value[key] = item
    return value


def read_json(path: Path):
    return json.loads(path.read_text(encoding="utf-8"), object_pairs_hook=unique_object)


def file_sha(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def input_path(relative: str) -> Path:
    require(isinstance(relative, str) and relative != "", "Empty input hash path")
    path = Path(relative)
    require(not path.is_absolute() and ".." not in path.parts,
            f"Input hash path must be project-relative: {relative}")
    require(path.parts[0] in {"src", "scripts", "assets", "public"} or
            relative in {"package.json", "package-lock.json", "tsconfig.json"},
            f"Input hash path is outside the source asset scope: {relative}")
    require(path.suffix not in {".key", ".pem"} and "music-ci-key" not in relative,
            f"Private key paths are not source fingerprint inputs: {relative}")
    resolved = (ROOT / path).resolve()
    require(resolved.is_relative_to(ROOT), f"Input hash path escapes project: {relative}")
    return resolved


def source_fingerprint(item) -> str:
    # Match the ordered object in render-final-chunk.mjs and JSON.stringify.
    source = {key: item[key] for key in (
        "sourceCommit", "physicalSourceCommit", "totalFrames", "fps", "width", "height",
        "musicDuration", "sourceAudioSHA256",
    )}
    source["inputHashes"] = {path: item["inputHashes"][path]
                              for path in sorted(item["inputHashes"])}
    serialized = json.dumps(source, ensure_ascii=False, separators=(",", ":"))
    return hashlib.sha256(serialized.encode("utf-8")).hexdigest()


def validate_contracts(directory: Path, source_commit=None, physical_commit=None):
    expected_names = {f"chunk-{i:02d}.json" for i in range(CHUNKS)}
    actual_names = {p.name for p in directory.glob("chunk-*.json")}
    require(actual_names == expected_names,
            f"Expected exactly four chunk metadata files; got {sorted(actual_names)}")
    metadata = []
    common = None
    for index in range(CHUNKS):
        name = f"chunk-{index:02d}"
        item = read_json(directory / f"{name}.json")
        require(isinstance(item, dict), f"{name}: metadata must be an object")
        require(REQUIRED_FIELDS <= item.keys(),
                f"{name}: missing fields {sorted(REQUIRED_FIELDS - item.keys())}")
        expected = {
            "schemaVersion": 1, "index": index,
            "startFrame": index * FRAMES_PER_CHUNK,
            "endFrame": (index + 1) * FRAMES_PER_CHUNK - 1,
            "frames": FRAMES_PER_CHUNK, "totalFrames": TOTAL_FRAMES,
            "fps": FPS, "width": WIDTH, "height": HEIGHT,
            "musicDuration": MUSIC_DURATION, "sourceAudioSHA256": AUDIO_SHA,
            "codec": "h264", "pixelFormat": "yuv420p", "muted": True,
            "colorRange": "tv", "colorSpace": "bt709",
            "colorTransfer": "bt709", "colorPrimaries": "bt709",
            "quality": "final", "composition": "Afterstory", "shotCount": 64,
        }
        for key, value in expected.items():
            require(item[key] == value and type(item[key]) is type(value),
                    f"{name}: {key} must be {value!r}")
        encoding = {"crf": 17, "x264Preset": "fast", "imageFormat": "jpeg", "jpegQuality": 95, "colorSpace": "bt709"}
        require(isinstance(item["encoding"], dict) and item["encoding"].keys() == encoding.keys(),
                f"{name}: encoding must contain exactly the final encoding parameters")
        for key, value in encoding.items():
            require(item["encoding"][key] == value and type(item["encoding"][key]) is type(value),
                    f"{name}: encoding.{key} must be {value!r}")
        for key in ("sourceCommit", "physicalSourceCommit"):
            require(isinstance(item[key], str) and GIT_SHA.fullmatch(item[key]),
                    f"{name}: invalid {key}")
        for key in ("physicalSourceRunId", "renderRunId"):
            if key in item:
                require(isinstance(item[key], str) and re.fullmatch(r"[1-9][0-9]*", item[key]),
                        f"{name}: {key} must be a positive numeric string")
        for key in ("sha256", "sourceFingerprint"):
            require(isinstance(item[key], str) and HEX_SHA.fullmatch(item[key]),
                    f"{name}: invalid {key}")
        require(source_commit is None or item["sourceCommit"] == source_commit,
                f"{name}: sourceCommit differs from GITHUB_SHA")
        require(physical_commit is None or item["physicalSourceCommit"] == physical_commit,
                f"{name}: physicalSourceCommit differs from PHYSICAL_SOURCE_SHA")
        hashes = item["inputHashes"]
        require(isinstance(hashes, dict) and len(hashes) > 0,
                f"{name}: inputHashes must be a nonempty object")
        for path, sha in hashes.items():
            input_path(path)
            require(path.isascii(), f"{name}: source hash paths must be ASCII for canonical ordering")
            require(isinstance(sha, str) and HEX_SHA.fullmatch(sha),
                    f"{name}: invalid input SHA for {path}")
        require(item["sourceFingerprint"] == source_fingerprint(item),
                f"{name}: sourceFingerprint does not match canonical source metadata")
        shared = {key: value for key, value in item.items() if key not in PER_CHUNK_FIELDS}
        require(common is None or shared == common,
                f"{name}: shared source metadata differs between chunks")
        common = shared
        metadata.append(item)
    require(sum(item["frames"] for item in metadata) == TOTAL_FRAMES,
            "Chunk frame total does not match composition")
    require(math.ceil(MUSIC_DURATION * FPS) == TOTAL_FRAMES,
            "Composition length does not cover the complete song")
    return metadata


def probe(path: Path, count_frames=False):
    command = ["ffprobe", "-v", "error"]
    if count_frames:
        command += ["-count_frames"]
    command += ["-show_streams", "-show_format", "-of", "json", str(path)]
    return json.loads(subprocess.check_output(command, text=True))


def rate(value) -> Fraction:
    try:
        return Fraction(value)
    except (ValueError, TypeError, ZeroDivisionError) as error:
        raise RuntimeError(f"Invalid video frame rate: {value}") from error


def validate_video(video, frames: int, name: str, counted=False):
    require(video.get("codec_name") == "h264" and video.get("pix_fmt") == "yuv420p",
            f"{name}: expected H.264 / yuv420p")
    require(video.get("color_range") == "tv" and
            all(video.get(key) == "bt709" for key in
                ("color_space", "color_transfer", "color_primaries")),
            f"{name}: expected converted limited-range BT.709 matrix, transfer and primaries")
    require((video.get("width"), video.get("height")) == (WIDTH, HEIGHT),
            f"{name}: incorrect resolution")
    require(rate(video.get("r_frame_rate")) == FPS and rate(video.get("avg_frame_rate")) == FPS,
            f"{name}: expected constant 60 fps")
    require(int(video.get("nb_frames", -1)) == frames, f"{name}: incorrect container frame count")
    if counted:
        require(int(video.get("nb_read_frames", -1)) == frames,
                f"{name}: incorrect decoded frame count")
    require(abs(float(video.get("start_time", 0))) < .002, f"{name}: video does not start at zero")
    require(abs(float(video.get("duration", -1)) - frames / FPS) < .002,
            f"{name}: duration differs from integer frame range")


def validate_media(directory: Path, metadata):
    names = {p.name for p in directory.glob("chunk-*.mp4")}
    require(names == {f"chunk-{i:02d}.mp4" for i in range(CHUNKS)},
            f"Expected exactly four video chunks; got {sorted(names)}")
    signatures = []
    for item in metadata:
        path = directory / f"chunk-{item['index']:02d}.mp4"
        require(file_sha(path) == item["sha256"], f"{path.name}: actual MP4 SHA differs from metadata")
        info = probe(path, count_frames=True)
        require(len(info["streams"]) == 1 and info["streams"][0].get("codec_type") == "video",
                f"{path.name}: chunk must contain video only")
        video = info["streams"][0]
        validate_video(video, item["frames"], path.name, counted=True)
        signatures.append({key: video.get(key) for key in (
            "codec_name", "codec_tag_string", "profile", "level", "pix_fmt", "width", "height",
            "time_base", "sample_aspect_ratio", "color_range", "color_space", "color_transfer",
            "color_primaries",
        )})
    require(all(signature == signatures[0] for signature in signatures),
            "Video stream parameters differ between chunks")
    for relative, expected_sha in metadata[0]["inputHashes"].items():
        path = input_path(relative)
        require(path.is_file(), f"Missing restored source input: {relative}")
        require(file_sha(path) == expected_sha, f"Restored source input changed: {relative}")
    require(file_sha(ROOT / "public/music.mp3") == AUDIO_SHA, "Original music input SHA differs")
    return signatures[0]


def run(command):
    subprocess.run(command, check=True)


def extract_frames(movie: Path, frames, directory: Path):
    directory.mkdir()
    frames = sorted(set(frames))
    selection = "+".join(f"eq(n\\,{frame})" for frame in frames)
    run(["ffmpeg", "-v", "error", "-y", "-i", str(movie), "-map", "0:v:0", "-an",
         "-vf", f"select={selection}", "-fps_mode", "vfr", "-frames:v", str(len(frames)),
         "-pix_fmt", "rgb24", str(directory / "frame-%03d.png")])
    files = sorted(directory.glob("frame-*.png"))
    require(len(files) == len(frames), f"{movie.name}: missing decoded boundary frames")
    return dict(zip(frames, files))


def verify_boundaries(final: Path, directory: Path, metadata, temporary: Path):
    from PIL import Image, ImageDraw, ImageFont

    global_frames = [frame for boundary in range(1, CHUNKS)
                     for frame in range(boundary * FRAMES_PER_CHUNK - 2,
                                        boundary * FRAMES_PER_CHUNK + 2)]
    final_images = extract_frames(final, global_frames, temporary / "final-frames")
    source_images = {}
    for index in range(CHUNKS):
        needed = [frame - index * FRAMES_PER_CHUNK for frame in global_frames
                  if frame // FRAMES_PER_CHUNK == index]
        source_images[index] = extract_frames(directory / f"chunk-{index:02d}.mp4", needed,
                                               temporary / f"source-{index:02d}")
    font = ImageFont.truetype(str(ROOT / "public/fonts/CJK.ttf"), 20)
    small = ImageFont.truetype(str(ROOT / "public/fonts/CJK.ttf"), 16)
    tile_width, tile_height, label_height, header = 384, 216, 64, 100
    sheet = Image.new("RGB", (tile_width * 4, header + (tile_height + label_height) * 3), "#101b27")
    draw = ImageDraw.Draw(sheet)
    draw.text((16, 12), f"CI / FINAL CHUNK JOINS / {metadata[0]['sourceCommit'][:12]}",
              font=font, fill="#e2ecee")
    draw.text((16, 42), "Actual encoded final frames; RGB pixels match their silent source chunks.",
              font=small, fill="#a8bdc8")
    draw.text((16, 66), "This checks assembly continuity, not visual or emotional quality.",
              font=small, fill="#a8bdc8")
    boundaries = []
    for boundary in range(1, CHUNKS):
        edge = boundary * FRAMES_PER_CHUNK
        checked = []
        for column, frame in enumerate(range(edge - 2, edge + 2)):
            index, source_frame = divmod(frame, FRAMES_PER_CHUNK)
            with Image.open(final_images[frame]) as opened:
                actual = opened.convert("RGB")
            with Image.open(source_images[index][source_frame]) as opened:
                original = opened.convert("RGB")
            require(actual.size == original.size == (WIDTH, HEIGHT),
                    f"Boundary {boundary}: decoded dimensions differ")
            actual_sha = hashlib.sha256(actual.tobytes()).hexdigest()
            original_sha = hashlib.sha256(original.tobytes()).hexdigest()
            require(actual_sha == original_sha,
                    f"Boundary {boundary}: global frame {frame} differs from source chunk {index}")
            x, y = column * tile_width, header + (boundary - 1) * (tile_height + label_height)
            sheet.paste(actual.resize((tile_width, tile_height), Image.Resampling.LANCZOS), (x, y))
            draw.text((x + 9, y + tile_height + 5), f"JOIN {boundary} / frame {frame} / {frame / FPS:.6f}s",
                      font=small, fill="#e2ecee")
            draw.text((x + 9, y + tile_height + 31), f"chunk {index:02d} : {source_frame} / RGB exact",
                      font=small, fill="#a8bdc8")
            checked.append({"globalFrame": frame, "globalTime": frame / FPS, "sourceChunk": index,
                            "sourceFrame": source_frame, "finalRGBSHA256": actual_sha,
                            "sourceRGBSHA256": original_sha, "pixelsIdentical": True})
        boundaries.append({"firstFrameOfNextChunk": edge, "time": edge / FPS, "frames": checked})
    contact = OUTPUT / "final-chunk-boundaries.jpg"
    sheet.save(contact, quality=96)
    return boundaries, contact


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--chunks-dir", type=Path, default=OUTPUT / "final-chunks")
    parser.add_argument("--validate-only", action="store_true", help="Read JSON only; no media or outputs")
    args = parser.parse_args()
    directory = args.chunks_dir.resolve()
    if not args.validate_only:
        require(os.environ.get("GITHUB_ACTIONS") == "true", "Formal final assembly runs in GitHub Actions")
        require(GIT_SHA.fullmatch(os.environ.get("GITHUB_SHA", "")), "Missing valid GITHUB_SHA")
        require(GIT_SHA.fullmatch(os.environ.get("PHYSICAL_SOURCE_SHA", "")),
                "Missing valid PHYSICAL_SOURCE_SHA")
        require(directory.is_relative_to(OUTPUT.resolve()), "Chunk directory must be inside output")
    metadata = validate_contracts(directory, os.environ.get("GITHUB_SHA"),
                                  os.environ.get("PHYSICAL_SOURCE_SHA"))
    if args.validate_only:
        print(json.dumps({"scope": "JSON contract only; no media read", "chunks": CHUNKS,
                          "frames": TOTAL_FRAMES, "sourceFingerprint": metadata[0]["sourceFingerprint"]}))
        return
    for key, environment in (("physicalSourceRunId", "PHYSICAL_SOURCE_RUN_ID"),
                             ("renderRunId", "GITHUB_RUN_ID")):
        if key in metadata[0]:
            require(metadata[0][key] == os.environ.get(environment),
                    f"{key} differs from {environment}")
    signature = validate_media(directory, metadata)
    OUTPUT.mkdir(exist_ok=True)
    final = OUTPUT / "phigros-main-story-celebration.mp4"
    with tempfile.TemporaryDirectory(prefix=".final-assembly-", dir=OUTPUT) as temp:
        temporary = Path(temp)
        listing = temporary / "concat.ffconcat"
        lines = ["ffconcat version 1.0"]
        for index in range(CHUNKS):
            escaped = str(directory / f"chunk-{index:02d}.mp4").replace("'", "'\\''")
            lines.extend([f"file '{escaped}'", f"duration {FRAMES_PER_CHUNK / FPS:.12f}"])
        listing.write_text("\n".join(lines) + "\n", encoding="utf-8")
        joined = temporary / "joined-silent.mp4"
        run(["ffmpeg", "-v", "error", "-y", "-f", "concat", "-safe", "0", "-i", str(listing),
             "-map", "0:v:0", "-an", "-c:v", "copy", str(joined)])
        run(["ffmpeg", "-v", "error", "-y", "-i", str(joined), "-i", str(ROOT / "public/music.mp3"),
             "-map", "0:v:0", "-map", "1:a:0", "-c:v", "copy", "-c:a", "aac", "-b:a", "320k",
             "-t", str(MUSIC_DURATION), "-movflags", "+faststart", "-metadata",
             "title=Phigros — Afterstory / UNOFFICIAL FAN TRIBUTE", str(final)])
        final_probe = probe(final)
        require(len(final_probe["streams"]) == 2, "Final must contain one video and one audio stream")
        videos = [s for s in final_probe["streams"] if s["codec_type"] == "video"]
        audios = [s for s in final_probe["streams"] if s["codec_type"] == "audio"]
        require(len(videos) == len(audios) == 1, "Final stream types are incorrect")
        validate_video(videos[0], TOTAL_FRAMES, final.name)
        require(audios[0].get("codec_name") == "aac", "Final audio must be AAC")
        require(abs(float(audios[0].get("start_time", -1))) < .002,
                "Final music does not start at zero")
        require(abs(float(audios[0].get("duration", -1)) - MUSIC_DURATION) < .035,
                "Final audio does not retain the complete music duration")
        boundaries, contact = verify_boundaries(final, directory, metadata, temporary)
    render_meta = {
        "mode": "final", "quality": "final", "sourceStart": 0, "sourceEnd": MUSIC_DURATION,
        "frames": TOTAL_FRAMES, "fps": FPS, "width": WIDTH, "height": HEIGHT,
        "sourceCommit": metadata[0]["sourceCommit"], "sourceAudioSHA256": AUDIO_SHA,
        "physicalSourceCommit": metadata[0]["physicalSourceCommit"],
        "sourceFingerprint": metadata[0]["sourceFingerprint"], "inputHashes": metadata[0]["inputHashes"],
        "assembledChunks": CHUNKS,
        "pixelFormat": videos[0]["pix_fmt"], "colorRange": videos[0]["color_range"],
        "colorSpace": videos[0]["color_space"], "colorTransfer": videos[0]["color_transfer"],
        "colorPrimaries": videos[0]["color_primaries"],
    }
    for key in ("physicalSourceRunId", "renderRunId"):
        if key in metadata[0]:
            render_meta[key] = metadata[0][key]
    Path(str(final) + ".render.json").write_text(json.dumps(render_meta, indent=2) + "\n")
    report = {
        "schemaVersion": 1, "scope": "Silent chunk assembly and exact encoded-frame boundary checks",
        **render_meta, "file": final.name, "sha256": file_sha(final),
        "videoAssembly": "concat demuxer / H.264 stream copy / exact integer frame order",
        "audioAssembly": "Original music from zero; encoded once to AAC 320k; no chunk audio",
        "colorEncoding": "Each chunk uses Remotion BT.709 zscale matrix/limited-range conversion once; concat and final mux preserve the verified values by stream copy.",
        "streamSignature": signature, "chunks": metadata, "boundaries": boundaries,
        "boundaryPixels": "pass", "boundaryContactSheet": contact.name,
        "boundaryContactSheetSHA256": file_sha(contact),
        "fullDecodeAndAudioCorrelation": "Performed separately by scripts/review-shots.py",
        "visualAcceptance": "Not implied by boundary pixel matching or technical verification",
    }
    (OUTPUT / "final-chunk-assembly.json").write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"file": final.name, "frames": TOTAL_FRAMES, "sha256": report["sha256"],
                      "boundaryPixels": "pass", "boundaryContactSheet": contact.name}, indent=2))


if __name__ == "__main__":
    main()
