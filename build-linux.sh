#!/usr/bin/env bash

#update these for you own needs
source_dir="$HOME/github/ledgersmart"
build_dir="$HOME/build"

mkdir -p $build_dir

cd $source_dir

# concat the websocket server files
# echo "#!/usr/bin/env node" | cat - ws/header.js ws/server.js > ws_server.js
node catfiles.js


# package app
electron-packager . --out=$build_dir --overwrite


#*** add packaging for ls-server-cli
pkg . --out-path $build_dir
