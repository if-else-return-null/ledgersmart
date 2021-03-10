
// declare the handle object
let handle = {}
let STATE = {}
STATE.found_root_user = false // if this stays false then this is probobly a new server
STATE.rootUsers = []
// update help info for ledgersmart
WS.help.cli_options["--config"] = "Specify a config file to use. Note that this will only override valid server config properties"


WS.sendToAllOtherRoots = function(client_id, packet) {
    for (let id in WS.clients) {
        if (WS.clients[id].ws_ref.isAuthed === true && WS.clients[client_id].isRoot === true && id !== client_id) {
            WS.clients[id].ws_ref.send(JSON.stringify(packet))
        }
    }
}

WS.sendToAllClientsOfUser = function(client_id, packet) {
    let username = WS.clients[client_id].username
    for (let id in WS.clients) {
        if ( WS.clients[id].ws_ref.isAuthed === true && WS.clients[id].username === username ) {
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

WS.sendToAllOtherCreators = function(client_id, dsid, packet) {
    let username = WS.clients[client_id].username
    LSDATA[dsid].info.creators.forEach((item, i) => {
        if (item !== username) {
            for (let id in WS.clients) {
                if ( WS.clients[id].ws_ref.isAuthed === true && WS.clients[id].username === item && id !== client_id ) {
                    WS.clients[id].ws_ref.send(JSON.stringify(packet))
                }
            }
        }

    });

}


/* // need to update to node 15.11 for this
const crypto = require('crypto');

function generateUUIDv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.webcrypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

console.log(generateUUIDv4());
*/

function generateUUID () {
    var _lut = [];

	for ( var i = 0; i < 256; i ++ ) {

		_lut[ i ] = ( i < 16 ? '0' : '' ) + ( i ).toString( 16 );

	}
    // http://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid-in-javascript/21963136#21963136

    var d0 = Math.random() * 0xffffffff | 0;
    var d1 = Math.random() * 0xffffffff | 0;
    var d2 = Math.random() * 0xffffffff | 0;
    var d3 = Math.random() * 0xffffffff | 0;
    var uuid = _lut[ d0 & 0xff ] + _lut[ d0 >> 8 & 0xff ] + _lut[ d0 >> 16 & 0xff ] + _lut[ d0 >> 24 & 0xff ] + '-' +
        _lut[ d1 & 0xff ] + _lut[ d1 >> 8 & 0xff ] + '-' + _lut[ d1 >> 16 & 0x0f | 0x40 ] + _lut[ d1 >> 24 & 0xff ] + '-' +
        _lut[ d2 & 0x3f | 0x80 ] + _lut[ d2 >> 8 & 0xff ] + '-' + _lut[ d2 >> 16 & 0xff ] + _lut[ d2 >> 24 & 0xff ] +
        _lut[ d3 & 0xff ] + _lut[ d3 >> 8 & 0xff ] + _lut[ d3 >> 16 & 0xff ] + _lut[ d3 >> 24 & 0xff ];

    // .toUpperCase() here flattens concatenated strings to save heap memory space.
    return uuid.toUpperCase();

}

//console.log(generateUUID());

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

function getTimeStamp() {
    return getTimeNow()+"_"+getTimeNow()
}

function cloneOBJ(obj) { return JSON.parse(JSON.stringify(obj)) }

let SAVE = {}
SAVE.user = function(username){
    console.log("LS: Saving user file ",username);
    //
    fs.writeFileSync(lsconfig.app_data_path + "user/" + username + ".json", JSON.stringify(LSUSER[username],null,4) ) //
}

SAVE.config = function () {
    let config = {}
    config.server = WS.config
    config.ls = lsconfig
    fs.writeFileSync(lsconfig.app_data_path + "config.json", JSON.stringify(config,null,4) ) //
}
