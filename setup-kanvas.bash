#!/usr/bin/env bash

start_from=${1:-0}

tmpdir=`mktemp --directory`
mintery="$tmpdir/mintery"

n=0
function step {
    n=$(( n + 1 ))
    [ $start_from -gt $n ] && return

    if [ $n -gt 1 ]; then
        echo
    fi

    echo "########################
### step $n
###

$1
"
    if [ "$#" -eq "1" ]; then
        echo "this is a manual step. press any key when ready to continue or ^C to quit"
        read -s -n 1
    else
        ${@:2}
    fi
}

function replace_env {
    # replaces var $1 with val $2 in $3 env file (or current dir's .env if not set)

    set -u

    var=$1
    val=$2
    envfile=${3:-'.env'}

    if grep "^$var=" "$envfile" >/dev/null ; then
        sed -i'.bak' "s/^$var=.*$/$var=$val/" "$envfile"
        rm "$envfile".bak
    else
        echo "$var=$val" >> "$envfile"
    fi
}

function take_env {
    # returns value of var $1 in $3 env file (or current directory's .env if not set)

    envfile=${2:-'.env'}
    cat "$envfile" | grep --regexp "^$1=" | awk -F'=' '{print $2}'
}

function init_global_env {
    read -s -n 1
    cp global.env.example global.env
}

function run_mintery {
    git clone https://github.com/tzConnectBerlin/mintery.git "$tmpdir/mintery" || exit 1
    "$tmpdir"/mintery/script/setup || exit 1

    replace_env MINTER_TZ_ADDRESS `take_env ORIGINATOR_ADDRESS "$mintery/.env"` global.env || exit 1
    replace_env ADMIN_PUB_KEY `take_env ORIGINATOR_PUB_KEY "$mintery/.env"` global.env || exit 1
    replace_env ADMIN_PRIVATE_KEY `take_env ORIGINATOR_PRIV_KEY "$mintery/.env"` global.env || exit 1
    replace_env CONTRACT_ADDRESS `take_env CONTRACT_ADDRESS "$mintery/.env"` global.env
}

function create_random_secrets {
    replace_env JWT_SECRET_ADMIN `tr -dc A-Za-z0-9 </dev/urandom | head -c 60 ; echo ''` global.env || exit 1
    replace_env JWT_SECRET_STORE `tr -dc A-Za-z0-9 </dev/urandom | head -c 60 ; echo ''` global.env
}

function populate_admin_api_env {
    cp admin-api-server/env.example admin-api-server/.env || exit 1

    replace_env JWT_EXPIRATION_TIME `take_env JWT_EXPIRATION_TIME global.env` admin-api-server/.env || exit 1
    replace_env JWT_SECRET `take_env JWT_SECRET_ADMIN global.env` admin-api-server/.env || exit 1

    replace_env AWS_S3_BUCKET `take_env AWS_S3_BUCKET_ADMIN global.env` admin-api-server/.env || exit 1
    replace_env AWS_S3_ACCESS_KEY `take_env AWS_S3_ACCESS_KEY global.env` admin-api-server/.env || exit 1
    replace_env AWS_S3_KEY_SECRET `take_env AWS_S3_KEY_SECRET global.env` admin-api-server/.env || exit 1

    replace_env STORE_API `take_env STORE_API_URL global.env` admin-api-server/.env || exit 1
    replace_env ADMIN_PRIVATE_KEY `take_env ADMIN_PRIVATE_KEY global.env` admin-api-server/.env
}

step \
    'This will overwrite any existing global.env file, are you sure? (any key to continue, ^C to quit)' \
    init_global_env || exit 1

step \
    'In global.env:
