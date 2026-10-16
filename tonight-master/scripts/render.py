#!/usr/bin/env python3
"""Deterministic, local-input FFmpeg compositor. Formal output runs only in Actions.

Run: python scripts/render.py --mode review|final [--limit SECONDS]
Read-only preflight: python scripts/render.py --mode final --validate

film.json lives in the master root (this file's grandparent). Each shot owns its
timeline interval; transitions never shorten/overlap the song. Dissolve uses a
six-frame terminal hold of the preceding shot, crossfading into the next shot.
"""
from __future__ import annotations

import argparse
import array
import hashlib
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import sys
from typing import Any


ROOT = Path(__file__).resolve().parents[1]
SEED = 20261016
TRANSITIONS = {"cut", "dissolve", "white", "line"}


def run(args: list[str], capture: bool = False) -> str:
    result = subprocess.run(args, check=True, text=True, stdout=subprocess.PIPE if capture else None)
    return result.stdout if capture else ""


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(1024 * 1024), b""):
            h.update(block)
    return h.hexdigest()


def local_path(raw: str) -> Path:
    p = Path(raw)
    if p.is_absolute():
        raise ValueError(f"Paths must be relative to the master root: {raw}")
    p = (ROOT / p).resolve()
    if not p.is_relative_to(ROOT):
        raise ValueError(f"Asset escapes master root: {raw}")
    if not p.is_file():
        raise FileNotFoundError(f"Required input missing: {raw}")
    return p


def probe(path: Path) -> dict[str, Any]:
    return json.loads(run(["ffprobe", "-v", "error", "-show_streams", "-show_format", "-of", "json", str(path)], True))


def stream_duration(s: dict[str, Any], info: dict[str, Any]) -> float:
    return float(s.get("duration") or info["format"]["duration"])


def ass_text(s: Any) -> str:
    # All input is data. No user-provided ASS drawing/override directives execute.
    return str(s).replace("\\", "＼").replace("{", "｛").replace("}", "｝").replace("\r", "").replace("\n", r"\N")


def ass_time(seconds: float) -> str:
    n = max(0, round(seconds * 100))
    return f"{n // 360000}:{n // 6000 % 60:02d}:{n // 100 % 60:02d}.{n % 100:02d}"


def event(start: float, end: float, style: str, text: str, tags: str = "", layer: int = 1) -> str:
    return f"Dialogue: {layer},{ass_time(start)},{ass_time(end)},{style},,0,0,0,,{{{tags}}}{ass_text(text)}\n"


