#!/bin/bash


function convert_mp4 {
    OUTPUT=`echo "$1" | cut -f 1 -d '.'`

    echo creating $OUTPUT-display.png..
    ffmpeg -y -i "$1" -ss 0:30 -vframes 1 "$OUTPUT-display.png" >/dev/null 2>&1
    if [ ! -f "$OUTPUT-display.png" ]; then
        ffmpeg -y -i "$1" -ss 0:15 -vframes 1 "$OUTPUT-display.png" >/dev/null 2>&1
    fi
    echo creating $OUTPUT-thumbnail.png..
    convert "$OUTPUT-display.png" -resize 200 "$OUTPUT-thumbnail.png" >/dev/null 2>&1 || exit 1

    echo creating $OUTPUT.gif..
    ffmpeg -y -t 3 -i "$1" -vf "fps=5,scale=400:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 "$OUTPUT.gif" >/dev/null 2>&1 || exit 1

    echo creating $OUTPUT-artifact.mp4..
    ffmpeg -i "$1" -vcodec libx264 -acodec aac "$OUTPUT-artifact.mp4" >/dev/null 2>&1
}

(
    cd survival
    for i in *.mp4; do
        echo "$i" | grep --quiet '\-artifact.mp4' && continue

        echo "survival/$i.."
        convert_mp4 "$i" </dev/null
    done
) &

(
    cd interpolation
    for i in *.mp4; do
        echo "$i" | grep --quiet '\-artifact.mp4' && continue

        echo "interpolation/$i.."
        convert_mp4 "$i" </dev/null
    done
) &

wait
