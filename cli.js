#!/usr/bin/env node
// this script is used for development purposes with npm link

// change this to false before packging
let devmode = true

const { fork, spawn } = require('child_process');
const fs = require('fs')
//const path = require('path')
//---------------------------handle terminal commands---------------------------
console.log("cli.js path",__dirname);
let apppath = __dirname + "/main.js"
if ( fs.existsSync(apppath) ){
    console.log("Found main.js");
} else {
    console.log("Not Found main.js");
}
let args = process.argv
let appargs =[ apppath, ]
args.forEach((item, i) => {
    if ( i > 1){ appargs.push(item)  }
});
console.log("appargs",appargs);
let appspawn

if (devmode === true) {


    appspawn = spawn("electron", appargs,{cwd:__dirname, stdio: 'inherit'} )
    //appspawn.stdout.on('data', (data) => { console.log("stderr",data.toString()); });
    //appspawn.stderr.on('data', (data) => { console.log("stderr",data.toString());});
    appspawn.on('exit', (code) => {
      console.log(`appspawn exited with code ${code}`);


    });

} else {

}