def validate_film(film: dict[str, Any], fps: int, cap: float, strict_all: bool = True) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    duration = float(film["duration"])
    if duration <= 0 or int(film["fps"]) != 60 or int(film["width"]) != 1920 or int(film["height"]) != 1080:
        raise ValueError("film.json must define a positive-duration 1920x1080/60 master")
    original = local_path("private/song.mp3")
    song_info = probe(original)
    audios = [s for s in song_info["streams"] if s.get("codec_type") == "audio"]
    if len(audios) != 1:
        raise ValueError("private/song.mp3 must contain one original audio stream")
    source_duration = stream_duration(audios[0], song_info)
    if abs(source_duration - duration) > 0.1:
        raise ValueError(f"Original song duration {source_duration} does not match master {duration}")
    shots = film["shots"]
    if not shots:
        raise ValueError("Empty timeline")
    referenced = {s["asset"] for s in shots if float(s["start"]) < cap and float(s["end"]) > 0}
    checked: dict[str, Any] = {}
    for key, asset in film["assets"].items():
        if not strict_all and key not in referenced:
            raw = Path(asset["path"])
            if raw.is_absolute() or not (ROOT / raw).resolve().is_relative_to(ROOT):
                raise ValueError(f"Asset escapes master root: {asset['path']}")
            checked[key] = {"path": asset["path"], "duration": asset.get("duration"),
                            "expectedSHA256": asset.get("sha256"),
                            "actualValidation": "deferred; asset is outside this review interval"}
            continue
        path = local_path(asset["path"])
        actual_hash = digest(path)
        if asset.get("sha256") and asset["sha256"].lower() != actual_hash:
            raise ValueError(f"Source hash mismatch: {key}")
        info = probe(path)
        videos = [s for s in info["streams"] if s.get("codec_type") == "video"]
        if not videos:
            raise ValueError(f"No video stream: {key}")
        video = videos[0]
        checked[key] = {"path": asset["path"], "sha256": actual_hash,
                        "bytes": path.stat().st_size, "duration": stream_duration(video, info),
                        "width": video["width"], "height": video["height"],
                        "fps": video["r_frame_rate"],
                        "actualValidation": "pass",
                        "sourceAudioStreamsDiscarded": sum(s.get("codec_type") == "audio" for s in info["streams"])}
    previous_end = 0.0
    names: set[str] = set()
    for shot in shots:
        name = str(shot["id"])
        if name in names:
            raise ValueError(f"Duplicate shot id: {name}")
        names.add(name)
        start, end = float(shot["start"]), float(shot["end"])
        if abs(start - previous_end) > 0.001 or end <= start:
            raise ValueError(f"Non-contiguous or empty shot: {name}, previous end {previous_end}")
        if shot["asset"] not in checked:
            raise ValueError(f"Unknown asset in {name}: {shot['asset']}")
        if shot.get("transition", "cut") not in TRANSITIONS:
            raise ValueError(f"Unsupported transition in {name}")
        speed, point = float(shot.get("speed", 1)), float(shot.get("in", 0))
        if speed <= 0 or point < 0:
            raise ValueError(f"Invalid speed/source in point: {name}")
        checked_end = min(end, cap) if not strict_all and start < cap else end
        required = point + (checked_end - start) * speed
        available = checked[shot["asset"]]["duration"]
        if available is not None and required > float(available) + 1 / 24 + 0.002:
            raise ValueError(f"Source is too short for {name}: requires {required:.6f}s")
        if "fadeIn" in shot and (start != 0 or not 0 <= float(shot["fadeIn"]) <= end - start):
            raise ValueError("fadeIn is supported only on the first shot, within its duration")
        previous_end = end
    if abs(previous_end - duration) > 0.001:
        raise ValueError(f"Timeline ends at {previous_end}, expected {duration}")
    end_black = float(film.get("endBlackStart", duration))
    if not 0 <= end_black <= duration:
        raise ValueError("endBlackStart must be inside the complete film")
    end_card = film.get("endCard", {})
    if end_card:
        a, b = float(end_card["start"]), float(end_card["end"])
        if not 0 <= a < b <= end_black or not end_card.get("lines"):
            raise ValueError("endCard requires nonempty lines and a valid pre-black interval")
    for burst in film.get("graphicBursts", []):
        a, b = float(burst["start"]), float(burst.get("end", float(burst["start"]) + .16))
        if not 0 <= a < b <= end_black or not 1 <= len(str(burst.get("label", ""))) <= 3:
            raise ValueError("Graphic bursts require a valid pre-black interval and a 1-3 character label")
    target_frames = math.ceil(cap * fps - 1e-8)
    selected = []
    for shot in shots:
        a = round(float(shot["start"]) * fps)
        b = min(target_frames, round(float(shot["end"]) * fps))
        if float(shot["end"]) >= cap:
            b = target_frames
        if a >= target_frames:
            break
        if b <= a:
            raise ValueError(f"Shot vanishes at selected frame rate: {shot['id']}")
        selected.append({**shot, "firstFrame": a, "frames": b - a})
    if sum(s["frames"] for s in selected) != target_frames:
        raise ValueError("Rounded timeline has a frame gap")
    previous_lyric_end = 0.0
    for lyric in film.get("lyrics", []):
        a, b = float(lyric["start"]), float(lyric["end"])
        if a < 0 or b <= a or b > duration + .001 or a < previous_lyric_end - .001:
            raise ValueError("Lyrics must be ordered, non-overlapping and within the song")
        if not str(lyric.get("jp", "")).strip() or not str(lyric.get("zh", "")).strip():
            raise ValueError("Every lyric requires independently checked JP and ZH text")
        if end_card and a < float(end_card["end"]) and b > float(end_card["start"]):
            raise ValueError("End card must not overlap bilingual lyrics")
        previous_lyric_end = b
    report = {"seed": SEED, "masterDuration": duration, "renderDuration": cap,
              "frames": target_frames, "fps": fps, "assets": checked, "allAssetsStrict": strict_all,
              "sourceAudio": {"path": "private/song.mp3", "sha256": digest(original),
                              "duration": source_duration, "channels": audios[0].get("channels")}}
    return selected, report


