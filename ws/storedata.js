
function createDataStore(packet){
    console.log("LS: Creating new datastore", packet);
    let client_id = packet.client_id
    let username = WS.clients[client_id].username
    packet.username = username
    let dsid = packet.uuid
    let path = lsconfig.app_data_path + "data/"+ dsid + "/dates"
    fs.mkdirSync( path, { recursive: true } )

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
    // setup some inital data
    // maybe replace these with calls to the normal create functions
    info.department[generateUUID()] = { name:"Home", sort:10 }
    info.account[generateUUID()] = { name:"Cash", sort:10, type:"0" }

    path = path.replace("dates", "store.json")
    fs.writeFileSync(path, JSON.stringify(info,null,4) ) //
    LSDATA[dsid] = {
        info:cloneOBJ(info),
        dates:{}
    }
    LsDataStoreList.name.push(LSDATA[dsid].info.name)
    LsDataStoreList.id.push(dsid)

    // send list update to roots and other clients of user
    let list_item = { type:"ds_list_update", subtype:"add", name:LSDATA[dsid].info.name, id:dsid }
    WS.sendToOtherClientsOfUser(client_id, list_item)
    WS.sendToAllOtherRoots(client_id, list_item)

    // update clients user perm & active datastore
    //** this could maybe just be an array of uuids matching depts & accounts
    LSUSER[username].perm[dsid] = {}
    LSUSER[username].lastUsedDataStore = dsid
    //WS.clients[client_id].dsid
    SAVE.user(username)

    // we should probobly just do client_init now so the new
    // datastore can be set in the client
    clientInit(packet)

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

    let isNew = false
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
        isNew = true
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
    LSDATA[dsid].department[packet.uuid] = cloneOBJ(dsitem)

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
    let isNew = false
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
    let isNew = false
    if ( checkForCreator(username,dsid) === false ) {
        // *** maybe send back a responce
        console.log(`${username} id not a creator for ${LSDATA[dsid].info.name}`);
        return;
    }
    console.log(`LS: updateDataStoreCategory `,packet);
}
