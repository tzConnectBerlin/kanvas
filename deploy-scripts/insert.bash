#!/usr/bin/env bash


start_from=${1:-1}
end_after=${2:-0}
aws_bucket=kanvas-sv-staging-nfts
kanvas_api=sv.staging.tzconnect.berlin/api


cd interpolation
for nft in `ls | grep '.gif' | awk -F'.' '{print $1}'`; do
    echo "nft: '$nft'"

    nft_id=$(( nft_id + 1 ))
    [ $nft_id -lt $start_from ] && continue
    [[ $end_after -ne 0 && $nft_id -gt $end_after ]] && exit

    body=$(cat <<EOF
{
    "id": $nft_id,
    "name": "$nft",
    "description": "$nft (pending long description)",

    "artifactUri": "https://$aws_bucket.s3.eu-central-1.amazonaws.com/$nft-artifact.mp4",
    "displayUri": "https://$aws_bucket.s3.eu-central-1.amazonaws.com/$nft-display.png",
    "thumbnailUri": "https://$aws_bucket.s3.eu-central-1.amazonaws.com/$nft-thumbnail.png",

    "price": 20000,
    "categories": [2],
    "editionsSize": 10,

    "metadata": {
        "gif": "https://$aws_bucket.s3.eu-central-1.amazonaws.com/$nft.gif",
        "original": "https://$aws_bucket.s3.eu-central-1.amazonaws.com/$nft.mp4",
        "artifactMimetype": "video/mp4"
    },

    "signature": "`tr -dc A-Za-z0-9 </dev/urandom | head -c 60 ; echo ''`",
    "secret": "redacted"
}
EOF
)

    echo "definition: $body"
    http --check-status POST https://$kanvas_api/nfts/create <<< "$body" || exit 1
done
cd ..


cd survival
for nft in `ls | grep '.gif' | awk -F'.' '{print $1}'`; do
    echo "nft: '$nft'"

    nft_id=$(( nft_id + 1 ))
    [ $nft_id -lt $start_from ] && continue
    [[ $end_after -ne 0 && $nft_id -gt $end_after ]] && exit

    body=$(cat <<EOF
{
    "id": $nft_id,
    "name": "$nft",
    "description": "$nft (pending long description)",

    "artifactUri": "https://$aws_bucket.s3.eu-central-1.amazonaws.com/$nft-artifact.mp4",
    "displayUri": "https://$aws_bucket.s3.eu-central-1.amazonaws.com/$nft-display.png",
    "thumbnailUri": "https://$aws_bucket.s3.eu-central-1.amazonaws.com/$nft-thumbnail.png",

    "price": 20000,
    "categories": [2],
    "editionsSize": 1,

    "metadata": {
        "gif": "https://$aws_bucket.s3.eu-central-1.amazonaws.com/$nft.gif",
        "original": "https://$aws_bucket.s3.eu-central-1.amazonaws.com/$nft.mp4",
        "artifactMimetype": "video/mp4"
    },

    "signature": "`tr -dc A-Za-z0-9 </dev/urandom | head -c 60 ; echo ''`",
    "secret": "redacted"
}
EOF
)

    echo "definition: $body"
    http --check-status POST https://$kanvas_api/nfts/create <<< "$body" || exit 1
done
cd ..


cd 'ai-herbarium'
for nft in `ls | awk -F'.' '{print $1}'`; do
    echo "nft: '$nft'"

    nft_id=$(( nft_id + 1 ))
    [ $nft_id -lt $start_from ] && continue
    [[ $end_after -ne 0 && $nft_id -gt $end_after ]] && exit

    body=$(cat <<EOF
{
    "id": $nft_id,
    "name": "$nft",
    "description": "$nft (pending long description)",

    "artifactUri": "https://$aws_bucket.s3.eu-central-1.amazonaws.com/$nft.png",

    "metadata": {
        "artifactMimetype": "image/png"
    },

    "price": 5000,
    "categories": [3],
    "editionsSize": 1,

    "signature": "`tr -dc A-Za-z0-9 </dev/urandom | head -c 60 ; echo ''`",
    "secret": "redacted"
}
EOF
)

    echo "definition: $body"
    http --check-status POST https://$kanvas_api/nfts/create <<< "$body" || exit 1
done
