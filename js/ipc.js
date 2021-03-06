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
        STATE.text_based_login = false
        updateUserList(data)

    }
    if (data.type === "client_init") {//*** more here to do
        console.log("client init from server");
        STATE.user = data.username
        STATE.password = data.password
        STATE.last_user = data.username
        STATE.dsid = data.dsid
        // update localStorage

        //saveLocalStorage("last_user", STATE.last_user )
        saveRemember()
        // update the list of datasores from server

        updateDataStoreList(data.datastore_list,data.dsid)
        // if our requested store is available reset the app to use it

        // if our store is not available or there are no stores bring up the
        // bring up the settings:data screen
        if (STATE.dsid === null) {
            switchTabs("main_tab_btn_settings", "main_tab_settings")
            clickWorkTabButton("mt_btn_settings_data")
        }
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
    if (data.type === "debug_info") {
        handleDebugInfoResponce(data)
    }
}


//*** this needs moved
