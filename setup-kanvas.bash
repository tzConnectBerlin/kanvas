#!/usr/bin/env bash
SCRIPT_DIR=$( cd -- "$( dirname -- "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )
cd $SCRIPT_DIR

set -u -e

startFromStep=${1:-0}
endAfterStep=${2:-0}

tmpDir=`basename $(mktemp -d -u)`
mkdir $tmpDir
trap "rm -rf $tmpDir" EXIT

mintery=$tmpDir/mintery

n=0
function step {
    n=$(( n + 1 ))
    [ $startFromStep -gt $n ] && return
    [[ $endAfterStep -ne 0 && $endAfterStep -lt $n ]] && return

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

function replaceEnv {
    # replaces var $1 with val $2 in $3 env file (or current dir's .env if not set)

    var=$1
    val="${2//$'\n'/\\\n}"
    envFile=${3:-'.env'}

    cat <<EOF
,,
var: $var
val: $val
,,
EOF

    ln=`grep "^$var=" --line-number $envFile | awk -F':' '{print $1}'`
    echo "line number: $ln"

    echo 'before:'
    cat $envFile
    if [[ "$ln" != '' ]]; then
        if [ $ln -gt 1 ]; then
          beforeLn="`head -n $(( ln - 1 )) $envFile; echo .`"
          echo "${beforeLn%??}" >> $envFile.mod
        fi

        echo `echo "$var=$val"` >> $envFile.mod

        if [ $ln -lt `wc -l $envFile | awk '{print $1}'` ]; then
          afterLn="`tail -n +$(( ln + 1 )) $envFile; echo .`"
          echo "${afterLn%??}" >> $envFile.mod
        fi

        mv $envFile.mod $envFile
    else
        echo "$var=$val" >> $envFile
    fi
    echo 'after:'
    cat $envFile
}

function takeEnv {
    # returns value of var $1 in $2 env file (or current directory's .env if not set)

    envFile=${2:-'.env'}
    cat "$envFile" | grep --regexp "^$1=" | sed 's/^[^=]*=//'
}

function cpBak {
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

function deployOnchainContracts {
    git clone https://github.com/tzConnectBerlin/mintery.git $tmpDir/mintery
    export NODE_URL="`takeEnv NODE_URL global.env`"

    if [[ "`takeEnv NETWORK global.env`" == "mainnet" ]]; then
        replaceEnv ORIGINATOR_ADDRESS "`takeEnv MINTER_TZ_ADDRESS global.env`" $tmpDir/mintery/env
        replaceEnv ORIGINATOR_PUB_KEY "`takeEnv ADMIN_PUB_KEY global.env`" $tmpDir/mintery/env
        replaceEnv ORIGINATOR_PRIV_KEY "`takeEnv ADMIN_PRIVATE_KEY global.env`" $tmpDir/mintery/env
    else
        # testnet deployment. create a tez loaded address w/ faucet
        $tmpDir/mintery/script/initialize-address

        replaceEnv MINTER_TZ_ADDRESS "`takeEnv ORIGINATOR_ADDRESS \"$mintery/env\"`" global.env
        replaceEnv ADMIN_PUB_KEY "`takeEnv ORIGINATOR_PUB_KEY \"$mintery/env\"`" global.env
        replaceEnv ADMIN_PRIVATE_KEY "`takeEnv ORIGINATOR_PRIV_KEY \"$mintery/env\"`" global.env
    fi

    replaceEnv CONTRACT fa2 $tmpDir/mintery/env
    replaceEnv BURN_CAP 0.87725 $tmpDir/mintery/env
    $tmpDir/mintery/script/deploy-contract
    replaceEnv CONTRACT_ADDRESS "`takeEnv CONTRACT_ADDRESS \"$mintery/env\"`" global.env


    paypointRecv="`takeEnv PAYPOINT_RECEIVER_ADDRESS global.env`"
    echo "recv: '$paypointRecv'"
    if [[ "$paypointRecv" == '' ]]; then
        echo "Defaulting paypoint recv to the administrator address of the deployed FA2 contract"
        paypointRecv="`takeEnv ORIGINATOR_ADDRESS \"$mintery/env\"`"
    fi
    replaceEnv PAYPOINT_RECEIVER_ADDRESS "$paypointRecv" $tmpDir/mintery/env

    replaceEnv CONTRACT paypoint $tmpDir/mintery/env
    replaceEnv BURN_CAP 0.10325 $tmpDir/mintery/env
    $tmpDir/mintery/script/deploy-contract
    replaceEnv PAYPOINT_ADDRESS "`takeEnv CONTRACT_ADDRESS \"$mintery/env\"`" global.env
}

function genJwtKeyPair {
    mkdir $tmpDir/$1
    cd $tmpDir/$1

    ssh-keygen -t rsa -b 4096 -m PEM -f jwtRS256.key -P '' >/dev/null
    openssl rsa -in jwtRS256.key -pubout -outform PEM -out jwtRS256.key.pub >/dev/null

    cat <<EOF
{
    "priv": "`cat $PWD/jwtRS256.key | sed 's/$/\\\\n/g' | tr -d '\n'`",
    "pub": "`cat $PWD/jwtRS256.key.pub | sed 's/$/\\\\n/g' | tr -d '\n'`"
}
EOF
}

function createRandomSecrets {
    jwtAdmin="`genJwtKeyPair admin`"
    jwtStore="`genJwtKeyPair store`"

    targetEnv=global.env
    replaceEnv JWT_SECRET_ADMIN "\"`echo "$jwtAdmin" | jq -r '.priv'`\"" $targetEnv
    replaceEnv JWT_PUBLIC_KEY_ADMIN "\"`echo "$jwtAdmin" | jq -r '.pub'`\"" $targetEnv
    replaceEnv JWT_SECRET_STORE "\"`echo "$jwtStore" | jq -r '.priv'`\"" $targetEnv
    replaceEnv JWT_PUBLIC_KEY_STORE "\"`echo "$jwtStore" | jq -r '.pub'`\"" $targetEnv

    replaceEnv API_KEY_SECRET "`tr -dc A-Za-z0-9 </dev/urandom | head -c 40 ; echo ''`" $targetEnv
}

function setupAdminApi {
    targetEnv=admin-api-server/.env
    cpBak '' $targetEnv

    replaceEnv AWS_S3_BUCKET "`takeEnv AWS_S3_BUCKET_ADMIN global.env`" $targetEnv
    replaceEnv AWS_S3_ACCESS_KEY "`takeEnv AWS_S3_ACCESS_KEY global.env`" $targetEnv
    replaceEnv AWS_S3_KEY_SECRET "`takeEnv AWS_S3_KEY_SECRET global.env`" $targetEnv

    replaceEnv STORE_API "`takeEnv STORE_API_URL global.env`" $targetEnv
    replaceEnv ADMIN_PRIVATE_KEY "`takeEnv ADMIN_PRIVATE_KEY global.env`" $targetEnv

    replaceEnv BEHIND_PROXY "`takeEnv BEHIND_PROXY_ADMIN global.env`" $targetEnv

    replaceEnv JWT_EXPIRATION_TIME "`takeEnv JWT_EXPIRATION_TIME global.env`" $targetEnv
    replaceEnv JWT_SECRET "`takeEnv JWT_SECRET_ADMIN global.env`" $targetEnv
    replaceEnv JWT_PUBLIC_KEY "`takeEnv JWT_PUBLIC_KEY_ADMIN global.env`" $targetEnv
}

function setupStoreApi {
    targetEnv=store-api-server/.env
    cpBak '' $targetEnv

    replaceEnv JWT_EXPIRATION_TIME "`takeEnv JWT_EXPIRATION_TIME global.env`" $targetEnv
    replaceEnv JWT_SECRET "`takeEnv JWT_SECRET_STORE global.env`" $targetEnv
    replaceEnv JWT_PUBLIC_KEY "`takeEnv JWT_PUBLIC_KEY_STORE global.env`" $targetEnv

    replaceEnv AWS_S3_BUCKET "`takeEnv AWS_S3_BUCKET_STORE global.env`" $targetEnv
    replaceEnv AWS_S3_ACCESS_KEY "`takeEnv AWS_S3_ACCESS_KEY global.env`" $targetEnv
    replaceEnv AWS_S3_KEY_SECRET "`takeEnv AWS_S3_KEY_SECRET global.env`" $targetEnv

    replaceEnv STRIPE_SECRET "`takeEnv STRIPE_SECRET global.env`" $targetEnv
    replaceEnv STRIPE_WEBHOOK_SECRET "`takeEnv STRIPE_WEBHOOK_SECRET global.env`" $targetEnv

    replaceEnv PINATA_API_KEY  "`takeEnv PINATA_API_KEY global.env`" $targetEnv
    replaceEnv PINATA_API_SECRET  "`takeEnv PINATA_API_SECRET global.env`" $targetEnv

    replaceEnv CART_EXPIRATION_MILLI_SECS  "`takeEnv CART_EXPIRATION_MILLI_SECS global.env`" $targetEnv
    replaceEnv ORDER_EXPIRATION_MILLI_SECS  "`takeEnv ORDER_EXPIRATION_MILLI_SECS global.env`" $targetEnv

    replaceEnv MINTER_TZ_ADDRESS  "`takeEnv MINTER_TZ_ADDRESS global.env`" $targetEnv
    replaceEnv ADMIN_PUBLIC_KEY  "`takeEnv ADMIN_PUB_KEY global.env`" $targetEnv

    replaceEnv BEHIND_PROXY "`takeEnv BEHIND_PROXY_STORE global.env`" $targetEnv

    replaceEnv PROFILE_PICTURES_ENABLED "`takeEnv PROFILE_PICTURES_ENABLED global.env`" $targetEnv

    replaceEnv KANVAS_CONTRACT "`takeEnv CONTRACT_ADDRESS global.env`" $targetEnv
    replaceEnv TEZOS_NETWORK "`takeEnv NETWORK global.env`" $targetEnv

    replaceEnv CACHE_TTL "`takeEnv CACHE_TTL global.env`" $targetEnv
    replaceEnv CART_MAX_ITEMS "`takeEnv CART_MAX_ITEMS global.env`" $targetEnv

    replaceEnv API_KEY_SECRET "`takeEnv API_KEY_SECRET global.env`" $targetEnv

    replaceEnv WERT_PRIV_KEY "`takeEnv WERT_PRIV_KEY global.env`" $targetEnv

    replaceEnv TEZPAY_PAYPOINT_ADDRESS "`takeEnv PAYPOINT_ADDRESS global.env`" $targetEnv
}

function setupStoreFront {
    targetEnv=store-front/.env
    cpBak '' $targetEnv

    replaceEnv REACT_APP_API_SERVER_BASE_URL  "`takeEnv STORE_API_URL global.env`" $targetEnv
    replaceEnv REACT_APP_STRIPE_PK_KEY  "`takeEnv STRIPE_PUB_KEY global.env`" $targetEnv
}

function setupAdminFront {
    targetEnv=admin-front/.env
    cpBak '' $targetEnv

    replaceEnv REACT_APP_API_SERVER_BASE_URL  "`takeEnv ADMIN_API_URL global.env`" $targetEnv
    replaceEnv REACT_APP_STORE_BASE_URL  "`takeEnv STORE_FRONT_URL global.env`" $targetEnv
}

function setupQuePasa {
    cpBak '' config/kanvas.yaml
    cpBak '' config/.env-kanvas

    cat <<EOF > config/kanvas.yaml
contracts:
- name: "onchain_kanvas"
  address: "`takeEnv CONTRACT_ADDRESS global.env | sed 's/\"//g'`"
- name: "paypoint"
  address: "`takeEnv PAYPOINT_ADDRESS global.env | sed 's/\"//g'`"
EOF
    cat <<EOF > config/.env-kanvas
NODE_URL=`takeEnv NODE_URL global.env`
BCD_NETWORK=`takeEnv NETWORK global.env`
EOF
}

function setupPeppermint {
    cpBak '' config/peppermint.json
    cat <<EOF > config/peppermint.json
{
    "batchSize": 110,
    "confirmations": 2,
    "timeout": 300,
    "privateKey": "`takeEnv ADMIN_PRIVATE_KEY global.env | sed 's/\"//g'`",
    "rpcUrl": "`takeEnv NODE_URL global.env | sed 's/\"//g'`",
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
                "contract_address": "`takeEnv CONTRACT_ADDRESS global.env | sed 's/\"//g'`"
            }
        }
    }
}
EOF
}

