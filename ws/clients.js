//------------------------clients--------------------------------------------

function clientInit(packet){
    let client_id = packet.client_id
    let username = packet.username
    packet.type = "client_init"
    WS.clients[client_id].dsid = LSUSER[username].lastUsedDataStore
    packet.dsid = LSUSER[username].lastUsedDataStore
    packet.datastore_list = { name:[], id:[] }
    if ( LSUSER[username].isRoot === true){
        packet.datastore_list = LsDataStoreList
    } else {
        for (let dsid in LSUSER[username].perm){
            packet.datastore_list.id.push(dsid)
            packet.datastore_list.name.push(LSDATA[dsid].name)
        }
    }

    // if we have the last used data store set the client group to that store
    if (packet.dsid !== null){
        // check that this data store exists
        if ( !LsDataStoreList.id.includes(packet.dsid)) {
            packet.dsid = null
            WS.clients[client_id].dsid = null
        }
        // check that non-root users have permission on this data store
        if ( LSUSER[username].isRoot === false && !packet.datastore_list.id.includes(packet.dsid)  ) {
            packet.dsid = null
            WS.clients[client_id].dsid = null
        }
    }

    WS.sendToClient(client_id, packet)
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
