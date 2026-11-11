#!/usr/bin/env bash
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
ROOT="$(cd "$HERE/.." && pwd)"
ASSET_DIR="${ASSET_DIR:-$ROOT/output/its_a_date_episode_01}"
EPISODE="${EPISODE:-}"
CLOSING="${CLOSING:-}"
FFMPEG="${FFMPEG:-$ROOT/infra/node_modules/ffmpeg-static/ffmpeg}"
EN_SRT="${EN_SRT:-}"
LOGO="${LOGO:-$ASSET_DIR/luva_logo.png}"
OUTPUT="$ASSET_DIR/${OUTPUT_NAME:-microdrama.mp4}"
TAGLINE="${TAGLINE-Learn English with Stories}"
BRAND_STYLE="${BRAND_STYLE:-floating}"
BRAND_OVERLAY="${BRAND_OVERLAY:-$ASSET_DIR/brand_overlay.png}"

[[ -n "$EPISODE" ]] || { echo "Set EPISODE=/path/to/episode.mp4" >&2; exit 1; }
[[ -n "$EN_SRT" ]] || { echo "Set EN_SRT=/path/to/episode_en.srt" >&2; exit 1; }
mkdir -p "$ASSET_DIR"
if [[ ! -x "$FFMPEG" ]]; then FFMPEG="$(command -v ffmpeg)"; fi
[[ -f "$EPISODE" ]] || { echo "Missing episode: $EPISODE" >&2; exit 1; }
if [[ -n "$CLOSING" ]]; then
  [[ -f "$CLOSING" ]] || { echo "Missing closing clip: $CLOSING" >&2; exit 1; }
fi
[[ -f "$EN_SRT" ]] || { echo "Missing English subtitles: $EN_SRT" >&2; exit 1; }
[[ -f "$LOGO" ]] || { echo "Missing Luva logo: $LOGO" >&2; exit 1; }
[[ -x "$FFMPEG" ]] || { echo "ffmpeg not found; set FFMPEG=/path/to/ffmpeg" >&2; exit 1; }

BRAND_FILTER=""
FFMPEG_INPUTS=(-i "$EPISODE")
NEXT_INPUT=1
CLOSING_FILTER="[titled]null[outv];[0:a]aresample=48000,aformat=sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[outa]"
if [[ -n "$CLOSING" ]]; then
  FFMPEG_INPUTS+=(-i "$CLOSING")
  NEXT_INPUT=2
  CLOSING_FILTER="[1:v]scale=480:854:flags=lanczos,fps=30,setsar=1,setpts=PTS-STARTPTS[closing];[titled][closing]concat=n=2:v=1:a=0[outv];[0:a]aresample=48000,aformat=sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a0];[1:a]aresample=48000,aformat=sample_rates=48000:channel_layouts=stereo,asetpts=PTS-STARTPTS[a1];[a0][a1]concat=n=2:v=0:a=1[outa]"
fi
LOGO_INDEX="$NEXT_INPUT"
FFMPEG_INPUTS+=(-loop 1 -framerate 30 -i "$LOGO")
NEXT_INPUT=$((NEXT_INPUT + 1))
LOGO_FILTER="[${LOGO_INDEX}:v]scale=56:-1,fps=30[logo];"
TITLE_FILTER="[episode][logo]overlay=x=W-w-16:y=16:shortest=1[titled];"
if [[ -n "$TAGLINE" ]]; then
  case "$BRAND_STYLE" in
    bar)
      BRAND_FILTER="[episode]drawbox=x=0:y=0:w=iw:h=42:color=black@0.78:t=fill[brandbg];[brandbg]drawtext=fontfile='/System/Library/Fonts/Supplemental/Arial Bold.ttf':text='$TAGLINE':fontcolor=white:fontsize=16:x=16:y=12:shadowcolor=black@0.35:shadowx=1:shadowy=1[branded];"
      TITLE_FILTER="[branded][logo]overlay=x=W-w-16:y=9:shortest=1[titled];"
      ;;
    floating)
      python3 "$HERE/make_brand_overlay.py" --tagline "$TAGLINE" --logo "$LOGO" --output "$BRAND_OVERLAY"
      LOGO_FILTER=""
      TITLE_FILTER="[episode][${NEXT_INPUT}:v]overlay=x=0:y=0:shortest=1[titled];"
      ;;
    *) echo "Unknown BRAND_STYLE: $BRAND_STYLE (use floating or bar)" >&2; exit 1 ;;
  esac
fi

if [[ -n "$TAGLINE" && "$BRAND_STYLE" == floating ]]; then
  BRAND_INDEX="$NEXT_INPUT"
  FFMPEG_INPUTS+=(-loop 1 -framerate 30 -i "$BRAND_OVERLAY")
  TITLE_FILTER="[episode][${BRAND_INDEX}:v]overlay=x=0:y=0:shortest=1[titled];"
fi

"$FFMPEG" -hide_banner -loglevel warning -y \
  "${FFMPEG_INPUTS[@]}" \
  -filter_complex \
  "[0:v]scale=480:854:flags=lanczos,fps=30,setsar=1,setpts=PTS-STARTPTS,subtitles=filename='$EN_SRT':force_style='FontName=Arial,FontSize=17,Bold=0,PrimaryColour=&H00FFFFFF,AlphaLevel=0,OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=0,MarginL=48,MarginR=48,MarginV=90,Alignment=2'[episode];\
   $LOGO_FILTER\
   $BRAND_FILTER\
   $TITLE_FILTER\
   $CLOSING_FILTER" \
  -map '[outv]' -map '[outa]' -c:v libx264 -preset medium -crf 20 \
  -c:a aac -b:a 128k -movflags +faststart "$OUTPUT"

printf 'Created %s\n' "$OUTPUT"
