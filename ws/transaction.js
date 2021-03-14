

function calcTcounts (dsid, date, tid) {

}
// this is for referance only it is not actually used
let transaction_dsitem = {
    uuid:"generated_id",
    date:"YYYY-MM-DD",
    department:"department_id",
    account:"account_id",
    category:"category_id",
    amount:1.25, // signed floating point value.
    tag:"check#/ATM/DEBIT", // a string denoting somthing about the transaction
    memo:"arbitray memo", // a string however you like it
    createdBy:"username",
    createdAt:"getTimeStamp()",
    lastChangedBy:"username",
    lastChangedAt: "getTimeStamp()",
    split_ids:[], // an array of transaction in a split group
    links:[], //??? array of links to relevent files or web locations
    files:[] //??? array of link to files stored on the server for this transaction
}

function updateDataStoreTransaction(packet) {
    let client_id = packet.client_id
    let username = WS.clients[client_id].username
    let dsid = WS.clients[client_id].dsid
    let dsitem = packet.dsitem
    // if the transaction is create a uuid for it
    if (packet.uuid === "new"){
        packet.uuid = generateUUID()
        dsitem.uuid = packet.uuid
    }

    // first check for and let creators go
    if ( checkForCreator(username,dsid) === false ) {

        // not a creator so check for user permission on dsid,department and account
        if (!LSUSER[username].perm[dsid] ||
        !LSUSER[username].perm[dsid].includes(dsitem.department) ||
        !LSUSER[username].perm[dsid].includes(dsitem.account) ) {
            packet.reason = `${username} permission denied for transaction`
            packet.success = false
            console.log(packet.reason);
            WS.sendToClient(client_id, packet)
            return;
        }

    }

    // permission is good handle the transaction

}
