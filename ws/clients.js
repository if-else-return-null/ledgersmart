//------------------------clients--------------------------------------------

function clientInit(packet){
    let client_id = packet.client_id
    let username = packet.username.toLowerCase()
    packet.type = "client_init"
    WS.clients[client_id].username = username
    WS.clients[client_id].isRoot = LSUSER[username].isRoot
    WS.clients[client_id].dsid = LSUSER[username].lastUsedDataStore
    //*** need to check for user requested dsid
    if (packet.dsid && packet.dsid !== null){
        if ( LSDATA[packet.dsid] ){
            if ( LSUSER[username].isRoot === true || LSUSER[username].perm[packet.dsid] ){
                WS.clients[client_id].dsid = packet.dsid
                LSUSER[username].lastUsedDataStore = packet.dsid
            }
        }
    }

    packet.dsid = LSUSER[username].lastUsedDataStore
    packet.datastore_list = { name:[], id:[] }
    packet.storeinfo = null
    if ( LSUSER[username].isRoot === true){
        packet.datastore_list = LsDataStoreList
    } else {
        for (let dsid in LSUSER[username].perm){
            packet.datastore_list.id.push(dsid)
            packet.datastore_list.name.push(LSDATA[dsid].name)
        }
    }

    // if we have the last used data store set the client  to that store
    if (packet.dsid !== null){
        // check that this data store exists
        if ( !LsDataStoreList.id.includes(packet.dsid)) {
            packet.dsid = null
            WS.clients[client_id].dsid = null
            LSUSER[username].lastUsedDataStore = null
        }
        // check that non-root users have permission on this data store
        if ( LSUSER[username].isRoot === false && !packet.datastore_list.id.includes(packet.dsid)  ) {
            packet.dsid = null
            WS.clients[client_id].dsid = null
            LSUSER[username].lastUsedDataStore = null
        }
    }
    if (packet.dsid !== null){ packet.storeinfo = LSDATA[packet.dsid].info }

    WS.sendToClient(client_id, packet)
    SAVE.user(username)
}



//---------------------users--------------------------------------------------
function createUserAccount(packet) {
    // check if username already exists
    let client_id = packet.client_id
    let username = packet.username.toLowerCase()
    if (LsUserList.includes(username)){
        // username already exists
        packet.success = false
        packet.reason = "Username already exists"
        WS.sendToClient(client_id, packet)
        return false
    }
    // setup new user object
    let userinfo = {
        displayName: packet.username,
        id:username,
        username:username,
        password:packet.password,
        isRoot:false,
        perm:{},
        lastUsedDataStore:null
    }
    // check if this is the servers first user
    if (STATE.found_root_user === false){
        userinfo.isRoot = true
        STATE.rootUsers.push(username)
        STATE.found_root_user = true
    }
    LSUSER[username] = cloneOBJ(userinfo)
    LsUserList.push(username)

    // save the user data
    SAVE.user(username)
    return true
}


function checkUserLogin(packet){
    let username = packet.username.toLowerCase()
    let password = packet.password
    console.log("checking user login ", username, password);
    // check for valid user
    if (!LsUserList.includes(username)) {
        return false
    }
    if (password !== LSUSER[username].password) {
        return false
    }
    // good user and pass
    return true



}

//------------ datastore

function changeDataStore(packet) {
    let client_id = packet.client_id
    packet.username = WS.clients[client_id].username
    console.log("LS: Change active data store ");
    clientInit(packet)

}
