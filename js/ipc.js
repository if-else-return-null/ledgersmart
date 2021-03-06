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
    if (data.type === "userlist_update") {
        console.log("userlist_update from server");
        // update the list of users from server
        // this will only be recived if on server lsconfig.broadcast_users=true
        updateUserList(data)

    }
    if (data.type === "client_init") {//*** more here to do
        console.log("client init from server");
        // update the list of datasores from server
        STATE.dsid = packet.dsid
        updateDataStoreList(data.datastore_list,packet.dsid)
        // if our requested store is available reset the app to use it
        // if our store is not available or there are no stores bring up the
        // bring up the settings:data screen

        // clear/reset/hide  user login modal_user_login
        setTimeout(resetUserLoginScreen,1500)
    }
    if (data.type === "user_login") {
        // this will only happen on bad login attempts
        // successful logins will just get a client_init instead
        handleUserLoginResponce(data)
    }
    if (data.type === "user_create") {
        handleUserCreateResponce(data)
    }
}


//*** this needs moved
