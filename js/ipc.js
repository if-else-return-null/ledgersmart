function handleFromMainProcess(data) {
    console.log("from main process", data);
    if (data.type === "config_update") {

        config = data.config
        // check for userlist
        //if ()
        // check for autologin
        if ( data.autologin ) {
            STATE.autologin = data.autologin
            STATE.user = data.autologin.user
            STATE.password = data.autologin.password
            STATE.dsid = data.autologin.dsid
        }
        if (conn === null) {
            //try to connect
            tryConnect()
        }
    }

}

function handleIncomingMessage(data) {
    //console.log("from main process", data);
    if (data.type === "initial_userlist_update") {
        console.log("initial_userlist_update from server");
        // update the list of users from server
        updateUserList(data)
        // check local storage for any autologin data
        if (STATE.autologin !== null){
            requestAttemptLogin()
            STATE.autologin = null

        } else {
            // we need to get user login now
            showUserLoginScreen()
        }

    }
    if (data.type === "userlist_update") {
        updateUserList(data)
    }

    if (data.type === "client_init") {//*** more here to do
        console.log("client init from server");
        STATE.user = data.username
        STATE.password = data.password
        STATE.last_user.value = data.username
        STATE.dsid = data.dsid
        // update local_users and last_user  and remember checkboxes
        if (!STATE.local_users.info[STATE.user]) {
            STATE.local_users.info[STATE.user] = {password:false, dsid:STATE.dsid}
        } else {
            if (STATE.local_users.info[STATE.user].password !== false){
                STATE.local_users.info[STATE.user].password = STATE.password
            }
            STATE.local_users.info[STATE.user].dsid = STATE.dsid
        }

        saveLocalStorage("local_users", STATE.local_users)
        if (STATE.local_users.list.includes(STATE.user)){
            STATE.last_user.value = STATE.user
            saveLocalStorage("last_user", STATE.last_user )
            BYID("settings_user_remember_user").checked = true
        }
        if (STATE.local_users.info[STATE.user].password !== false){
            BYID("settings_user_remember_password").checked = true
        }
        // check for debug list only for root users 
        if ( data.debug_list ) { updateDebugList(data.debug_list) }
        // update the list of datasores from server
        STATE.datastore_list = data.datastore_list
        STATE.storeinfo = data.storeinfo
        updateDataStoreList()
        // if our requested store is available reset the app to use it

        // if our store is not available or there are no stores
        // bring up the settings:data screen
        if (STATE.dsid === null) {
            switchTabs("main_tab_btn_settings", "main_tab_settings")
            clickWorkTabButton("mt_btn_settings_data")
        } else {
            // set the active data store
            setActiveDataStore()
        }
        // clear/reset/hide  user login modal_user_login
        setTimeout(resetUserLoginScreen,1500)
    }
    if (data.type === "user_login") {
        // this will only happen on bad login attempts
        // successful logins will just get a client_init instead
        handleBadUserLoginResponce(data)
    }
    if (data.type === "user_create") {
        handleUserCreateResponce(data)
    }
    if (data.type === "debug_info") {
        handleDebugInfoResponce(data)
    }
}


//*** this needs moved
