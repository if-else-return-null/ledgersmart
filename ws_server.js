#!/usr/bin/env node

const fs = require('fs');
const WebSocket = require('ws');
var https = require('https');

// setup websocket object
let WS = {}
WS.args = process.argv
WS.is_subprocess = true
if (!process.send) { WS.is_subprocess = false }

WS.config_file = null
WS.show_help = false
WS.config = {
    server_port: 25444,
    server_ip: "0.0.0.0",
    server_https: false,
    https_cert: "/path/to/cert.pem",
    https_key: "/path/to/key.pem",
    remove_cert_key: false, // see start_as_root.sh for more info
    message_json: true,
    auth_attempt_limit: 5,
    ban_interval:1800000,
    max_rate_per_sec: 20,
    ban_on_rate_limit: true
}
WS.clients = {}
WS.new_client_id = 0
WS.banned = { list:[], info:{} }

WS.server = null

WS.loadComfig = function (){
    if (fs.existsSync(WS.config_file)) {
        console.log('WS: Loading config file.');
        let temp = JSON.parse( fs.readFileSync(WS.config_file , 'utf8') )
        //WS.config = JSON.parse( fs.readFileSync(WS.config_file , 'utf8') )
        for (let item in temp ){
            WS.config[item] = temp[item]
        }
    }
}

WS.showHelp = function () {
    console.table(WS.help.cli_options);
    //console.table(WS.help.config);
    for (let item in WS.help.config) {
        console.log(item );
        console.log(WS.help.config[item]);
        console.log("\n");
    }
    process.exit(0)
}



WS.init = function(){
    // check if run as a sub-process
    if (WS.is_subprocess === false) {

        // check for commandline args then start the server
        WS.args.forEach((item, i) => {
            // show help for command line
            if (item === "--help" ) {
                WS.show_help = true
            }
            if (item === "--config" ) {
                WS.config_file = WS.args[i+1]
            }
            // custom port
            if (item === "--port" ) {
                WS.config.server_port = WS.args[i+1]
            }
            // show the config window
            if (item === "--restrict" ) {
                WS.config.server_ip = "127.0.0.1"
            }
            if (item === "--https" ) {
                WS.config.server_https = true
            }
        });
        if (WS.config_file !== null){
            WS.loadComfig()
        }
        if (WS.show_help === true ) {
            WS.showHelp()
        } else {
            WS.startServer()
        }



    } else {
        // if run as a subprocess setup messaging and request config
        process.on('message', (msg) => {
            handle.parentMessage(msg)

        });
        // request the config from parent before starting ws server
        process.send({type:"request_config"})

    }


}

WS.help = {
    config:{
        server_port: "(Integer) defaults to 25444",
        server_ip: "(string)  defaults to 0.0.0.0 for network accesable,\n use 127.0.0.1 for localhost only",
        server_https: "(booleen) defaults to false. if true the server will use https mode",
        https_cert: "(string) absolute path to https certificate file",
        https_key: "(string) absolute path to https key file",
        remove_cert_key:  "(booleen) defaults to false. \n If true the server(in https mode) will delete the certificate and key file after reading them in.\n see start_as_root.sh for more info",
        message_json: "(booleen) defaults to true which will JSON.parse() each incoming message.\n Set this to false to leave the messages as the are",
        auth_attempt_limit: "(Integer) defaults to 5,\n number of failed auth attempts before an ip address is added to banned list",
        ban_interval:"(Integer) defaults to 1800000,\n length of time in milliseconds that an ip address will stay on the banned list",
        max_rate_per_sec: "(Integer) defaults to 20,\n maximum messages per second from a clinet",
        ban_on_rate_limit: "(booleen) defaults to true,\n ban clients who go over rate limit, if false just disconnect them"
    },
    cli_options:{
        "--help":"Show this help",
        "--config":"Specify a config file to use",
        "--port":"Specify a port to use",
        "--restrict":"Restrict connections to localhost only",
        "--https":"Start the server in https mode",

    }

}


WS.makeBannedId = function (ip) {
    return ip.replace(/\./g ,"_").replace(/:/g ,"_")
}


