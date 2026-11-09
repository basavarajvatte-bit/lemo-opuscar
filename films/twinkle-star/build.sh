#!/bin/sh
# Rebuild "Twinkle Star" from scratch: sh films/twinkle-star/build.sh   (from any directory)
# Needs: the library's core tier + voice + music tiers (sh plugin/skills/lemo-opuscar/scripts/setup.sh deps voice music)
# and ffmpeg 7 or newer on PATH (put a static build first on PATH if the system one is older).
set -e
HERE=$(cd "$(dirname "$0")" && pwd)
LIB=${LIB:-$(cd "$HERE/../.." && pwd)}
export LIB
[ -f "$LIB/core/render/video.mjs" ] || { echo "set LIB to the library folder"; exit 1; }
cd "$LIB"
PY=.venv/bin/python; S=1080x1920
for f in PatrickHand-Regular.ttf:patrickhand Gaegu-Bold.ttf:gaegu; do n=${f%%:*}; d=${f##*:}
  [ -s "$HERE/fonts/$n" ] || curl -fsSL -o "$HERE/fonts/$n" "https://raw.githubusercontent.com/google/fonts/86aced91de05cd4f96a06838124cca45be337b2b/ofl/$d/$n"; done
$PY core/tts/tts.py "$HERE/lines.json" "$HERE/voices"                    # 1. Kokoro voice af_heart
$PY core/tts/asr_check.py "$HERE/lines.json" "$HERE/voices" || echo "! speech check skipped/failed (needs the Whisper model from huggingface.co)"
$PY "$HERE/prep.py"                                                      # 2. mouth envelope + word timings → timing.json
node core/render/events.mjs "$HERE" --size $S                            # 3. timeline → events.json
$PY "$HERE/mix.py"                                                       # 4. score + foley + voice → out/mix.wav
$PY core/render/srt.py "$HERE/subs.json" "$HERE/twinkle-star.srt"        # 5. subtitles
node core/render/video.mjs "$HERE" --fps 24 --workers 4 --size $S --out "$HERE/out/video.mp4"   # 6. frames
sh core/render/mux.sh "$HERE/out/video.mp4" "$HERE/out/mix.wav" "$HERE/twinkle-star.mp4" 24 0  # 7. mux, −14 LUFS, no extra grain
