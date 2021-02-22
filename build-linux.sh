#!/usr/bin/env bash
rm -rf /home/returnnull/github/build-ledgersmart

cp -r /home/returnnull/github/ledgersmart /home/returnnull/github/build-ledgersmart

cd /home/returnnull/github/build-ledgersmart

electron-packager .
