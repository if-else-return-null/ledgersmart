#!/usr/bin/env node

const os = require('os')
const fs = require('fs');
const { fork } = require('child_process');
//const { spawn } = require('child_process');
const WebSocket = require('ws');
var https = require('https');


let args = process.argv
let config
process.on('message', (msg) => {
    console.log('WS-> Message from lsmain', msg);
    if (msg.type === "config_info") {
        config = msg.config
        startServer()
    }
    if (msg.type === "shutdown_server") {
        stopServer()
    }
});

function startServer() {
    console.log("'WS-> Websocket server is starting", config);
    // when the server is ready for clients
    process.send({type:"websocket_ready"})
}

function stopServer() {
    console.log("'WS-> Websocket server is stopping", config);
    setTimeout(function(){process.exit();},1000)
}


// request the config from parent before starting ws server
process.send({type:"request_config"})
