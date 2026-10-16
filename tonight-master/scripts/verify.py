#!/usr/bin/env python3
"""Independently verify this master's encoded CI movie and original soundtrack.

No old scene, shot or emotion data is imported. Contact frames come only from
the actual encoded movie. A technical pass never approves artistic quality.
"""
from __future__ import annotations

import argparse
import array
from fractions import Fraction
import hashlib
import itertools
import json
import math
import os
from pathlib import Path
import re
import subprocess
import sys
import tempfile


ROOT = Path(__file__).resolve().parents[1]
DURATION = 162.72544217687076
SOURCE_AUDIO_SHA = "0d94177a1ce9ff8579fff4ecc9ad6962138910c03adff5534acc30c7599627f3"
SAMPLE_RATE = 8000
SHA256 = re.compile(r"[0-9a-f]{64}\Z")
COMMIT = re.compile(r"[0-9a-f]{40}\Z")


def require(condition, message):
    if not condition:
        raise RuntimeError(message)


def finite(value, name):
    require(isinstance(value, (int, float)) and not isinstance(value, bool)
            and math.isfinite(value), f"Invalid numeric field: {name}")
    return float(value)


def integer(value, name):
    require(type(value) is int and value > 0, f"Invalid positive integer: {name}")
    return value


def digest(path):
    result = hashlib.sha256()
    with path.open("rb") as source:
        for data in iter(lambda: source.read(1024 * 1024), b""):
            result.update(data)
    return result.hexdigest()


def local_path(relative):
    require(isinstance(relative, str) and relative, "Missing local input path")
    candidate = Path(relative)
    require(not candidate.is_absolute() and ".." not in candidate.parts,
            "Input path must remain relative to this master")
    path = (ROOT / candidate).resolve()
    require(path.is_relative_to(ROOT) and path.is_file(), f"Missing local input: {relative}")
    return path


def validate_contract(film, manifest, mode, expected_commit=None):
    require(isinstance(film, dict) and isinstance(manifest, dict), "Expected JSON objects")
    duration = finite(film["duration"], "film.duration")
    require(abs(duration - DURATION) < 1e-6, "Master duration differs from the complete original song")
    require((film["width"], film["height"], film["fps"]) == (1920, 1080, 60),
            "film.json must describe the 1080p60 master")
    require(manifest["mode"] == mode and manifest.get("smoke") is False,
            "A smoke or different render mode cannot pass as this deliverable")
    fps = integer(manifest["fps"], "fps")
    width, height = integer(manifest["width"], "width"), integer(manifest["height"], "height")
    require(width * 9 == height * 16 and width <= 1920 and height <= 1080 and fps <= 60,
            "Invalid declared render dimensions or frame rate")
    cap = finite(manifest["renderDuration"], "renderDuration")
    require(0 < cap <= duration + 1e-6, "Render duration is outside the source song")
    require(abs(finite(manifest["masterDuration"], "masterDuration") - duration) < 1e-6,
            "Render manifest describes a different master duration")
    frames = integer(manifest["frames"], "frames")
    require(frames == math.ceil(cap * fps - 1e-8), "Declared frame total does not cover the render duration")
    if mode == "final":
        require((width, height, fps, frames) == (1920, 1080, 60, 9764)
                and abs(cap - DURATION) < 1e-6,
                "Final must be the complete 9764-frame 1080p60 original-song timeline")
    expected_name = "tonight-master.mp4" if mode == "final" else "review.mp4"
    require(manifest["output"] == expected_name, "Render output name disagrees with its mode")
    for name in ("filmSHA256", "outputSHA256"):
        require(isinstance(manifest.get(name), str) and SHA256.fullmatch(manifest[name]),
                f"Invalid render provenance hash: {name}")
    require(type(manifest.get("outputBytes")) is int and manifest["outputBytes"] > 0,
            "Missing encoded output byte count")
    commit = manifest.get("renderSourceCommit")
    require(isinstance(commit, str) and COMMIT.fullmatch(commit), "Missing exact render source commit")
    require(expected_commit is None or commit == expected_commit,
            "Render source commit differs from this GitHub Actions checkout")
    source = manifest["sourceAudio"]
    require(source["path"] == "private/song.mp3" and source["sha256"] == SOURCE_AUDIO_SHA,
            "Soundtrack is not the declared original archived input")
    require(abs(finite(source["duration"], "sourceAudio.duration") - DURATION) < .1,
            "Source MP3 container duration disagrees with the original song")
    assets = film["assets"]
    require(isinstance(assets, dict), "Film assets must be a keyed object")
    declared_shots = film["shots"]
    require(isinstance(declared_shots, list) and declared_shots, "Missing independent shot timeline")
    seen, previous_end, selected = set(), 0.0, []
    for shot in declared_shots:
        name = str(shot["id"])
        require(name not in seen, f"Duplicate film shot: {name}")
        seen.add(name)
        start, end = finite(shot["start"], "shot.start"), finite(shot["end"], "shot.end")
        require(abs(start - previous_end) <= .001 and end > start, "Film shots have a gap, overlap or empty interval")
        require(shot["asset"] in assets, f"Film shot refers to an undeclared asset: {name}")
        previous_end = end
        first = round(start * fps)
        last = frames if end >= cap else min(frames, round(end * fps))
        if first < frames:
            require(last > first, "A selected shot vanishes at the render frame rate")
            selected.append((shot, first, last - first))
    require(abs(previous_end - duration) <= .001, "Film shots do not span the complete song")
    actual_shots = manifest["shots"]
    require(isinstance(actual_shots, list) and len(actual_shots) == len(selected),
            "Render selected a different shot timeline")
    covered = 0
    for declared, (shot, first, count) in zip(actual_shots, selected):
        require(str(declared["id"]) == str(shot["id"]) and declared["firstFrame"] == first
                and declared["frames"] == count and first == covered,
                "Render shot frame intervals differ from film.json")
        for key in ("asset", "start", "end"):
            require(declared[key] == shot[key], f"Render changed a shot's {key}")
        for key, default in (("in", 0), ("speed", 1), ("transition", "cut")):
            require(declared.get(key, default) == shot.get(key, default), f"Render changed a shot's {key}")
        covered += count
    require(covered == frames, "Selected render shots have a frame gap or overlap")
    return {"mode": mode, "fps": fps, "width": width, "height": height,
            "frames": frames, "duration": cap, "movie": expected_name,
            "completeSong": abs(cap - DURATION) < 1e-6, "sourceCommit": commit}


