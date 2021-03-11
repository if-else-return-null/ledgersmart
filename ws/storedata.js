
function createDataStore(packet){
    console.log("LS: Creating new datastore", packet);
    let client_id = packet.client_id
    let username = WS.clients[client_id].username
    packet.username = username
    let dsid = generateUUID()

    let info = {
        owner:username,
        creators:[], // list of usernames that can create/modify/delete account/category/department
        name:packet.name,
        dsid:dsid,
        account:{},
        category:{},
        department:{},
        schedule:{} // this should be keyed to each user
    }

    LSDATA[dsid] = {
        info:cloneOBJ(info),
        dates:{}
    }
    LsDataStoreList.name.push(LSDATA[dsid].info.name)
    LsDataStoreList.id.push(dsid)

    // setup some inital data
    let create_item = { client_id: client_id, uuid:"new", name:"Home", notify:false , dsid:dsid }
    updateDataStoreDepartment(create_item)
    create_item.name = "Cash"
    create_item.atype = "0"
    //updateDataStoreAccount(create_item)

    SAVE.datastore(dsid)
    LSUSER[username].lastUsedDataStore = dsid
    SAVE.user(username)
    // we just do client_init now so the new
    // datastore can be setup in the client
    clientInit(packet)

    // send list update to roots and clients of user
    let datastore_list_item = { type:"datastore_list_edit", subtype:"add", name:LSDATA[dsid].info.name, id:dsid }
    WS.sendToOthers(client_id, datastore_list_item, { creator:"skip", perm:"skip" })




}

function checkForCreator(username,dsid) {
    let ok = true
    if ( !LSDATA[dsid] ) { ok = false }
    if ( username !== LSDATA[dsid].info.owner ){
        if (!LSDATA[dsid].info.creators.includes(username)) { ok = false } //*** maybe display warning
    }
    if (LSUSER[username].isRoot === true) { ok = true }
    return ok
}


//-------account/category/department
function updateDataStoreDepartment(packet){
    let client_id = packet.client_id
    let username = WS.clients[client_id].username
    let dsid = WS.clients[client_id].dsid
    if (packet.dsid) { dsid = packet.dsid } // this should only happen on new datastore creation
    if ( checkForCreator(username,dsid) === false ) {
        // *** maybe send back a negative responce
        console.log(`${username} id not a creator for ${LSDATA[dsid].info.name}`);
        packet.success = false
        sendToClient(client_id, packet)
        return;
    }
    console.log(`LS: updateDataStoreDepartment `,packet);

    // this will contain the modified item or be undefined if new item
    let dsitem = packet.dsitem
    if (packet.uuid === "new"){
        packet.uuid = generateUUID()
        dsitem = {
            name:packet.name, uuid:packet.uuid , sort:0, active:true,
            createdBy:username, createdAt:getTimeStamp()
        }
        packet.dsitem = dsitem
    }
    dsitem.lastChangedBy = username
    dsitem.lastChangedAt = getTimeStamp()

    packet.success = true
    packet.dsid = dsid
    // set the item, respond and save
    console.log();
    LSDATA[dsid].info.department[packet.uuid] = cloneOBJ(dsitem)

    if (packet.notify && packet.notify === false){ return; }
    // we will send an update to any clients with permissions on this datastore
    // they will decide if they need it ( are they using this dsid)
    WS.sendToAllClientsOfUser(client_id, packet)
    WS.sendToAllOtherRoots(client_id, packet)
    WS.sendToAllOtherCreators(client_id, dsid, packet)
    SAVE.datastore(dsid)




}
function updateDataStoreAccount(packet){
    let client_id = packet.client_id
    let username = WS.clients[client_id].username
    let dsid = WS.clients[client_id].dsid

    if ( checkForCreator(username,dsid) === false ) {
        // *** maybe send back a responce
        console.log(`${username} id not a creator for ${LSDATA[dsid].info.name}`);
        return;
    }
    console.log(`LS: updateDataStoreAccount `,packet);



}
function updateDataStoreCategory(packet){
    let client_id = packet.client_id
    let username = WS.clients[client_id].username
    let dsid = WS.clients[client_id].dsid

    if ( checkForCreator(username,dsid) === false ) {
        // *** maybe send back a responce
        console.log(`${username} id not a creator for ${LSDATA[dsid].info.name}`);
        return;
    }
    console.log(`LS: updateDataStoreCategory `,packet);
}
