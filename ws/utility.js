
// declare the handle object
let handle = {}
let STATE = {}
STATE.found_root_user = false // if this stays false then this is probobly a new server
STATE.rootUsers = []
// update help info for ledgersmart
WS.help.cli_options["--config"] = "Specify a config file to use. Note that this will only override valid server config properties"


function getDateNow(secs) {
    let d
    if (secs === undefined) { d = new Date() } else { d = new Date(secs) }

    let datenow  = [  d.getFullYear(),  ('0' + (d.getMonth() + 1)).slice(-2),  ('0' + d.getDate()).slice(-2)].join('-');
    return datenow
}

function getTimeNow(secs) {
    let d
    if (secs === undefined) { d = new Date() } else { d = new Date(secs) }
    let datenow  = [    ('0' + d.getHours() ).slice(-2),  ('0' + d.getMinutes()).slice(-2)].join(':');
    return datenow
}

function cloneOBJ(obj) { return JSON.parse(JSON.stringify(obj)) }

let SAVE = {}
SAVE.user = function(username){
    console.log("LS: Saving user file ",username);
    //LSUSER[username]
}

WS.sendToAllOtherRoots = function(client_id, packet) {
    for (let id in WS.clients) {
        if (WS.clients[id].ws_ref.isAuthed === true && WS.clients[client_id].isRoot === true && id !== client_id) {
            WS.clients[id].ws_ref.send(JSON.stringify(packet))
        }
    }
}

WS.sendToOtherClientsOfUser = function(client_id, packet) {
    let username = WS.clients[client_id].username
    for (let id in WS.clients) {
        if ( WS.clients[id].ws_ref.isAuthed === true && WS.clients[id].username === username && id !== client_id ) {
            WS.clients[id].ws_ref.send(JSON.stringify(packet))
        }
    }
}


function debugGetItem(packet) {
    let matrix = {
        lsdata:LSDATA,
        datastorelist:LsDataStoreList,
        lsuser:LSUSER,
        userlist:LsUserList,
        config: { config:WS.config, lsconfig:lsconfig}
    }
    packet.item = matrix[packet.name]
    WS.sendToClient(packet.client_id, packet)
}