def capture(command):
    return subprocess.check_output(command)


def probe(path):
    return json.loads(capture(["ffprobe", "-v", "error", "-show_streams", "-show_format",
                               "-of", "json", str(path)]))


def verify_video(movie, expected):
    info = probe(movie)
    videos = [stream for stream in info["streams"] if stream.get("codec_type") == "video"]
    audios = [stream for stream in info["streams"] if stream.get("codec_type") == "audio"]
    require(len(info["streams"]) == 2 and len(videos) == len(audios) == 1,
            "Encoded movie must contain exactly one video and one audio stream")
    video, audio = videos[0], audios[0]
    require(video["codec_name"] == "h264" and audio["codec_name"] == "aac", "Unexpected encoded codecs")
    require((video["width"], video["height"]) == (expected["width"], expected["height"]),
            "Actual encoded dimensions differ from the render contract")
    require(Fraction(video["r_frame_rate"]) == expected["fps"]
            and Fraction(video["avg_frame_rate"]) == expected["fps"],
            "Actual encoded frame rate differs from the render contract")
    require(int(video.get("nb_frames", -1)) == expected["frames"], "Encoded container frame count differs")
    require(video.get("pix_fmt") == "yuv420p" and video.get("color_range") == "tv"
            and all(video.get(key) == "bt709" for key in ("color_space", "color_transfer", "color_primaries")),
            "Encoded color contract must be limited-range BT.709 yuv420p")
    for stream in (video, audio):
        require(abs(float(stream.get("start_time", -1))) < .002, "Encoded stream does not start at zero")
    require(abs(float(video.get("duration", -1)) - expected["frames"] / expected["fps"]) < .002,
            "Video duration does not match its exact integer frame count")
    require(abs(float(audio.get("duration", -1)) - expected["duration"]) < .035,
            "Encoded soundtrack is truncated or extends beyond the intended song interval")
    require(abs(float(info["format"]["duration"]) - expected["frames"] / expected["fps"]) < .035,
            "Encoded file has unexpected duration")
    progress = capture(["ffmpeg", "-v", "error", "-nostdin", "-xerror", "-err_detect", "explode",
                        "-i", str(movie), "-map", "0:v:0", "-map", "0:a:0",
                        "-fps_mode:v", "passthrough", "-progress", "pipe:1", "-nostats", "-f", "null", "-"]).decode()
    decoded = [int(line.split("=", 1)[1].strip()) for line in progress.splitlines() if line.startswith("frame=")]
    require("progress=end" in progress and decoded and max(decoded) == expected["frames"],
            "Complete decode did not produce the declared number of actual video frames")
    return info, max(decoded)


def pcm(path):
    values = array.array("f")
    values.frombytes(capture(["ffmpeg", "-v", "error", "-nostdin", "-xerror", "-i", str(path),
                              "-map", "0:a:0", "-ac", "1", "-ar", str(SAMPLE_RATE), "-f", "f32le", "-"]))
    if sys.byteorder != "little":
        values.byteswap()
    return values