def make_ass(film: dict[str, Any], selected: list[dict[str, Any]], cap: float, path: Path) -> None:
    jp_font = str(film.get("typography", {}).get("jpFont", "Noto Sans CJK JP"))
    zh_font = str(film.get("typography", {}).get("zhFont", "Noto Sans CJK SC"))
    visible_end = min(cap, float(film.get("endBlackStart", film["duration"])))
    # PlayRes stays 1080p; libass scales all coordinates and type for review output.
    header = f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.709

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: JP,{jp_font},52,&H00F7F5EE,&H00F7F5EE,&H180B0805,&H900B0805,0,0,0,0,100,100,0,0,1,2.8,1.4,2,112,112,124,1
Style: ZH,{zh_font},28,&H00F2EDE2,&H00F2EDE2,&H180B0805,&H900B0805,0,0,0,0,100,100,0,0,1,2.1,1.2,2,112,112,76,1
Style: Chapter,{jp_font},32,&H00F7F5EE,&H00F7F5EE,&H300B0805,&H900B0805,0,0,0,0,100,100,3,0,1,1.6,0,7,76,76,72,1
Style: Credit,{jp_font},30,&H00F7F5EE,&H00F7F5EE,&H000B0805,&H900B0805,0,0,0,0,100,100,0,0,1,1.5,0,5,140,140,0,1
Style: EndCard,{jp_font},42,&H00F7F5EE,&H00F7F5EE,&H180B0805,&H900B0805,0,0,0,0,100,100,0,0,1,2.8,1.4,5,130,130,0,1
Style: EndCardSC,{zh_font},34,&H00F7F5EE,&H00F7F5EE,&H180B0805,&H900B0805,0,0,0,0,100,100,0,0,1,2.2,1.3,5,130,130,0,1
Style: Attack,{jp_font},128,&H18F7F5EE,&H18F7F5EE,&H300B0805,&H900B0805,0,0,0,0,100,100,-2,0,1,1.5,0,9,100,100,110,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    lines = [header]
    for lyric in film.get("lyrics", []):
        a, b = float(lyric["start"]), min(visible_end, float(lyric["end"]))
        if b <= a:
            continue
        # Fit long Japanese lines inside the 88% safe width without a huge glyph crop.
        units = sum(1 if ord(c) > 255 else .55 for c in str(lyric["jp"]))
        size = max(38, min(52, math.floor(1696 / max(1, units))))
        lines.append(event(a, b, "JP", lyric["jp"], rf"\fad(80,80)\fs{size}"))
        lines.append(event(a, b, "ZH", lyric["zh"], r"\fad(80,80)"))
    previous_chapter = None
    for shot in selected:
        chapter = shot.get("chapter")
        if chapter and chapter != previous_chapter:
            a = float(shot["start"])
            if a < visible_end:
                lines.append(event(a, min(visible_end, a + .42), "Chapter", str(chapter), r"\fad(35,150)", 0))
            previous_chapter = chapter
    for burst in film.get("graphicBursts", []):
        a = float(burst["start"])
        b = min(visible_end, float(burst.get("end", a + .16)), a + 10/60)
        if b > a:
            lines.append(event(a, b, "Attack", burst["label"], r"\an9\pos(1820,110)\fad(10,45)", 2))
    card = film.get("endCard", {})
    if card:
        a, b = float(card["start"]), min(visible_end, float(card["end"]))
        if b > a:
            texts = card["lines"]
            positions = [350, 535, 640] if len(texts) == 3 else [540 + (i-(len(texts)-1)/2)*90 for i in range(len(texts))]
            for i, text in enumerate(texts):
                style = "EndCardSC" if i == len(texts)-1 and any("\u4e00" <= c <= "\u9fff" for c in str(text)) else "EndCard"
                size = 144 if i == 0 and len(str(text)) <= 3 else (34 if style == "EndCardSC" else 42)
                lines.append(event(a, b, style, text, rf"\an5\pos(960,{positions[i]:.1f})\fs{size}\fad(200,180)", 3))
    credits = film.get("credits", {})
    if credits:
        a, b = float(credits.get("start", float(film["duration"]) - 7)), min(visible_end, float(credits.get("end", film["duration"])))
        if b > a:
            texts = credits.get("lines")
            if not texts:
                texts = [credits[k] for k in ["title", "artist", "music", "rights", "disclaimer"] if credits.get(k)]
            if not texts:
                raise ValueError("credits must contain lines or title/artist/music/rights/disclaimer")
            step = min(72, 560 / max(1, len(texts)))
            y = 540 - step * (len(texts) - 1) / 2
            for i, text in enumerate(texts):
                lines.append(event(a, b, "Credit", text, rf"\an5\pos(960,{y + step * i:.1f})\fad(180,150)", 3))
    path.write_text("".join(lines), encoding="utf-8")