- set STORE_API_URL (exact URL to the API, eg https://kanvas.tzconnect.berlin/api
- is the store api behind a proxy (eg nginx)? set BEHIND_PROXY_STORE to: yes
- is the admin api behind a proxy (eg nginx)? set BEHIND_PROXY_ADMIN to: yes' || exit 1

step "$(cat <<EOF
AWS S3 (https://s3.console.aws.amazon.com/s3/buckets):

create 2 new buckets called something like:
- 'kanvas-...-store',
- and "kanvas-...-admin'
(replacing '...' with some name relevant to this setup)

NOTE: must set following options upon creation of each bucket:
- ACLs enabled  (in "Object Ownership" section)
- unset all in "Block Public Access settings for this bucket"
EOF
)" || exit 1

step 'Set in global.env AWS_S3_BUCKET_STORE and AWS_S3_BUCKET_ADMIN to what the buckets have been named in the previous step' || exit 1

step \
    'Set AWS_S3_ACCESS_KEY and AWS_S3_KEY_SECRET in global.env, these are related to your AWS account. Please find the correct values on their website.' || exit 1

step \
    'Stripe (https://dashboard.stripe.com/test/dashboard):

- find "Publishable key", copy this into STRIPE_PUB_KEY in global.env
- find "Secret key", copy this into STRIPE_SECRET in global.env'

step \
    "Stripe (https://dashboard.stripe.com/test/webhooks):

add a new endpoint for a new webhook:
1. set the endpoint url to: `take_env STORE_API_URL global.env`/payment/stripe-webhook
2. select 'payment intent' events
3. Add endpoint (click the button)
4. Under the new webhook page, reveal the 'Signing secret', copy this value into STRIPE_WEBHOOK_SECRET in global.env"

step \
    'Creating a testnet wallet loaded with tez, and deploying the FA2 contract...' \
    run_mintery || exit 1

step \
    'Creating secrets (for JWT, etc.)' \
    create_random_secrets || exit 1

step \
    'Populating admin-api-server/.env with values set in global.env' \
    populate_admin_api_env || exit 1

exit

step store-api: set MINTER_TZ_ADDRESS in .env to mintery/.env\'s ORIGINATOR_ADDRESS
step store-api: set ADMIN_PUBLIC_KEY in .env to mintery/.env\'s ORIGINATOR_PUB_KEY
step Stripe: create a new test environment in '(in their website)'
step store-api: set STRIPE_WEBHOOK_SECRET in .env accordingly '(taking the webhook secret of the newly created stripe environment)'
step "$(cat <<EOF
AWS S3 (https://s3.console.aws.amazon.com/s3/buckets?region=us-east-1):

create 2 new buckets called something like:
- 'kanvas-...-store'
- and "kanvas-...-admin'
(replacing '...' with some name relevant to this setup).

NOTE: must set following options upon creation of each bucket:
- ACLs enabled  (in "Object Ownership" section)
- unset all in "Block Public Access settings for this bucket"
EOF
)"
step store-api: set AWS_S3_BUCKET in .env to the store bucket created before
step admin-api: set AWS_S3_BUCKET in .env to the admin bucket created before
step admin-api: set ADMIN_PRIVATE_KEY in .env to mintery/.env\'s ORIGINATOR_PRIV_KEY
step admin-front: correct the URLs in .env
step store-front: correct the API BASE URL in .env
step peppermint: set '"privateKey"' in config.json to mintery/.env\'s ORIGINATOR_PRIV_KEY
step peppermint: set '"nftContract"' in config.json to mintery/.env\'s CONTRACT_ADDRESS
step peppermint: ensure '"rpcUrl"' in config.json is set correctly '(node for correct network, ie same network that mintery is set-up for)'
step que_pasa: ensure the same correct URL is in kanvas/docker-compose.yml NODE_URL, and ensure BCD_NETWORK is set to the correct network '(NOTE: THEY OCCUR TWICE EACH, once for the admin-quepasa and once for the store-quepasa)'
step que_pasa: set address in kanvas/config/kanvas.yaml to mintery/.env\'s CONTRACT_ADDRESS
step in kanvas: '`docker-compose down; docker-compose build`'
step in kanvas: '`./deploy-scripts/install/setup-admin-front.bash`'
step in kanvas: '`./deploy-scripts/install/setup-store-front.bash`'
step in kanvas '(under screen window "backend")': '`./run-backend.bash`'
step in kanvas '(under screen window "store-front")': '`./deploy-scripts/run/store-front.bash`'
step in kanvas '(under screen window "admin-front")': '`./deploy-scripts/run/admin-front.bash`'
step nginx: correct URLs in the nginx.conf, and remove all sections/lines managed by certbot
step nginx: execute '`certbot --nginx`', generate certificates for all URLs '(simply hit enter)'

echo "DONE"