def correlation(a, b, count):
    require(count > SAMPLE_RATE, "Too little soundtrack to verify independently")
    ma = math.fsum(itertools.islice(a, count)) / count
    mb = math.fsum(itertools.islice(b, count)) / count
    aa = bb = ab = 0.0
    for x, y in zip(itertools.islice(a, count), itertools.islice(b, count)):
        x, y = x - ma, y - mb
        aa += x * x
        bb += y * y
        ab += x * y
    require(aa > 0 and bb > 0, "Silent or invalid source/encoded soundtrack")
    return ab / math.sqrt(aa * bb)


def verify_audio(source, movie, seconds):
    original, encoded = pcm(source), pcm(movie)
    require(abs(len(original) / SAMPLE_RATE - DURATION) < .002,
            "Decoded original song does not have its complete expected duration")
    require(abs(len(encoded) / SAMPLE_RATE - seconds) < .035,
            "Decoded movie soundtrack is incomplete or overlong")
    count = min(len(original), len(encoded), round(seconds * SAMPLE_RATE))
    require(count >= round(seconds * SAMPLE_RATE) - round(.035 * SAMPLE_RATE),
            "Not enough actual PCM samples to cover the intended soundtrack")
    value = correlation(original, encoded, count)
    require(math.isfinite(value) and value > .995, "Original-song correlation at zero offset failed")
    return {"method": "Decoded mono float32 at 8000 Hz; sample zero aligned; no shift search",
            "audioCorrelationAtZeroOffset": value, "minimumCorrelation": .995,
            "sourceDecodedSamples": len(original), "encodedDecodedSamples": len(encoded),
            "sourceDecodedDuration": len(original) / SAMPLE_RATE,
            "encodedDecodedDuration": len(encoded) / SAMPLE_RATE,
            "comparedSamples": count, "comparedSeconds": count / SAMPLE_RATE}


