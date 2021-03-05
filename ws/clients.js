function clientInit(packet){
    let client_id = packet.client_id
    WS.clients[client_id].dsid = packet.datastore_id
    packet.datastore_list = { name:LsDataStoreNameList, id:LsDataStoreIdList}
    // if we have the requested data store set the client group to that store
    if (LsDataStoreIdList.includes(packet.datastore_id)){
        // attach init data to packet

    }
    WS.sendToClient(client_id, packet)
}