WS.startServer = function () {
    console.log("WS: server is starting", WS.config);
    // determine type of server to start http/https
    if (WS.config.server_https === true) {
        console.log("WS: Server in https mode");
        // https
        const httpsServer = https.createServer({
            cert: fs.readFileSync(WS.config.https_cert),
            key: fs.readFileSync(WS.config.https_key)
        });
        httpsServer.listen({ port:WS.config.server_port , host:WS.config.server_ip }, function() {
            console.log(`WS: Server is listening on wss://${WS.config.server_ip}:${WS.config.server_port}`);
        });


        WS.server = new WebSocket.Server({ server:httpsServer , maxPayload:128 * 1024 /* 128 KB*/ });
        // remove the cert and key file if needed
        if (WS.config.remove_cert_key === true){ // see start_as_root.sh for more info
            if ( fs.existsSync( WS.config.https_cert ) ) {
                console.log("deleting cert.pem");
                fs.unlinkSync(WS.config.https_cert)
            }
            if ( fs.existsSync( WS.config.https_key ) ) {
                console.log("deleting key.pem");
                fs.unlinkSync( WS.config.https_key )
            }
        }



    } else {
        // http
        console.log("WS: Server in http mode");
        WS.server = new WebSocket.Server({ port:WS.config.server_port , host:WS.config.server_ip , maxPayload:128 * 1024 });
        console.log(`WS: Server is listening on ws://${WS.config.server_ip}:${WS.config.server_port}` );
    }

    function noop() {}

    function heartbeat() {

        this.isAlive = true;
    }


    const zombieInterval = setInterval(function ping() {
        if (WS.server !== null){
            // check for no reponsive clients
            WS.server.clients.forEach(function each(ws) {
                if (ws.isAlive === false) {
                    console.log("no heartbeat", ws.client_id)
                    ws.close();
                } else {
                    ws.isAlive = false;
                    ws.ping(noop);
                }
            });
            // check for banned list removals
            let timenow = Date.now()
            WS.banned.list.forEach((item, i) => {
                let id = WS.makeBannedId(item)
                if (WS.banned.info[id].bantime + WS.config.ban_interval < timenow && WS.banned.info[id].static === false) {
                    // remove from banlist
                    WS.banned.list.splice(i,1)
                    delete WS.banned.info[id]
                }
            });

        }

    }, 30000);
    WS.server.shouldHandle = function(req) {
        //console.log("shouldHandle CALLED", req.connection.remoteAddress);

        if (WS.banned.list.includes(req.connection.remoteAddress)) {
            console.log("WS: not handling banned client");
            return false
        }
        if (this.options.path) {
            const index = req.url.indexOf('?');
            const pathname = index !== -1 ? req.url.slice(0, index) : req.url;

            if (pathname !== this.options.path) return false;
        }

        return true;
}
    // handle websocket server errors
    WS.server.on('error', function error(err) {
        clearInterval(zombieInterval);
        handle.wsServerError(err)
    });
    // handle websocket server closing
    WS.server.on('close', function close() {
        clearInterval(zombieInterval);
        handle.wsServerClose()
    });
    WS.server.on('connection', function connection(ws, req) {
        ws.isAlive = true;
        ws.connnectTime = Date.now()
        ws.originIP = req.connection.remoteAddress
        ws.rlBucket = { time:ws.connnectTime,count:0 }
        ws.isAuthed = false
        // give an id and setup client in WS.clients
        ws.client_id = String(WS.new_client_id);
        WS.clients[ws.client_id] = { ws_ref: ws , id : ws.client_id  }
        WS.new_client_id += 1;

        ws.on('pong', heartbeat);
        ws.on('error', function error(err) {
            handle.wsClientError(ws.client_id, err)
        });

        ws.on('close', function close() {

            // remove the client from ws
            delete  WS.clients[ws.client_id];
            handle.wsClientClose(ws.client_id)
        })


        ws.on('message', function incoming(message) {
            let auth_id
            let packet = message
            // check for rate limit
            ws.rlBucket.count += 1
            if (ws.rlBucket.count > WS.config.max_rate_per_sec) {
                let timenow = Date.now()
                let secs = Math.floor( (timenow - ws.rlBucket.time) / 1000 )
                let avg = Math.floor( ws.rlBucket.count / secs  )
                console.log("rlout", timenow,secs,avg);
                if ( avg > WS.config.max_rate_per_sec ) {
                    // limit exceded
                    console.log( "WS-SECURITY: Client has exceded rate limit");
                    if (WS.config.ban_on_rate_limit === true) {
                        auth_id = WS.makeBannedId(ws.originIP)
                        if (!WS.banned.info[auth_id]) { WS.banned.info[auth_id] = { bantime:null, attempts:[] , static:false} }
                        WS.banned.list.push(ws.originIP)
                        WS.banned.info[auth_id].bantime = Date.now()
                    }
                    ws.close()
                } else {
                    //empty bucket
                    ws.rlBucket.time = timenow
                    ws.rlBucket.count = 0
                }

            }
            try {
                if (WS.config.message_json === true){
                    packet = JSON.parse( message )
                }
                // check for auth needed
                if (ws.isAuthed === true){
                    handle.wsClientMessage(ws.client_id, packet)
                } else {
                    // until a new client isAuthed all messages will go to clientAuthorize
                    auth_id = WS.makeBannedId(ws.originIP)
                    ws.isAuthed = handle.clientAuthorize(ws.client_id, packet)
                    if (ws.isAuthed !== true){
                        // failed auth attempt
                        if (!WS.banned.info[auth_id]) { WS.banned.info[auth_id] = { bantime:null, attempts:[] , static:false} }
                        WS.banned.info[auth_id].attempts.push({time:Date.now(), data:packet})
                        // check if time to ban
                        if ( WS.banned.info[auth_id].attempts.length > WS.config.auth_attempt_limit ) {
                            console.log( "WS-SECURITY: Client has been banned");
                            WS.banned.list.push(ws.originIP)
                            WS.banned.info[auth_id].bantime = Date.now()
                            ws.close()
                        }
                    } else {
                        console.log("WS client auth good");
                    }

                }


            } catch (e) {
                console.log( "WS-Error: Client message invalid\n",e);
                ws.close()
            } finally {
                // nothing to do here
            }

        })
        handle.wsNewClientConnect(ws.client_id)
    })

    // the server is ready for clients
    handle.wsServerIsReady()



}

