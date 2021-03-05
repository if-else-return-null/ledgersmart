function handleFromMainProcess(data) {
    console.log("from main process", data);
    if (data.type === "config_update") {
        config = data.config
        if (conn === null) {
            //try to connect
            tryConnect()
        }
    }

}

function handleIncomingMessage(data) {
    //console.log("from main process", data);
    if (data.type === "client_init") {
        console.log("client init from server");
        // update the list of datasores from server
        updateDataStoreList(data.datastore_list)
        // if our requested store is available reset the app to use it
        // if our store is not available or there are no stores bring up the
        // bring up the settings:data screen
    }
}
