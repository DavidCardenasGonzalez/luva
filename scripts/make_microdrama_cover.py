#!/usr/bin/env python3
"""Add a large English chapter badge to an existing vertical cover using FFmpeg."""
from argparse import ArgumentParser
from pathlib import Path
import os
import shutil
import subprocess

parser = ArgumentParser()
parser.add_argument("--input", required=True, type=Path)
parser.add_argument("--output", required=True, type=Path)
parser.add_argument("--chapter", default="1")
parser.add_argument("--label-y", type=float, default=0.68, help="Vertical placement as a fraction of image height")
args = parser.parse_args()
if not 0 <= args.label_y <= 1:
    raise SystemExit("--label-y must be between 0 and 1")

root = Path(__file__).resolve().parents[1]
ffmpeg = os.environ.get("FFMPEG") or str(root / "infra/node_modules/ffmpeg-static/ffmpeg")
if not Path(ffmpeg).is_file():
    ffmpeg = shutil.which("ffmpeg") or ""
if not ffmpeg:
    raise SystemExit("FFmpeg not found; set FFMPEG=/path/to/ffmpeg")

args.output.parent.mkdir(parents=True, exist_ok=True)
label = f"Chapter {args.chapter}"
font = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
filter_graph = (
    f"drawtext=fontfile='{font}':text='{label}':fontcolor=white:fontsize=160:"
    f"x=(w-text_w)/2:y=h*{args.label_y}:box=1:boxcolor=0xDC1659F8:boxborderw=36"
)
subprocess.run(
    [ffmpeg, "-hide_banner", "-loglevel", "error", "-y", "-i", str(args.input),
     "-vf", filter_graph, "-frames:v", "1", str(args.output)],
    check=True,
)
print(f"Wrote {args.output}")
