#!/usr/bin/env bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd $SCRIPT_DIR

start_from=${1:-0}
end_at=${2:-0}

tmpdir=`basename $(mktemp -d -u)`
mkdir "$tmpdir"
trap "rm -rf $tmpdir" EXIT

mintery="$tmpdir/mintery"

n=0
function step {
    n=$(( n + 1 ))
    [ $start_from -gt $n ] && return
    [[ $end_at -ne 0 && $end_at -lt $n ]] && return

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
    elif [ "${DRY_RUN:-false}" == "true" ]; then
        echo "(dry run): ${@:2}"
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

function cp_bak {
    # copies $1 to $2, but with preserving (if existing) $2 under $2.bak<n>,
    # where <n> equals the number of existing $2 bak files
    #
    # special case: if $1 -eq '' then this behaves as a "touch_bak"

    [ -f "$2" ] && {
        bakFilePath="$2.bak"
        bakPath=`dirname "$bakFilePath"`
        bakFileName=`basename "$bakFilePath"`
        [ "${bakFileName::1}" != '.' ] && bakFileName=".$bakFileName"
        bakCount=`ls -w 1 -a "$bakPath" | grep --extended-regexp "^$bakFileName[0-9]+$" | wc -l`
        mv -v "$2" "$bakPath/$bakFileName$bakCount"
    }

    if [ "$1" == '' ]; then
        touch "$2"
    else
        cp "$1" "$2"
    fi
}

function run_mintery {
    git clone https://github.com/tzConnectBerlin/mintery.git "$tmpdir/mintery" || exit 1
    export NODE_URL="`take_env NODE_URL global.env`"

    if [[ "`take_env NETWORK global.env`" == "mainnet" ]]; then
        replace_env ORIGINATOR_ADDRESS "`take_env MINTER_TZ_ADDRESS global.env`" "$tmpdir/mintery/env" || exit 1
        replace_env ORIGINATOR_PUB_KEY "`take_env ADMIN_PUB_KEY global.env`" "$tmpdir/mintery/env" || exit 1
        replace_env ORIGINATOR_PRIV_KEY "`take_env ADMIN_PRIVATE_KEY global.env`" "$tmpdir/mintery/env" || exit 1
    else
        # testnet deployment. create a tez loaded address w/ faucet
        "$tmpdir"/mintery/script/initialize-address || exit 1

        replace_env MINTER_TZ_ADDRESS "`take_env ORIGINATOR_ADDRESS \"$mintery/env\"`" global.env || exit 1
        replace_env ADMIN_PUB_KEY "`take_env ORIGINATOR_PUB_KEY \"$mintery/env\"`" global.env || exit 1
        replace_env ADMIN_PRIVATE_KEY "`take_env ORIGINATOR_PRIV_KEY \"$mintery/env\"`" global.env || exit 1
    fi

    replace_env CONTRACT fa2 "$tmpdir/mintery/env" || exit 1
    replace_env BURN_CAP 0.87725 "$tmpdir/mintery/env" || exit 1
    "$tmpdir"/mintery/script/deploy-contract || exit 1
    replace_env CONTRACT_ADDRESS "`take_env CONTRACT_ADDRESS \"$mintery/env\"`" global.env || exit 1


    paypoint_recv="`take_env PAYPOINT_RECEIVER_ADDRESS global.env`"
    if [[ "$paypoint_recv" == '' ]]; then
        echo "Defaulting paypoint recv to the administrator address of the deployed FA2 contract"
        paypoint_recv="`take_env ORIGINATOR_ADDRESS \"$mintery/env\"`"
    fi
    replace_env PAYPOINT_RECEIVER_ADDRESS "$paypoint_recv" "$tmpdir/mintery/env" || exit 1

    replace_env CONTRACT paypoint "$tmpdir/mintery/env" || exit 1
    replace_env BURN_CAP 0.10325 "$tmpdir/mintery/env" || exit 1
    "$tmpdir"/mintery/script/deploy-contract || exit 1
    replace_env PAYPOINT_ADDRESS "`take_env CONTRACT_ADDRESS \"$mintery/env\"`" global.env
}

function create_random_secrets {
    replace_env JWT_SECRET_ADMIN "`tr -dc A-Za-z0-9 </dev/urandom | head -c 60 ; echo ''`" global.env || exit 1
    replace_env JWT_SECRET_STORE "`tr -dc A-Za-z0-9 </dev/urandom | head -c 60 ; echo ''`" global.env
    replace_env API_KEY_SECRET "`tr -dc A-Za-z0-9 </dev/urandom | head -c 40 ; echo ''`" global.env
}

function setup_admin_api {
    cp_bak '' admin-api-server/.env || exit 1

    replace_env JWT_EXPIRATION_TIME "`take_env JWT_EXPIRATION_TIME global.env`" admin-api-server/.env || exit 1
    replace_env JWT_SECRET "`take_env JWT_SECRET_ADMIN global.env`" admin-api-server/.env || exit 1

    replace_env AWS_S3_BUCKET "`take_env AWS_S3_BUCKET_ADMIN global.env`" admin-api-server/.env || exit 1
    replace_env AWS_S3_ACCESS_KEY "`take_env AWS_S3_ACCESS_KEY global.env`" admin-api-server/.env || exit 1
    replace_env AWS_S3_KEY_SECRET "`take_env AWS_S3_KEY_SECRET global.env`" admin-api-server/.env || exit 1

    replace_env STORE_API "`take_env STORE_API_URL global.env`" admin-api-server/.env || exit 1
    replace_env ADMIN_PRIVATE_KEY "`take_env ADMIN_PRIVATE_KEY global.env`" admin-api-server/.env

    replace_env BEHIND_PROXY "`take_env BEHIND_PROXY_ADMIN global.env`" admin-api-server/.env
}

function setup_store_api {
    cp_bak '' store-api-server/.env || exit 1

    replace_env JWT_EXPIRATION_TIME "`take_env JWT_EXPIRATION_TIME global.env`" store-api-server/.env || exit 1
    replace_env JWT_SECRET "`take_env JWT_SECRET_STORE global.env`" store-api-server/.env || exit 1

    replace_env AWS_S3_BUCKET "`take_env AWS_S3_BUCKET_STORE global.env`" store-api-server/.env || exit 1
    replace_env AWS_S3_ACCESS_KEY "`take_env AWS_S3_ACCESS_KEY global.env`" store-api-server/.env || exit 1
    replace_env AWS_S3_KEY_SECRET "`take_env AWS_S3_KEY_SECRET global.env`" store-api-server/.env || exit 1

    replace_env STRIPE_SECRET "`take_env STRIPE_SECRET global.env`" store-api-server/.env || exit 1
    replace_env STRIPE_WEBHOOK_SECRET "`take_env STRIPE_WEBHOOK_SECRET global.env`" store-api-server/.env || exit 1

    replace_env PINATA_API_KEY  "`take_env PINATA_API_KEY global.env`" store-api-server/.env || exit 1
    replace_env PINATA_API_SECRET  "`take_env PINATA_API_SECRET global.env`" store-api-server/.env || exit 1

    replace_env CART_EXPIRATION_MILLI_SECS  "`take_env CART_EXPIRATION_MILLI_SECS global.env`" store-api-server/.env || exit 1
    replace_env ORDER_EXPIRATION_MILLI_SECS  "`take_env ORDER_EXPIRATION_MILLI_SECS global.env`" store-api-server/.env || exit 1

    replace_env MINTER_TZ_ADDRESS  "`take_env MINTER_TZ_ADDRESS global.env`" store-api-server/.env || exit 1
    replace_env ADMIN_PUBLIC_KEY  "`take_env ADMIN_PUB_KEY global.env`" store-api-server/.env || exit 1

    replace_env BEHIND_PROXY "`take_env BEHIND_PROXY_STORE global.env`" store-api-server/.env || exit 1

    replace_env PROFILE_PICTURES_ENABLED "`take_env PROFILE_PICTURES_ENABLED global.env`" store-api-server/.env || exit 1

    replace_env KANVAS_CONTRACT "`take_env CONTRACT_ADDRESS global.env`" store-api-server/.env || exit 1
    replace_env TEZOS_NETWORK "`take_env NETWORK global.env`" store-api-server/.env || exit 1

    replace_env CACHE_TTL "`take_env CACHE_TTL global.env`" store-api-server/.env || exit 1
    replace_env CART_MAX_ITEMS "`take_env CART_MAX_ITEMS global.env`" store-api-server/.env || exit 1

    replace_env API_KEY_SECRET "`take_env API_KEY_SECRET global.env`" store-api-server/.env || exit 1

    replace_env WERT_PRIV_KEY "`take_env WERT_PRIV_KEY global.env`" store-api-server/.env || exit 1

    replace_env TEZPAY_PAYPOINT_ADDRESS "`take_env PAYPOINT_ADDRESS global.env`" store-api-server/.env
}

function setup_store_front {
    cp_bak '' store-front/.env || exit 1

    replace_env REACT_APP_API_SERVER_BASE_URL  "`take_env STORE_API_URL global.env`" store-front/.env || exit 1
    replace_env REACT_APP_STRIPE_PK_KEY  "`take_env STRIPE_PUB_KEY global.env`" store-front/.env

    replace_env PROFILE_PICTURES_ENABLED "`take_env PROFILE_PICTURES_ENABLED global.env`" store-api-server/.env
}

function setup_admin_front {
    cp_bak '' admin-front/.env || exit 1

    replace_env REACT_APP_API_SERVER_BASE_URL  "`take_env ADMIN_API_URL global.env`" admin-front/.env || exit 1
    replace_env REACT_APP_STORE_BASE_URL  "`take_env STORE_FRONT_URL global.env`" admin-front/.env
}

function setup_que_pasa {
    cp_bak '' config/kanvas.yaml
    cp_bak '' config/.env-kanvas

    cat <<EOF > config/kanvas.yaml
contracts:
- name: "onchain_kanvas"
  address: "`take_env CONTRACT_ADDRESS global.env | sed 's/\"//g'`"
- name: "paypoint"
  address: "`take_env PAYPOINT_ADDRESS global.env | sed 's/\"//g'`"
EOF
    cat <<EOF > config/.env-kanvas
NODE_URL=`take_env NODE_URL global.env`
BCD_NETWORK=`take_env NETWORK global.env`
EOF
}

function setup_peppermint {
    cp_bak '' config/peppermint.json
    cat <<EOF > config/peppermint.json
{
    "batchSize": 110,
    "confirmations": 2,
    "timeout": 300,
    "privateKey": "`take_env ADMIN_PRIVATE_KEY global.env | sed 's/\"//g'`",
    "rpcUrl": "`take_env NODE_URL global.env | sed 's/\"//g'`",
    "pollingDelay": 1000,
    "dbConnection": {
            "user": "store_pguser",
            "password": "store_pgpass",
            "host": "store-db",
            "port": 5432,
            "database": "dev_database"
    },
    "handlers": {
        "nft": {
            "handler": "MultiassetHandler",
            "args": {
                "contract_address": "`take_env CONTRACT_ADDRESS global.env | sed 's/\"//g'`"
            }
        }
    }
}
EOF
}

function setup_nginx {
    sudo mv /etc/nginx/nginx.conf "/etc/nginx/nginx.conf.bak`ls -w 1 /etc/nginx | grep nginx.conf | wc -l`"

    export nginx_conf=$(cat <<EOF
user  nginx;
worker_processes  auto;

error_log  /var/log/nginx/error.log notice;
pid        /var/run/nginx.pid;


events {
    worker_connections  1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    log_format  main  '\$remote_addr - \$remote_user [\$time_local] "\$request" '
                      '\$status \$body_bytes_sent "\$http_referer" '
                      '"\$http_user_agent" "\$http_x_forwarded_for"';

    access_log  /var/log/nginx/access.log  main;

    sendfile        on;
    #tcp_nopush     on;

    keepalive_timeout  65;

    #gzip  on;

    include /etc/nginx/conf.d/*.conf;

    map \$http_upgrade \$connection_upgrade {
        default upgrade;
        '' close;
    }

    server {
        server_name `take_env STORE_FRONT_URL global.env | sed -E 's/^https?:\/\///'`;

        location / {
            proxy_pass http://localhost:3000/;

            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection \$connection_upgrade;
            proxy_set_header Host \$host;
        }
        location /api/ {
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization,Origin,User-Agent,Content-Type' always;
            add_header 'Access-Control-Allow-Methods' 'GET,POST,OPTIONS,PUT,DELETE,PATCH' always;
            add_header 'Cache-Control' 'no-cache,max-age=86400';

            add_header 'Access-Control-Allow-Origin' '`take_env ADMIN_FRONT_URL global.env`';
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';

            proxy_pass http://localhost:3005/;

            proxy_cookie_flags express:sess secure samesite=none;
            proxy_cookie_flags express:sess.sig secure samesite=none;

            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection \$connection_upgrade;
            proxy_set_header Host \$host;
        }
    }

    server {
        server_name `take_env ADMIN_FRONT_URL global.env | sed -E 's/^https?:\/\///'`;
        client_max_body_size 100M;

        location / {
            proxy_pass http://localhost:5000/;

            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection \$connection_upgrade;
            proxy_set_header Host \$host;
        }
        location /api/ {
            add_header 'Access-Control-Allow-Credentials' 'true' always;
            add_header 'Access-Control-Allow-Headers' 'Authorization,Origin,User-Agent,Content-Type' always;
            add_header 'Access-Control-Allow-Methods' 'GET,POST,OPTIONS,PUT,DELETE,PATCH' always;
            add_header 'Cache-Control' 'no-cache,max-age=86400';

            proxy_pass http://localhost:3006/;

            proxy_cookie_flags express:sess secure samesite=none;
            proxy_cookie_flags express:sess.sig secure samesite=none;

            proxy_set_header X-Real-IP \$remote_addr;
            proxy_set_header Upgrade \$http_upgrade;
            proxy_set_header Connection \$connection_upgrade;
            proxy_set_header Host \$host;
        }
    }
}
EOF
)
    sudo --preserve-env=nginx_conf bash -c 'echo "$nginx_conf" > /etc/nginx/nginx.conf' || exit 1
    sudo certbot --nginx || exit 1

    sudo nginx -s reload
}

step \
    'Creating a fresh global.env file (note: if one already existed it will be backed up under a .bak extension)' \
    cp_bak global.env.example global.env || exit 1

step \
    'Setting up nested git repositories' \
    git submodule update --init || exit 1

step \
    'In global.env:
- set STORE_API_URL (exact URL to the API, eg https://kanvas.tzconnect.berlin/api
- set STORE_FRONT_URL
- set ADMIN_API_URL
- set ADMIN_FRONT_URL
- is the store api behind a proxy (eg nginx)? set BEHIND_PROXY_STORE to: yes
- is the admin api behind a proxy (eg nginx)? set BEHIND_PROXY_ADMIN to: yes
- have a look at all other parameters in the "tweakable parameters" section' || exit 1

step "$(cat <<EOF
AWS S3 (https://s3.console.aws.amazon.com/s3/buckets):

create 2 new buckets called something like:
- 'kanvas-...-store',
- and "kanvas-...-admin'
(replacing '...' with some name relevant to this setup)

NOTE: must set following options upon creation of each bucket:
- ACLs enabled  (in "Object Ownership" section)
- unset all in "Block Public Access settings for this bucket"
(the rest of the options' defaults are fine)
EOF
)" || exit 1

step 'Set in global.env AWS_S3_BUCKET_STORE and AWS_S3_BUCKET_ADMIN to what the buckets have been named in the previous step' || exit 1

step \
    'Set AWS_S3_ACCESS_KEY and AWS_S3_KEY_SECRET in global.env, these are related to your AWS account. Please find the correct values on their website (https://us-east-1.console.aws.amazon.com/iam/home#/security_credentials).' || exit 1

step \
    'If Stripe enabled,  (https://dashboard.stripe.com/test/dashboard):

- find "Publishable key", copy this into STRIPE_PUB_KEY in global.env
- find "Secret key", copy this into STRIPE_SECRET in global.env'

step \
    "If Stripe enabled, (https://dashboard.stripe.com/test/webhooks):

add a new endpoint for a new webhook:
1. set the endpoint url to: `take_env STORE_API_URL global.env`/payment/stripe-webhook
2. under 'Select events' select all 'payment intent' events
3. Add endpoint (click the button)
4. Under the new webhook page, reveal the 'Signing secret', copy this value into STRIPE_WEBHOOK_SECRET in global.env"

step \
    'If Wert enabled, set WERT_PRIV_KEY'

step \
    'Pinata (https://app.pinata.cloud/keys):
1. add a new key with at least the following permissions (listed under "Pinning"):
    - pinFileToIPFS
    - pinJSONToIPFS
2. save the API secret in global.env under PINATA_API_SECRET
3. save the API key in global.env under PINATA_API_KEY'

step \
    'Set TEZOS_NETWORK and NODE_URL.

Optionally, set PAYPOINT_RECEIVER_ADDRESS if this should be something different than MINTER_TZ_ADDRESS (and note: MINTER_TZ_ADDRESS is autogenerated if deploying on a testnet).

If deploying on mainnet (TEZOS_NETWORK=mainnet), also set:
- MINTER_TZ_ADDRESS
- ADMIN_PUB_KEY
- ADMIN_PRIVATE_KEY'

step \
    'Creating a testnet wallet loaded with tez, and deploying the FA2 contract...' \
    run_mintery || exit 1

step \
    'Creating secrets (for JWT, etc.)' \
    create_random_secrets || exit 1

step \
    'Setting up admin-api-server/.env with values set in global.env' \
    setup_admin_api || exit 1

step \
    'Setting up store-api-server/.env with values set in global.env' \
    setup_store_api || exit 1

step \
    'Setting up store-front/.env with values set in global.env' \
    setup_store_front || exit 1

step \
    'Setting up admin-front/.env with values set in global.env' \
    setup_admin_front || exit 1

step \
    'Setting up Que Pasa config' \
    setup_que_pasa || exit 1

step \
    'Setting up Peppermint config' \
    setup_peppermint || exit 1

step \
    'Building docker images' \
    docker-compose build || exit 1

step \
    'If running with nginx, continue. otherwise quit here.'

step \
    'Setting up the nginx config (this will append to the existing nginx config file)

Note: Certbot will prompt for your information to setup SSL' \
    setup_nginx || exit 1

step \
    'ALL DONE

execute "./run-deployment.bash" to start kanvas' \
    :
