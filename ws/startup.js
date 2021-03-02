
// setup config and data info for standalone server
if (WS.is_subprocess === false) {
    let getdata = getConfigInfoCli()
    console.log("LS: Got config data for standalone server", getdata);
} else {
    // nothing to do here WS.init will request the config from the
    // parent process after it sets up messageing
}

handle.wsServerIsReady = function () {
    // do any other tasks for server startup
    // get a list data stores
    loadDataStores()
        
    // let the parent know were ready for clients
    if (WS.is_subprocess){
        process.send({type:"websocket_ready"})
    } else {
        console.log("WS: Websocket Ready")
    }
}


WS.init()


// below here just for testing
setTimeout(function(){
    //WS.stopServer()
    //process.exit();
},10000)
