#!/usr/bin/env bash

#update these for you own needs
source_dir="$HOME/github/ledgersmart"
build_dir="$HOME/build/ledgersmart"


#remove old builds
rm -rf $build_dir

#copy source to build
cp -r $source_dir $build_dir

cd $build_dir

# concat the websocket server files
cat ws/header.js ws/server.js
# turn devmode off
echo -e '{"active":false}\n' > $build_dir/devmode.json



# package app
#electron-packager .