def filter_path(path: Path) -> str:
    # Escaping is for FFmpeg's filter grammar only, never a shell command.
    return str(path).replace("\\", "\\\\").replace(":", "\\:").replace("'", "'\\''")


def encode_args(fps: int, crf: str = "17") -> list[str]:
    return ["-c:v", "libx264", "-preset", "fast", "-crf", crf,
            "-pix_fmt", "yuv420p", "-r", str(fps), "-g", str(fps * 2),
            "-color_range", "tv", "-colorspace", "bt709", "-color_trc", "bt709",
            "-color_primaries", "bt709", "-video_track_timescale", "90000", "-threads", "2"]


def render_segments(selected: list[dict[str, Any]], report: dict[str, Any], work: Path,
                    width: int, height: int, fps: int) -> list[Path]:
    paths = []
    for index, shot in enumerate(selected):
        n, seconds = shot["frames"], shot["frames"] / fps
        source = local_path(report["assets"][shot["asset"]]["path"])
        path = work / f"segment-{index:03d}.mp4"
        tr = shot.get("transition", "cut") if index else "cut"
        next_tr = selected[index + 1].get("transition", "cut") if index + 1 < len(selected) else "cut"
        fade_seconds = min(.12, seconds / 4)
        filters = [f"trim=duration={seconds * float(shot.get('speed', 1)):.9f}",
                   f"setpts=(PTS-STARTPTS)/{float(shot.get('speed', 1)):.9f}",
                   f"fps=fps={fps}:round=near:start_time=0",
                   f"scale={width}:{height}:force_original_aspect_ratio=increase:flags=lanczos",
                   f"crop={width}:{height},setsar=1,format=yuv420p",
                   f"tpad=stop_mode=clone:stop_duration={max(1/fps, 1/24):.9f}",
                   f"trim=end_frame={n},setpts=N/({fps}*TB)"]
        if index == 0 and float(shot.get("fadeIn", 0)) > 0:
            filters.append(f"fade=t=in:st=0:d={min(seconds, float(shot['fadeIn'])):.6f}:color=black")
        if tr == "white":
            filters.append(f"fade=t=in:st=0:d={fade_seconds:.6f}:color=white")
        if next_tr == "white":
            filters.append(f"fade=t=out:st={seconds-fade_seconds:.6f}:d={fade_seconds:.6f}:color=white")
        if tr == "line":
            filters.append(f"drawbox=x=0:y=ih/2-3:w=iw:h=6:color=white@0.9:t=fill:enable='lt(t,{3/fps:.8f})'")
        command = ["ffmpeg", "-hide_banner", "-loglevel", "warning", "-nostdin", "-y", "-ss", str(shot.get("in", 0)), "-i", str(source)]
        if tr == "dissolve":
            still = work / f"terminal-{index-1:03d}.png"
            previous = paths[-1]
            run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-y", "-sseof", str(-1 / fps), "-i", str(previous), "-frames:v", "1", str(still)])
            if not still.is_file():
                raise RuntimeError("Could not decode outgoing terminal frame for dissolve")
            command += ["-loop", "1", "-framerate", str(fps), "-i", str(still)]
            graph = ("[0:v]" + ",".join(filters) + "[base];"
                     f"[1:v]format=rgba,fade=t=out:st=0:d={fade_seconds:.6f}:alpha=1[outgoing];"
                     f"[base][outgoing]overlay=0:0:enable='lt(t,{fade_seconds:.6f})':shortest=0,format=yuv420p[v]")
            command += ["-filter_complex", graph, "-map", "[v]"]
        else:
            command += ["-map", "0:v:0", "-vf", ",".join(filters)]
        command += ["-an", "-sn", "-dn", "-frames:v", str(n), *encode_args(fps), "-movflags", "+faststart", str(path)]
        print(f"[{index+1}/{len(selected)}] {shot['id']} — {n} frames, {tr}", flush=True)
        run(command)
        info = probe(path)
        video = next(s for s in info["streams"] if s["codec_type"] == "video")
        if int(video.get("nb_frames", 0)) != n or any(s["codec_type"] == "audio" for s in info["streams"]):
            raise RuntimeError(f"Segment contract failed: {shot['id']}")
        paths.append(path)
    return paths


