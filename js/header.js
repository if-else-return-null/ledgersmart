
let BYID = function (id){ return document.getElementById(id) }
let cloneObj = function(obj){ return JSON.parse(JSON.stringify(obj))}
function generateUUIDv4() {
  return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
  );
}

let conn = null
let config = {}
let STATE = {}
STATE.active_tab_info = { btn_id:"main_tab_btn_overview", tab_id:"main_tab_overview" }
STATE.conn_error = false
STATE.appmenu = {}
STATE.user_tile_name = null
STATE.text_based_login = true
STATE.dsid = null
//------------------------ws server connection---------------------------------
function tryConnect() {
    showModal("modal_try_connect")
    try {
        conn = new WebSocket(config.ls.client_protocal + "://"+config.ls.client_ip+":"+config.ls.client_port+"/");
        conn.errorOccured = false
        conn.onopen = function(event) {
            console.log("Websocket conn is open now.");
            STATE.conn_error = false
            // we need to get user login now
            showUserLoginScreen()

        };

        conn.onmessage = function (event) {
            let data = JSON.parse(event.data)
            console.log("Websocket incoming message.", data);
            handleIncomingMessage(data)

        };

        conn.onerror = function(event) {
            console.log("Websocket conn error observed:");
            conn.errorOccured = true
            console.log(event);

        };

        conn.onclose = function(event) {
            console.log("Websocket conn is closed now.", event);
            if (conn.errorOccured === true) {
                STATE.conn_error = true
            }
            // reset conn
            conn = null;
            handleConnectLost()

        };



    } catch (e) {
        console.log( "could not connect to websocket");
    } finally {

    }
}


function handleConnectLost() {
    //*** we may need to reset some things here as we progress
    if (STATE.conn_error === true ) {
        //** maybe show a notice of this
    }
    BYID("conn_lost_server_ip_input").value = config.ls.client_ip
    BYID("conn_lost_server_port_input").value = config.ls.client_port


    setTimeout(function (){ showModal("modal_connect_lost"); },1000)

}

//**** maybe do this with login
function sendInitRequestToServer(){
    let datastore = null
    if (localStorage.getItem("datastore_id")) {
        datastore = localStorage.getItem("datastore_id")
    }
    conn.send( JSON.stringify({type:"client_init", datastore_id:datastore }) )
}