function setupNginx {
    sudo mv /etc/nginx/nginx.conf "/etc/nginx/nginx.conf.bak`ls -w 1 /etc/nginx | grep nginx.conf | wc -l`"

    export nginxConf=$(cat <<EOF
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
        server_name `takeEnv STORE_FRONT_URL global.env | sed -E 's/^https?:\/\///'`;

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

            add_header 'Access-Control-Allow-Origin' '`takeEnv ADMIN_FRONT_URL global.env`';
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
        server_name `takeEnv ADMIN_FRONT_URL global.env | sed -E 's/^https?:\/\///'`;
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
    sudo --preserve-env=nginxConf bash -c 'echo "$nginxConf" > /etc/nginx/nginx.conf'
    sudo certbot --nginx

    sudo nginx -s reload
}

step \
    'Creating a fresh global.env file (note: if one already existed it will be backed up under a .bak extension)' \
    cpBak global.env.example global.env

step \
    'Setting up nested git repositories' \
    git submodule update --init

step \
    'In global.env:
- set STORE_API_URL (exact URL to the API, eg https://kanvas.tzconnect.berlin/api
- set STORE_FRONT_URL
- set ADMIN_API_URL
- set ADMIN_FRONT_URL
- is the store api behind a proxy (eg nginx)? set BEHIND_PROXY_STORE to: yes
- is the admin api behind a proxy (eg nginx)? set BEHIND_PROXY_ADMIN to: yes
- have a look at all other parameters in the "tweakable parameters" section'

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
)"

step 'Set in global.env AWS_S3_BUCKET_STORE and AWS_S3_BUCKET_ADMIN to what the buckets have been named in the previous step'

step \
    'Set AWS_S3_ACCESS_KEY and AWS_S3_KEY_SECRET in global.env, these are related to your AWS account. Please find the correct values on their website (https://us-east-1.console.aws.amazon.com/iam/home#/security_credentials).'

step \
    'If Stripe enabled,  (https://dashboard.stripe.com/test/dashboard):

- find "Publishable key", copy this into STRIPE_PUB_KEY in global.env
- find "Secret key", copy this into STRIPE_SECRET in global.env'

step \
    "If Stripe enabled, (https://dashboard.stripe.com/test/webhooks):

add a new endpoint for a new webhook:
1. set the endpoint url to: `takeEnv STORE_API_URL global.env`/payment/stripe-webhook
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
  'Creating a testnet wallet loaded with tez (if targeting a testnet), and deploying the onchain contracts (FA2 and Paypoint)...' \
    deployOnchainContracts

step \
    'Creating secrets (for JWT, etc.)' \
    createRandomSecrets

step \
    'Setting up admin-api-server/.env with values set in global.env' \
    setupAdminApi

step \
    'Setting up store-api-server/.env with values set in global.env' \
    setupStoreApi

step \
    'Setting up store-front/.env with values set in global.env' \
    setupStoreFront

step \
    'Setting up admin-front/.env with values set in global.env' \
    setupAdminFront

step \
    'Setting up Que Pasa config' \
    setupQuePasa

step \
    'Setting up Peppermint config' \
    setupPeppermint

step \
    'Building docker images' \
    docker-compose build

step \
    'If running with nginx, continue. otherwise quit here.'

step \
    'Setting up the nginx config (this will append to the existing nginx config file)

Note: Certbot will prompt for your information to setup SSL' \
    setupNginx

step \
    'ALL DONE

execute "./run-deployment.bash" to start kanvas' \
    :