def validate_source_decodes(report: dict[str, Any]) -> None:
    """Reject damaged inputs before re-encoding can conceal decoder failures.

    Only inputs selected by this render are decoded; future assets remain
    deferred in a partial review. This is called only after the Actions gate.
    """
    used = {shot["asset"] for shot in report["shots"]}
    for name in sorted(used):
        asset = report["assets"][name]
        run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin",
             "-xerror", "-err_detect", "explode", "-i", str(local_path(asset["path"])),
             "-map", "0:v:0", "-an", "-sn", "-dn", "-fps_mode:v", "passthrough",
             "-f", "null", "-"])
        asset["fullVideoDecode"] = "pass"
    print(f"Decoded {len(used)} selected source videos without errors", flush=True)


def pcm(path: Path, seconds: float) -> array.array:
    data = subprocess.check_output(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", str(path),
                                    "-map", "0:a:0", "-t", str(seconds), "-ac", "1", "-ar", "8000", "-f", "f32le", "pipe:1"])
    values = array.array("f")
    values.frombytes(data)
    if sys.byteorder != "little":
        values.byteswap()
    return values


def audio_correlation(source: Path, output: Path, seconds: float) -> float:
    a, b = pcm(source, seconds), pcm(output, seconds)
    count = min(len(a), len(b))
    if count < int(seconds * 8000) - 800:
        raise RuntimeError("Decoded output audio is incomplete")
    # Source and output both start at sample zero; no shift search conceals an offset.
    ma, mb = sum(a[:count]) / count, sum(b[:count]) / count
    aa = bb = ab = 0.0
    for x, y in zip(a[:count], b[:count]):
        x, y = x - ma, y - mb
        aa += x*x
        bb += y*y
        ab += x*y
    return ab / math.sqrt(aa * bb) if aa and bb else 0.0


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mode", choices=["review", "final"], required=True)
    parser.add_argument("--limit", type=float, help="CI smoke duration only; never a final deliverable")
    parser.add_argument("--validate", action="store_true", help="Read-only media/timeline validation; no render")
    args = parser.parse_args()
    for binary in ["ffmpeg", "ffprobe"]:
        if not shutil.which(binary):
            raise RuntimeError(f"Missing executable: {binary}")
    film_path = local_path("film.json")
    film = json.loads(film_path.read_text(encoding="utf-8"))
    fps, width, height = (60, 1920, 1080) if args.mode == "final" else (30, 1280, 720)
    cap = min(float(film["duration"]), 20.0 if args.mode == "review" else float(film["duration"]))
    if args.limit is not None:
        if args.limit <= 0:
            raise ValueError("--limit must be positive")
        cap = min(cap, args.limit)
    fonts = ROOT / "fonts"
    if not fonts.is_dir() or not any(p.suffix.lower() in {".ttf", ".otf", ".ttc"} for p in fonts.iterdir()):
        raise FileNotFoundError("Supply local JP/CN fonts in fonts/ before rendering")
    selected, report = validate_film(film, fps, cap, strict_all=args.mode == "final")
    report.update(mode=args.mode, width=width, height=height, filmSHA256=digest(film_path),
                  smoke=args.limit is not None, sourceAudioProcessing="none; generated source audio discarded",
                  shots=selected, transitions="Dissolve: incoming crossfade over <=120ms outgoing terminal hold; white: <=120ms fade each side; line: 3-frame graphic pulse")
    if args.validate:
        print(json.dumps(report, ensure_ascii=False, indent=2))
        return
    if os.environ.get("GITHUB_ACTIONS") != "true":
        raise RuntimeError("Formal renders run only in GitHub Actions. Local use is --validate only.")
    validate_source_decodes(report)
    output_dir = ROOT / "output"
    output_dir.mkdir(exist_ok=True)
    work = output_dir / f".work-{args.mode}{'-smoke' if args.limit else ''}"
    work.mkdir(exist_ok=True)
    ass_file = work / "subtitles.ass"
    make_ass(film, selected, cap, ass_file)
    paths = render_segments(selected, report, work, width, height, fps)
    concat_list = work / "segments.ffconcat"
    concat_list.write_text("ffconcat version 1.0\n" + "".join("file '" + str(p).replace("'", "'\\''") + "'\n" for p in paths), encoding="utf-8")
    silent = work / "silent-assembled.mp4"
    run(["ffmpeg", "-hide_banner", "-loglevel", "warning", "-nostdin", "-y", "-f", "concat", "-safe", "0", "-i", str(concat_list), "-map", "0:v:0", "-c", "copy", "-an", str(silent)])
    name = "tonight-master.mp4" if args.mode == "final" else "review.mp4"
    if args.limit:
        name = "smoke-" + name
    destination = output_dir / name
    subtitle_filter = f"ass=filename='{filter_path(ass_file)}':fontsdir='{filter_path(fonts)}'"
    picture = ["eq=contrast=1.025:brightness=0.002:saturation=0.97", f"noise=alls=0.8:allf=t+u:all_seed={SEED}"]
    credits = film.get("credits", {})
    if credits and credits.get("black", True):
        start, end = float(credits.get("start", float(film["duration"]) - 7)), report["frames"]/fps
        picture.append(f"drawbox=x=0:y=0:w=iw:h=ih:color=black:t=fill:enable='between(t,{start:.6f},{end:.6f})'")
    picture.append(subtitle_filter)
    if "endBlackStart" in film:
        # This is deliberately AFTER ASS/grain: the tail is pure black, no text/no noise.
        picture.append(f"drawbox=x=0:y=0:w=iw:h=ih:color=black:t=fill:enable='gte(t,{float(film['endBlackStart']):.9f})'")
    command = ["ffmpeg", "-hide_banner", "-loglevel", "warning", "-nostdin", "-y", "-i", str(silent), "-i", str(local_path("private/song.mp3")),
               "-map", "0:v:0", "-map", "1:a:0", "-vf", ",".join(picture), *encode_args(fps, "18"),
               "-c:a", "aac", "-b:a", "320k", "-map_metadata", "-1", "-movflags", "+faststart"]
    if args.mode == "review" or args.limit is not None:
        command += ["-t", f"{report['frames']/fps:.9f}"]
    command.append(str(destination))
    run(command)
    final_info = probe(destination)
    video = next(s for s in final_info["streams"] if s["codec_type"] == "video")
    audio = next(s for s in final_info["streams"] if s["codec_type"] == "audio")
    expected = report["frames"]
    if int(video.get("nb_frames", 0)) != expected or video["width"] != width or video["height"] != height:
        raise RuntimeError("Encoded movie frame/dimension contract failed")
    if video.get("pix_fmt") != "yuv420p" or video.get("color_space") != "bt709" or video.get("color_range") != "tv":
        raise RuntimeError("Encoded movie color contract failed")
    expected_audio = min(cap, report["sourceAudio"]["duration"])
    if abs(stream_duration(audio, final_info) - expected_audio) > .075:
        raise RuntimeError("Encoded soundtrack duration contract failed")
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin", "-i", str(destination), "-map", "0:v:0", "-map", "0:a:0", "-f", "null", "-"])
    correlation = audio_correlation(local_path("private/song.mp3"), destination, expected_audio)
    if correlation < .995:
        raise RuntimeError(f"Soundtrack zero-offset correlation failed: {correlation}")
    report.update(output=name, outputSHA256=digest(destination), outputBytes=destination.stat().st_size,
                  outputProbe=final_info, fullDecode="pass", audioCorrelationAtZeroOffset=correlation,
                  renderSourceCommit=os.environ.get("GITHUB_SHA"), githubRunID=os.environ.get("GITHUB_RUN_ID"),
                  ffmpegVersion=run(["ffmpeg", "-version"], True).splitlines()[0],
                  visualAcceptance="not implied by technical verification; inspect encoded movie")
    manifest = output_dir / ("render-manifest.json" if not args.limit else "smoke-render-manifest.json")
    manifest.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Verified {destination.name}: {expected} frames, SHA256 {report['outputSHA256']}", flush=True)


if __name__ == "__main__":
    try:
        main()
    except (ValueError, FileNotFoundError, RuntimeError, subprocess.CalledProcessError, KeyError) as exc:
        print(f"RENDER FAILED: {exc}", file=sys.stderr)
        sys.exit(1)
