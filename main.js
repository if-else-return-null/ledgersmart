
const {app, BrowserWindow, ipcMain, Menu} = require('electron')
const { fork } = require('child_process');
const fs = require('fs')
const path = require('path')
let args = process.argv


const gotTheLock = app.requestSingleInstanceLock()

let configWindow = null
let clients = {}

const user = process.env.USER
const os_platform = process.platform
let app_data_path
let config = {
    client:{
        appmode:"ask", // ask, client , both
        theme:"default",
        client_port: 25444,
        client_ip: "127.0.0.1",
        client_protocal: "ws",
        app_data_path: null
    },
    server:{
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
}
// check for config
if (os_platform === "win32"){
    // for windows we will convert to forward slashes like linux
    app_data_path = process.env.APPDATA.replace(/\\/g, "/")}
else {
    app_data_path = process.env.HOME
}
app_data_path += "/.ledgersmart/"

config.client.app_data_path = app_data_path


if ( !fs.existsSync( app_data_path ) ) {
    console.log("CREATE: user data folder", app_data_path);
    fs.mkdirSync( app_data_path + "data", { recursive: true } )
    fs.mkdirSync( app_data_path + "user", { recursive: true } )
    saveConfig()

} else {
    if (fs.existsSync(app_data_path + "config.json")) {
        console.log('LOAD: config.json.');
        config = JSON.parse( fs.readFileSync(app_data_path + "config.json",'utf8') )
    } else {
        saveConfig()
    }

}

function saveConfig(){
    fs.writeFileSync(app_data_path + "config.json", JSON.stringify(config,null,4) ) //
}


function checkArgs(cmdargs = args) {
    console.log(cmdargs);
    let optionSet = false
    cmdargs.forEach((item, i) => {
        // show help for command line
        if (item === "--help" ) {
            showHelp();
            optionSet = true
            return;
        }

        // show the config window
        if (item === "--config" ) {
            console.log("config option");
            startAppInMode("ask");
            optionSet = true
            return;
        }
    });

    // default to the mode specified in config
    if (optionSet === false){
        console.log("starting normal by config setting");
        startAppInMode(config.client.appmode)
    }


}

function showHelp() {
    console.log("LedgerSmart Command options");

}

function startAppInMode(mode) {
    if (mode === "both") {
        startWebSocketServer(mode)
    }
    if (mode === "client") {
        startClientOnly(mode)
    }
    if (mode === "ask") {
        showConfigWindow()
    }

}

app.whenReady().then(() => {

    if (!gotTheLock) {
        let lastarg = args.pop()
        if (lastarg === "--help") {
            showHelp()
        }
        else if (lastarg === "--config") {
            console.log("You must close any existing ledgersmart instances before running --config");
        }

        else {
            console.log("Adding new window in existing instance");
        }
        stdin.setRawMode(false);
        app.quit()
    } else {
        app.on('second-instance', (event, commandLine, workingDirectory) => {
            // Someone tried to run a second instance, we should focus our window.
            handleAnotherInstance( event, commandLine, workingDirectory )

        })
        //*** setup the application menu
        //console.log("local menu",Menu.getApplicationMenu());

        checkArgs()
    }

})


app.on('window-all-closed', function () {

    checkOkToQuit()

})

app.on('will-quit',function(event) {
    console.log("going to quit");
    if (ws_server !== null) {
        console.log("server not closed");
        event.preventDefault()
        checkOkToQuit()
    } else {

    }
})

function handleAnotherInstance(event, commandLine, workingDirectory) {
    console.log("handleAnotherInstance:", commandLine);
    console.log("handleAnotherInstance:", workingDirectory);
    let lastoption = commandLine.pop()
    if (lastoption === "--help") {
        // do nothing
    }

    else if (lastoption === "--config") {
        //*** if there are any open windows focus them and notify to exit before altering config

    }
    else {
        // if no options then open an new client window
        startClientOnly()
    }

}

//---------------------------handle terminal stdin---------------------------

// capture keystrokes
// source: https://stackoverflow.com/questions/17470554/how-to-capture-the-arrow-keys-in-node-js
var stdin = process.stdin;
stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');


// Gives you the unicode of the pressed key
stdin.on('data', function(key){
    console.log("stdin keypress code:",toUnicode(key));
    if (key == '\u0003') { //ctrl-c
        console.log("ctrl-c pressed");
        checkOkToQuit()
    }
});

function toUnicode(theString) {
  var unicodeString = '';
  for (var i=0; i < theString.length; i++) {
    var theUnicode = theString.charCodeAt(i).toString(16).toUpperCase();
    while (theUnicode.length < 4) {
      theUnicode = '0' + theUnicode;
    }
    theUnicode = '\\u' + theUnicode;
    unicodeString += theUnicode;
  }
  return unicodeString;
}




function checkOkToQuit() {
    if (config.client.appmode === "both" && ws_server !== null) {
        ws_server.send({type:"shutdown_server"})
        return
    }

    else {
        process.stdin.setRawMode(false);
        app.quit()
    }


}

//-----------------------------config window------------------------------------------


function showConfigWindow () {
    // Create the browser window.
    configWindow = new BrowserWindow({
        x:0,
        y:0,
        width: 1024,
        height: 768,
        webPreferences: {
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets/icons/logo.png')
    })

    // and load the index.html of the app.
    configWindow.loadFile('./config.html')
    // Open the DevTools.
    configWindow.webContents.openDevTools()
}



ipcMain.on("config_window", (event, data) => {
    console.log("configWindow",data);
    if (data.type === "request_current_config") {
        configWindow.webContents.send("from_mainProcess",{type:"current_config", config:config})
    }
    if (data.type === "cancel_config") {
        app.quit()

    }
    if (data.type === "save_config") {

        config = data.config
        saveConfig()
        configWindow.webContents.send("from_mainProcess",{type:"saved_config", config:config})

    }

})



//-----------------------Websocket Server---------------------------------------

let ws_server = null
function startWebSocketServer(mode) {
    console.log("forking websocket server");

    // fork the ws_server file

    ws_server = fork( path.join(__dirname, "ws_server.js") );

    ws_server.on('message', (msg) => {
        console.log('Message from ws_server', msg);
        if (msg.type === "request_config") {
            ws_server.send({type:"config_info", config:config.server, client:config.client})
        }
        if (msg.type === "websocket_ready") {
            if (mode === "both") {
                startClientOnly()
            }
        }
    });

    //ws_server.send({ hello: 'world' });
    ws_server.on("exit",(code) => {
        console.log('ws_server exited with code', code);
        ws_server = null
        checkOkToQuit()

    });


}


//------------------------------Client----------------------------------------


let clientid = 0
function createWindow () {
    // Create the browser window.
    let id = clientid
    clientid += 1
    clients[id] = new BrowserWindow({
        ls_client_id:id,
        x:0,
        y:0,
        width: 1024,
        height: 768,
        frame: false,
        webPreferences: {
            contextIsolation: false,
            preload: path.join(__dirname, 'preload.js')
        },
        icon: path.join(__dirname, 'assets/icons/logo.png')
    })

    // and load the index.html of the app.
    clients[id].loadFile('./index.html')
    // Open the DevTools.
    clients[id].webContents.openDevTools()
    clients[id].webContents.on('context-menu', function(event,params){
        console.log("client contextmenu",event,params);
    })

}



function startClientOnly(mode) {
    createWindow()
}

ipcMain.on("client_window", (event, data) => {
    let clientID = event.sender.browserWindowOptions.ls_client_id
    console.log("Message from client window id:",clientID);
    if (data.type === "request_current_config") {
        clients[clientID].webContents.send('from_mainProcess', {type:"config_update" , config:config  })

    }
    if (data.type === "window_button") {
        //clients[clientID].
        if (data.button === "win_minimize"){
            if ( clients[clientID].isMinimized() ){
                clients[clientID].restore()
            } else {
                clients[clientID].minimize()
            }
        }
        if (data.button === "win_maximize"){
            if ( clients[clientID].isMaximized()){
                clients[clientID].unmaximize()
            } else {
                clients[clientID].maximize()
            }
        }
        if (data.button === "win_close"){
            clients[clientID].close()
        }

    }
})