WS.stopServer = function () {
    console.log("'WS: server is stopping", WS.config);
    setTimeout(function(){
        WS.server.close()
        //process.exit();
    },1000)
}

WS.sendToClient = function (id, packet) {
    if ( WS.clients[id] ) {
        WS.clients[id].ws_ref.send(JSON.stringify(packet))
    }
}

WS.sendToAllClients = function (packet, checkAuth = true) {
    for (let id in WS.clients) {
        if (checkAuth === false || WS.clients[id].ws_ref.isAuthed === true) {
            WS.clients[id].ws_ref.send(JSON.stringify(packet))
        }
    }
}

// declare the handle object
let handle = {}
let STATE = {}
STATE.found_root_user = false // if this stays false then this is probobly a new server
STATE.rootUsers = []
// update help info for ledgersmart
WS.help.cli_options["--config"] = "Specify a config file to use. Note that this will only override valid server config properties"

// send to roots, creators, and anyone with permissions
// any keys(root|creators|users) in skip will be will be ignored
// if permid is included in skip it will be the uuid expected to be in a users perm array
WS.sendToOthers = function (client_id, packet, skip = {})  {
    let sent_ids = []
    let dsid = WS.clients[client_id].dsid
    for (let id in WS.clients) {
        console.log(typeof(id), typeof(client_id));
        if (id !== client_id && WS.clients[id].ws_ref.isAuthed === true && !sent_ids.includes(id)) {
            // roots
            if ( !skip.root && !sent_ids.includes(id) ){
                if ( WS.clients[client_id].isRoot === true ) {
                    WS.clients[id].ws_ref.send(JSON.stringify(packet))
                    sent_ids.push(id)
                }
            }
            // creators
            if ( !skip.creators && !sent_ids.includes(id) ){
                if ( LSDATA[dsid].creators.includes(WS.clients[id].username)) {
                    WS.clients[id].ws_ref.send(JSON.stringify(packet))
                    sent_ids.push(id)
                }
            }
            // other users with proper permissions
            if ( !skip.perm && !sent_ids.includes(id) ){
                if ( skip.permid ) {
                    if ( LSUSER[WS.clients[id].username].perm[dsid] && LSUSER[WS.clients[id].username].perm[dsid].includes(skip.permid)) {
                        WS.clients[id].ws_ref.send(JSON.stringify(packet))
                        sent_ids.push(id)
                    }
                }

            }
            // other clients of this user
            if ( !sent_ids.includes(id) ) {
                if ( WS.clients[id].username === username  ) {
                    WS.clients[id].ws_ref.send(JSON.stringify(packet))
                }
            }
        }
    }
    console.log("sendToOthers", sent_ids);
}


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
    return getDateNow()+"_"+getTimeNow()
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

