#!/usr/bin/env node

const fs = require('fs')
const path = require('path')
console.log("Removing LedgerSmart user data");

const user = process.env.USER
const os_platform = process.platform
let app_data_path
let app_data_path1  // ledgersmart user data
let app_data_path2  // electron browser data (localStorage)

// get paths *** need to dbl check paths for windows
if (os_platform === "win32"){
    // for windows we will convert to forward slashes like linux
    app_data_path = process.env.APPDATA.replace(/\\/g, "/")
    app_data_path1 = app_data_path + "/.ledgersmart/"
    app_data_path2 = app_data_path + "/ledgersmart/"

} else {
    app_data_path = process.env.HOME
    app_data_path1 = app_data_path + "/.ledgersmart/"
    app_data_path2 = app_data_path + "/.config/ledgersmart/"
}

console.log("ls-data:", app_data_path1 );
console.log("browser-data:", app_data_path2 );
fs.rmSync(app_data_path1, {recursive:true, force:true})
fs.rmSync(app_data_path2, {recursive:true, force:true})
