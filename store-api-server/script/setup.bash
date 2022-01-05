#!/usr/bin/env bash
cd $(git rev-parse --show-toplevel)/store-api-server

function keypress {
	# used in case of manual actions pending automation
	# (do-nothing scripting style)
	read -p "press any key to continue (or ^C to quit)... " -n1 -s
	echo
}

function install-yarn {
	curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash || exit 1
	export NVM_DIR="$HOME/.nvm"
	[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

	nvm install node || exit 1
	nvm install-latest-npm || exit 1
	npm install --global yarn || exit 1
}

echo "this will:
1). install nvm (required for step 2)
2). install npm (required for step 3)
3). install yarn (required for step 4)
4). install library dependencies for the backend"
keypress

install-yarn || exit 1
yarn install