SAVE.datastore = function (dsid){
    // make the folder store folder path
    let path = lsconfig.app_data_path + "data/"+ dsid + "/dates"
    fs.mkdirSync( path, { recursive: true } )
    // save store info
    path = path.replace("dates", "store.json")
    fs.writeFileSync(path, JSON.stringify(LSDATA[dsid].info,null,4) ) //
}

// this is a mirror of config.ls in main.js
let lsconfig = {
    appmode:"ask",
    theme:"default",
    client_port: 25444,
    client_ip: "127.0.0.1",
    app_data_path: null,
    broadcast_users: true
}

// used in standalone server mode to get or create config file
function getConfigInfoCli() {
    const user = process.env.USER
    const os_platform = process.platform
    let app_data_path
    // check for config
    if (os_platform === "win32"){
        // for windows we will convert to forward slashes like linux
        app_data_path = process.env.APPDATA.replace(/\\/g, "/")}
    else {
        app_data_path = process.env.HOME
    }
    app_data_path += "/.ledgersmart/"
    lsconfig.app_data_path = app_data_path

    if ( !fs.existsSync( app_data_path ) ) {
        console.log("LS: CREATE: user data folder", app_data_path);
        fs.mkdirSync( app_data_path + "data", { recursive: true } )
        fs.mkdirSync( app_data_path + "user", { recursive: true } )
        SAVE.config()

    } else {
        if (fs.existsSync(app_data_path + "config.json")) {
            console.log('LOAD: config.json.');
            let config = JSON.parse( fs.readFileSync(app_data_path + "config.json",'utf8') )
            WS.config = config.server
            lsconfig = config.ls
        } else {
            SAVE.config()
        }

    }

    return true

}
//------------------------Data Stores----------------------------------------
let LSDATA = {}

let LsDataStoreList = { name:[], id:[] }

function loadDataStores() {
    console.log("LS: Begin loading data stores");
    let path = lsconfig.app_data_path + "data"
    let filelist =  fs.readdirSync( path , { withFileTypes:true })
    //console.log("datastore dir",filelist);

    for (let i = 0; i < filelist.length; i++) {
        //console.log(filelist[i]);
        if (filelist[i].isDirectory()) {
            let dsid = filelist[i].name
            if ( fs.existsSync( path + "/" + dsid + "/store.json" )  ){
                console.log("found a ledgersmart data store folder");

                LSDATA[dsid] = {
                    info: JSON.parse( fs.readFileSync(path + "/" + dsid + "/store.json",'utf8') ),
                    dates:{}
                }

                // load in all the date files
                let datelist =  fs.readdirSync( path + "/" + dsid + "/dates" , {})
                //console.log("date list",datelist);
                for (let ii = 0; ii < datelist.length; ii++) {
                    let dateid = datelist[ii].replace(".json", "")
                    LSDATA[dsid].dates[dateid] = JSON.parse( fs.readFileSync(path + "/" + dsid + "/dates/" + datelist[ii] ,'utf8') )
                }
                LsDataStoreList.name.push(LSDATA[dsid].info.name)
                LsDataStoreList.id.push(dsid)
            }
        }
    }

    console.log("LS: Finished loading data stores");
}

//--------------------------------user accounts--------------------------------
let LSUSER = {

}
let LsUserList = []

function loadUsers() {
    console.log("LS: Begin loading user accounts");
    let path = lsconfig.app_data_path + "user"
    let filelist =  fs.readdirSync( path , { })
    console.log("filelist",filelist);
    for (var i = 0; i < filelist.length; i++) {
        if ( filelist[i].endsWith(".json") ){
            console.log("found user file");
            let username = filelist[i].replace(".json","")
            LSUSER[username] = JSON.parse( fs.readFileSync(path + "/" + filelist[i] ,'utf8') )
            if (LSUSER[username].isRoot === true) {
                STATE.found_root_user = true
                STATE.rootUsers.push(username)
            }
            // add to lists
            LsUserList.push(username)
        }
    }
    console.log("LS: Finished loading user accounts", LSUSER);
}
//------------------------clients--------------------------------------------

