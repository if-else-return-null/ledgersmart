
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
    // load the data stores
    loadDataStores()
    // load user accounts
    loadUsers()
    // let the parent know were ready for clients
    if (WS.is_subprocess){
        process.send({type:"websocket_ready"})
    } else {
        console.log("WS: Websocket Ready")
    }
}


WS.init()


let debug_matrix = {
    lsdata:LSDATA,
    datastorelist:LsDataStoreList,
    lsuser:LSUSER,
    userlist:LsUserList,
    config: { config:WS.config, lsconfig:lsconfig},
    wsclients:WS.clients

}
let debug_list = []
for ( let item in debug_matrix){ debug_list.push(item) }

function debugGetItem(packet) {
    console.log("debugGetItem" , packet);
    packet.item = JSON.stringify(debug_matrix[packet.name])
    WS.sendToClient(packet.client_id, packet)
}



// below here just for testing
setTimeout(function(){
    //WS.stopServer()
    //process.exit();
},10000)
