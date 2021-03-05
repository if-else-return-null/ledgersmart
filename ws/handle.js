
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


handle.wsClientMessage = function (client_id, packet){
    packet.client_id = client_id
    console.log(`WS: Message from client_id ${ client_id }`, packet );
    if (packet.type && packet.type === "client_init") {
        clientInit(packet)
        return
    }
}

handle.wsClientClose = function (client_id){
    console.log(`WS: Client disconnected: id ${ client_id } `);
}

handle.wsClientError = function (client_id, err){
    console.log(`WS: Client id ${ client_id } error`, err);
}

handle.clientAuthorize = function (client_id, packet) {
    packet.client_id = client_id
    console.log("WS: client init");
    // clients first message(auth) should be a client_init request
    // *** eventually this may require some sort of actual authing
    if (packet.type && packet.type === "client_init") {
        clientInit(packet)
        return true
    } else {
        return false
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
        lsconfig = msg.client
        WS.startServer()
    }
    if (msg.type === "shutdown_server") {
        WS.stopServer()
    }
}