function clientInit(packet){
    let client_id = packet.client_id
    let username = packet.username.toLowerCase()
    packet.type = "client_init"
    packet.isRoot = false
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
        packet.debug_list = debug_list
        packet.isRoot = true
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
    //*** eventually this will have to adjust or modify the storeinfo
    //    based on the users permissions
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
        // perm contains an arrays for each datastore the user has
        // permmision on keyed to it's dsid. The arrays contain
        // uuid"s of any department or account the user has permission on. The
        // dsid itself should also be in its respective array
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

//*** this needs to be updated to use node crypto (currently plain txt)
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

function changeActiveDataStore(packet) {
    let client_id = packet.client_id
    packet.username = WS.clients[client_id].username
    console.log("LS: Change active data store ");
    clientInit(packet)

}

//----------------Permissions---------------------

function givePermissionToUser(packet) {
    let client_id = packet.client_id
    let username = WS.clients[client_id].username
    let dsid = WS.clients[client_id].dsid
    let perm_user = packet.perm_user
    let perm_ids = packet.perm_ids //[]
    // add permission to a datastore
    if (!LSUSER[permuser]) {
        packet.reason = `${perm_user} is not a valid username`
        packet.success = false
        console.log(packet.reason);
        WS.sendToClient(client_id, packet)
        return;
    }
    if ( checkForCreator(username,dsid) === false ) {
        packet.reason = `${username} is not a creator for ${LSDATA[dsid].info.name}`
        packet.success = false
        console.log(packet.reason);
        WS.sendToClient(client_id, packet)
        return;
    }
    // check to see if we are fully revoking permissions
    if (perm_ids === null) {
        delete LSUSER[permuser].perm[dsid]
        packet.reason = `${username}'s permissions on ${LSDATA[dsid].info.name} have been revoked`
        packet.success = true
    } else {
        // ok good to add permissions
        // first reset the permission array
        LSUSER[permuser].perm[dsid] = [dsid]
        // now add the given uuid
        perm_ids.forEach((item, i) => {
            LSUSER[permuser].perm[dsid].push(item)
        });
        packet.reason = `${username}'s permissions on ${LSDATA[dsid].info.name} have been updated`
        packet.success = true
    }
    console.log(packet.reason);
    WS.sendToClient(client_id, packet)
    WS.sendToOthers(client_id, packet, {perm:"skip"} )
    SAVE.user(perm_user)


}

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

    // setup inital department and account
    let create_dept = { client_id: client_id, uuid:"new", name:"Home", notify:false , dsid:dsid }
    updateDataStoreDepartment(create_dept)
    let create_acct = { client_id: client_id, uuid:"new", name:"Cash", atype:"0", notify:false , dsid:dsid }
    updateDataStoreAccount(create_acct)

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

// this will rely on keeping accurate tcounts when inputing/updating transactions
function deleteDataStoreItem(packet) {
    let client_id = packet.client_id
    let username = WS.clients[client_id].username
    let dsid = WS.clients[client_id].dsid
    let uuid = packet.uuid
    if ( checkForCreator(username,dsid) === false ) {
        // *** maybe send back a negative responce
        packet.reason = `${username} is not a creator for ${LSDATA[dsid].info.name}`
        console.log(packet.reason);
        packet.success = false
        WS.sendToClient(client_id, packet)
        return;
    }
    if (LSDATA[dsid].info[packet.itemtype][uuid].tcount !== 0) {
        packet.reason = `Unable to delete ${packet.itemtype} ${LSDATA[dsid].info[packet.itemtype][uuid].name} is in use`
        console.log(packet.reason);
        packet.success = false
        WS.sendToClient(client_id, packet)
        return;
    }
    // ok to delete
    packet.success = true
    packet.dsid = dsid
    console.log(`LS: Deleting ${packet.itemtype} - ${LSDATA[dsid].info[packet.itemtype][uuid].name}`);
    delete LSDATA[dsid].info[packet.itemtype][uuid]
    WS.sendToClient(client_id, packet)
    WS.sendToOthers(client_id, packet, {permid:uuid} )

}

//-------account/category/department
function updateDataStoreDepartment(packet){
    let client_id = packet.client_id
    let username = WS.clients[client_id].username
    let dsid = WS.clients[client_id].dsid
    if (packet.dsid) { dsid = packet.dsid } // this should only happen on new datastore creation
    if ( checkForCreator(username,dsid) === false ) {
        // *** maybe send back a negative responce
        console.log(`${username} is not a creator for ${LSDATA[dsid].info.name}`);
        packet.success = false
        WS.sendToClient(client_id, packet)
        return;
    }
    console.log(`LS: updateDataStoreDepartment `,packet);

    // this will contain the modified item or be undefined if new item
    let dsitem = packet.dsitem
    if (packet.uuid === "new"){
        packet.uuid = generateUUID()
        dsitem = {
            name:packet.name, uuid:packet.uuid , sort:0, active:true,
            createdBy:username, createdAt:getTimeStamp(), tcount:0
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
    // we will send an update to roots , creators and ourselves
    // there will be no other permissions on this item yet
    WS.sendToClient(client_id, packet)
    WS.sendToOthers(client_id, packet, {perm:"skip"} )

    SAVE.datastore(dsid)




}

function updateDataStoreAccount(packet){
    let client_id = packet.client_id
    let username = WS.clients[client_id].username
    let dsid = WS.clients[client_id].dsid
    if (packet.dsid) { dsid = packet.dsid } // this should only happen on new datastore creation
    if ( checkForCreator(username,dsid) === false ) {
        // *** maybe send back a negative responce
        console.log(`${username} is not a creator for ${LSDATA[dsid].info.name}`);
        packet.success = false
        WS.sendToClient(client_id, packet)
        return;
    }
    console.log(`LS: updateDataStoreAccount `,packet);
    // this will contain the modified item or be undefined if new item
    let dsitem = packet.dsitem
    if (packet.uuid === "new"){
        packet.uuid = generateUUID()
        dsitem = {
            name:packet.name, uuid:packet.uuid , sort:0, active:true,
            atype:packet.atype, createdBy:username, createdAt:getTimeStamp(), tcount:0
        }
        packet.dsitem = dsitem
    }

    dsitem.lastChangedBy = username
    dsitem.lastChangedAt = getTimeStamp()


    packet.success = true
    packet.dsid = dsid
    // set the item, respond and save

    LSDATA[dsid].info.account[packet.uuid] = cloneOBJ(dsitem)
    if (packet.notify && packet.notify === false){ return; }
    // we will send an update to roots , creators and ourselves
    // there will be no other permissions on this item yet
    WS.sendToClient(client_id, packet)
    WS.sendToOthers(client_id, packet, {perm:"skip"} )
    SAVE.datastore(dsid)



}
function updateDataStoreCategory(packet){
    let client_id = packet.client_id
    let username = WS.clients[client_id].username
    let dsid = WS.clients[client_id].dsid
    if (packet.dsid) { dsid = packet.dsid } // this should only happen on new datastore creation
    if ( checkForCreator(username,dsid) === false ) {
        // *** maybe send back a negative responce
        console.log(`${username} is not a creator for ${LSDATA[dsid].info.name}`);
        packet.success = false
        WS.sendToClient(client_id, packet)
        return;
    }
    console.log(`LS: updateDataStoreCategory `,packet);
    let dsitem = packet.dsitem
    if (packet.uuid === "new"){
        packet.uuid = generateUUID()
        dsitem = {
            name:packet.name, uuid:packet.uuid , sort:0, active:true,
            ctype:packet.ctype, parent:packet.parent,
            createdBy:username, createdAt:getTimeStamp(), tcount:0
        }
        packet.dsitem = dsitem
    }

    dsitem.lastChangedBy = username
    dsitem.lastChangedAt = getTimeStamp()

    packet.success = true
    packet.dsid = dsid
    // set the item, respond and save

    LSDATA[dsid].info.category[packet.uuid] = cloneOBJ(dsitem)
    if (packet.notify && packet.notify === false){ return; }

    // we will send an update to anyone who has permission on this datastore
    WS.sendToClient(client_id, packet)
    WS.sendToOthers(client_id, packet, { permid:dsid } )
    SAVE.datastore(dsid)



}


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

// from this point you would define the all the logic, functions, data, etc that is
// need for your server to do its job. Whatever that might be.
// all the functions in the handle object are intended to modified for your specific use case
// Then call WS.init() when your code is ready for the server to start up





handle.wsServerError = function (err){
    console.log("WS: Server error has occured",err);
    process.exit()
}

handle.wsServerClose = function (){
    console.log("WS: server has closed");
    process.exit()
}


handle.wsClientClose = function (client_id){
    console.log(`WS: Client disconnected: id ${ client_id } `);
}

handle.wsClientError = function (client_id, err){
    console.log(`WS: Client id ${ client_id } error`, err);
}

handle.wsNewClientConnect = function(client_id) {
    console.log(`WS: New client connected: id ${ client_id } `);
    let packet = { type:"initial_userlist_update", list:null }
    if (lsconfig.broadcast_users === true) {
        packet.list = LsUserList
    }
    WS.sendToClient(client_id, packet)
}


handle.clientAuthorize = function (client_id, packet) {
    packet.client_id = client_id
    console.log("WS: clientAuthorize");
    // clients first message(auth) should be a user_login or user_create request
    if (packet.type && packet.type === "user_login") {
        // check login info
        let loginok = checkUserLogin(packet)
        if (loginok){
            packet.success = true
            // initiate the client
            clientInit(packet)
            return true
        } else {
            packet.success = false
            WS.sendToClient(client_id, packet)
            return false
        }

    }
    else if (packet.type && packet.type === "user_create") {
        let createok = createUserAccount(packet)
        if (createok){
            packet.success = true
            //** add any other info to the packet here
            WS.sendToClient(client_id, packet)
            return true
        } else {
            return false
        }

    }
    else {
        return false
    }

}



handle.wsClientMessage = function (client_id, packet){
    packet.client_id = client_id
    console.log(`WS: Message from client_id ${ client_id }`, packet );

    if (packet.type && packet.type === "user_login") {
        // check login info
        let loginok = checkUserLogin(packet)
        if (loginok){
            packet.success = true
            // initiate the client
            clientInit(packet)
            return true
        } else {
            packet.success = false
            WS.sendToClient(client_id, packet)
            return false
        }

    }

    if (packet.type && packet.type === "toggle_broadcast_users") {
        if (WS.clients[client_id].isRoot){
            lsconfig.broadcast_users = !lsconfig.broadcast_users
            console.log("LS broadcast users = ", lsconfig.broadcast_users );
            saveConfig()
        }
        return
    }

    if (packet.type && packet.type === "debug_info") {
        if (WS.clients[client_id].isRoot) {
            debugGetItem(packet)
        }
    }
    // ------------DATA STORES
    if (packet.type && packet.type === "datastore_create") {
        createDataStore(packet)
    }
    if (packet.type && packet.type === "datastore_change") {
        changeActiveDataStore(packet)
    }

    //-------account/category/department
    if (packet.type && packet.type === "datastore_update_department") {
        updateDataStoreDepartment(packet)
    }
    if (packet.type && packet.type === "datastore_update_account") {
        updateDataStoreAccount(packet)
    }
    if (packet.type && packet.type === "datastore_update_category") {
        updateDataStoreCategory(packet)
    }
    if (packet.type && packet.type === "datastore_delete_item") {
        deleteDataStoreItem(packet)
    }
    if (packet.type && packet.type === "datastore_update_transaction") {
        updateDataStoreTransaction(packet)
    }
}



// setup any other messaging here
handle.parentMessage = function (msg){
    console.log('WS: Message from parent', msg);
    if (msg.type === "config_info") {
        // update any config info supplied by parent before starting server
        for (let item in msg.config ){
            WS.config[item] = msg.config[item]
        }
        // set ledgersmarts config
        lsconfig = msg.lsconfig
        WS.startServer()
    }
    if (msg.type === "shutdown_server") {
        WS.stopServer()
    }
}

// setup config and data info for standalone server
if (WS.is_subprocess === false) {
    let getdata = getConfigInfoCli()
    console.log("LS: Got config data for standalone server", getdata);
} else {
    // nothing to do here WS.init will request the config from the
    // parent process after it sets up messageing
}

handle.wsServerIsReady = function () {
    // do any other tasks for server startup
    // load the data stores
    loadDataStores()
    // load user accounts
    loadUsers()
    // let the parent know were ready for clients
    if (WS.is_subprocess){
        process.send({type:"websocket_ready"})
    } else {
        console.log("WS: Websocket Ready")
    }
}


WS.init()


let debug_matrix = {
    lsdata:LSDATA,
    datastorelist:LsDataStoreList,
    lsuser:LSUSER,
    userlist:LsUserList,
    config: { config:WS.config, lsconfig:lsconfig},
    wsclients:WS.clients

}
let debug_list = []
for ( let item in debug_matrix){ debug_list.push(item) }

function debugGetItem(packet) {
    console.log("debugGetItem" , packet);
    packet.item = JSON.stringify(debug_matrix[packet.name])
    WS.sendToClient(packet.client_id, packet)
}



// below here just for testing
setTimeout(function(){
    //WS.stopServer()
    //process.exit();
},10000)