def contacts(movie, manifest, expected, output):
    from PIL import Image, ImageDraw, ImageFont

    samples = [{"id": str(shot["id"]), "frame": shot["firstFrame"] + (shot["frames"] - 1) // 2,
                "asset": shot["asset"]} for shot in manifest["shots"]]
    samples = [{"id": "first-frame", "frame": 0, "asset": None}, *samples,
               {"id": "last-frame", "frame": expected["frames"] - 1, "asset": None}]
    frames = sorted({sample["frame"] for sample in samples})
    fonts = sorted(path for path in (ROOT / "fonts").glob("*") if path.suffix.lower() in {".ttf", ".otf", ".ttc"})
    font = ImageFont.truetype(str(fonts[0]), 17) if fonts else ImageFont.load_default(size=17)
    width, height, label, header, columns = 320, 180, 42, 64, 5
    rows = math.ceil(len(samples) / columns)
    labeled = Image.new("RGB", (width * columns, header + (height + label) * rows), "#101820")
    blind = Image.new("RGB", (width * columns, height * rows), "black")
    draw = ImageDraw.Draw(labeled)
    scope = "FULL SONG" if expected["completeSong"] else "PARTIAL REVIEW"
    draw.text((14, 10), f"CI / {scope} / {expected['sourceCommit'][:12]}", font=font, fill="#e1e9ed")
    draw.text((14, 34), "Actual encoded frames. Technical verification does not approve visual quality.", font=font, fill="#adbdc6")
    with tempfile.TemporaryDirectory(prefix=".verify-frames-", dir=output) as temporary:
        temporary = Path(temporary)
        selection = "+".join(f"eq(n\\,{frame})" for frame in frames)
        subprocess.run(["ffmpeg", "-v", "error", "-nostdin", "-y", "-i", str(movie), "-map", "0:v:0", "-an",
                        "-vf", f"select={selection}", "-fps_mode", "vfr", "-frames:v", str(len(frames)),
                        str(temporary / "frame-%04d.png")], check=True)
        images = sorted(temporary.glob("frame-*.png"))
        require(len(images) == len(frames), "Missing real encoded contact frames")
        by_frame = dict(zip(frames, images))
        for index, sample in enumerate(samples):
            with Image.open(by_frame[sample["frame"]]) as opened:
                picture = opened.convert("RGB")
            require(picture.size == (expected["width"], expected["height"]), "Contact frame dimensions changed")
            sample.update(time=sample["frame"] / expected["fps"],
                          decodedRGBSHA256=hashlib.sha256(picture.tobytes()).hexdigest())
            x, y = index % columns * width, index // columns * (height + label) + header
            resized = picture.resize((width, height), Image.Resampling.LANCZOS)
            labeled.paste(resized, (x, y))
            blind.paste(resized, (x, index // columns * height))
            text = f"{sample['id']} / {sample['time']:.3f}s / f{sample['frame']}"
            draw.text((x + 7, y + height + 7), text, font=font, fill="#e1e9ed")
    labeled.save(output / "contact-sheet.jpg", quality=95)
    blind.save(output / "blind-contact-sheet.jpg", quality=95)
    return samples


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", required=True, choices=("review", "final"))
    parser.add_argument("--check-contract", action="store_true", help="Read film/render JSON only; no media or outputs")
    args = parser.parse_args()
    if not args.check_contract:
        require(os.environ.get("GITHUB_ACTIONS") == "true", "Formal movie verification and contacts run only in GitHub Actions")
        require(COMMIT.fullmatch(os.environ.get("GITHUB_SHA", "")), "Missing current GitHub source commit")
    film_path = ROOT / "film.json"
    output = ROOT / "output"
    film = json.loads(film_path.read_text(encoding="utf-8"))
    manifest = json.loads((output / "render-manifest.json").read_text(encoding="utf-8"))
    expected = validate_contract(film, manifest, args.mode,
                                 os.environ.get("GITHUB_SHA") if not args.check_contract else None)
    if args.check_contract:
        print(json.dumps({"scope": "JSON contract only; no media inspected", **expected}))
        return
    require(manifest["filmSHA256"] == digest(film_path), "film.json changed after rendering")
    if manifest.get("githubRunID") is not None:
        require(manifest["githubRunID"] == os.environ.get("GITHUB_RUN_ID"), "Render artifact belongs to a different CI run")
    movie = local_path("output/" + expected["movie"])
    movie_sha = digest(movie)
    require(movie_sha == manifest["outputSHA256"] and movie.stat().st_size == manifest["outputBytes"],
            "Actual encoded file differs from its render manifest")
    source = local_path("private/song.mp3")
    require(digest(source) == SOURCE_AUDIO_SHA == manifest["sourceAudio"]["sha256"], "Original soundtrack SHA mismatch")
    used_assets = sorted({shot["asset"] for shot in manifest["shots"]})
    inputs = []
    for name in used_assets:
        declared = film["assets"][name]
        archived = manifest["assets"][name]
        require(declared["path"] == archived["path"], "Render asset path changed")
        require(archived.get("fullVideoDecode") == "pass", "Used source did not pass full video decoding before rendering")
        actual_sha = digest(local_path(declared["path"]))
        require(actual_sha == archived["sha256"], "Actual used source asset SHA mismatch")
        require(not declared.get("sha256") or declared["sha256"].lower() == actual_sha, "Film asset SHA mismatch")
        inputs.append({"id": name, "path": declared["path"], "sha256": actual_sha})
    info, actual_frames = verify_video(movie, expected)
    audio = verify_audio(source, movie, expected["duration"])
    samples = contacts(movie, manifest, expected, output)
    report = {"schemaVersion": 1, "technicalVerification": "pass", **expected,
              "scope": "Complete original-song final" if args.mode == "final" else
                       "Complete original-song review" if expected["completeSong"] else "Partial review from song time zero",
              "outputSHA256": movie_sha, "outputBytes": movie.stat().st_size,
              "filmSHA256": digest(film_path), "renderManifestSHA256": digest(output / "render-manifest.json"),
              "sourceAudio": {"path": "private/song.mp3", "sha256": SOURCE_AUDIO_SHA, "bytes": source.stat().st_size},
              "usedSourceAssets": inputs, "fullDecode": "pass", "actualDecodedVideoFrames": actual_frames,
              "actualOutputProbe": info, **audio, "shotSamples": samples,
              "contactSheet": "contact-sheet.jpg", "contactSheetSHA256": digest(output / "contact-sheet.jpg"),
              "blindContactSheet": "blind-contact-sheet.jpg", "blindContactSheetSHA256": digest(output / "blind-contact-sheet.jpg"),
              "endingPolicy": "Intentional final black frames, including the final 2–3 seconds, are permitted; no brightness rejection is applied.",
              "visualAcceptance": "Not evaluated. Technical pass and extracted contacts do not approve aesthetics, pacing, lyrics or emotional effect."}
    (output / "verification.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"technicalVerification": "pass", "mode": args.mode, "frames": actual_frames,
                      "output": expected["movie"], "sha256": movie_sha,
                      "audioCorrelationAtZeroOffset": audio["audioCorrelationAtZeroOffset"],
                      "visualAcceptance": "Requires actual viewing"}))


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, ValueError, KeyError, OSError, subprocess.CalledProcessError) as error:
        print(f"VERIFY FAILED: {error}", file=sys.stderr)
        raise SystemExit(1) from None
