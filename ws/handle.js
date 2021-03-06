
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
    if (lsconfig.broadcast_users === true) {
        //*** send user list
        WS.sendToClient(client_id, {type:"userlist_update", list:LsUserList })
    }
}


handle.clientAuthorize = function (client_id, packet) {
    packet.client_id = client_id
    console.log("WS: client init");
    // clients first message(auth) should be a client_init request
    // *** eventually this may require some sort of actual authing
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
    /*
    // *** probobly don't need this now
    if (packet.type && packet.type === "client_init") {
        clientInit(packet)
        return
    }
    */
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
