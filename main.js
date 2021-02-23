
const {app, BrowserWindow, ipcMain} = require('electron')
const { fork } = require('child_process');
const fs = require('fs')
const path = require('path')
//const WebSocket = require('ws');
let args = process.argv

// change this to false before packging
let devmode = JSON.parse( fs.readFileSync(path.join(__dirname, "devmode.json") ,'utf8') )
console.log(devmode);

const gotTheLock = app.requestSingleInstanceLock()


let configWindow = null
let clients = {}

const user = process.env.USER
const os_platform = process.platform
let app_data_path
let config = {
    appmode:"ask", // server, client , both
    theme:"default",
    serverRestrict: true,
    server_port: 25444,
    server_ip: "127.0.0.1",
    client_port: 25444,
    client_ip: "127.0.0.1"
}
// check for config
if (os_platform === "win32"){
    // for windows we will convert to forward slashes like linux
    app_data_path = process.env.APPDATA.replace(/\\/g, "/")}
else {
    app_data_path = process.env.HOME
}
app_data_path += "/.ledgersmart/"



if ( !fs.existsSync( app_data_path ) ) {
    console.log("CREATE: user data folder", app_data_path);
    fs.mkdirSync( app_data_path, { } )
    //fs.mkdirSync( app_data_path + "other_folder/subfolder", { recursive: true } )
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
        if (item === "-help" ) {
            showHelp();
            optionSet = true
            return;
        }
        // start in server only mode
        if (item === "-server" ) {
            config.appmode = "server"
            startAppInMode("server");
            optionSet = true
            return;
        }
        // show the config window
        if (item === "-config" ) {
            console.log("config option");
            startAppInMode("ask");
            optionSet = true
            return;
        }
    });

    // default to the mode specified in config
    if (optionSet === false){
        console.log("starting normal by config setting");
        startAppInMode(config.appmode)
    }


}

function showHelp() {
    console.log("LedgerSmart Command options");

}

function startAppInMode(mode) {
    if (mode === "server" || mode === "both") {
        startWebSocketServer(mode)
    }
    if (mode === "client") {
        startClientOnly(mode)
    }
    if (mode === "ask") {
        showConfigWindow()
    }

}

function showConfigWindow () {
    // Create the browser window.
    configWindow = new BrowserWindow({
        x:0,
        y:0,
        width: 1024,
        height: 768,
        webPreferences: {
            preload: path.join(__dirname, './js/preload.js')
        },
        icon: path.join(__dirname, 'assets/icons/logo.png')
    })

    // and load the index.html of the app.
    configWindow.loadFile('./config.html')
    // Open the DevTools.
    configWindow.webContents.openDevTools()
}

let clientid = 0
function createWindow () {
    // Create the browser window.
    let id = clientid
    clientid += 1
    clients[id] = new BrowserWindow({
        x:0,
        y:0,
        width: 1024,
        height: 768,
        webPreferences: {
            preload: './js/preload.js'
        },
        icon: path.join(__dirname, 'assets/icons/logo.png')
    })

    // and load the index.html of the app.
    clients[id].loadFile('./index.html')
    // Open the DevTools.
    clients[id].webContents.openDevTools()
}


app.whenReady().then(() => {
    if (!gotTheLock) {
        let lastarg = args.pop()
        if (lastarg === "-help") {
            showHelp()
        }
        else if (lastarg === "-config") {
            console.log("You must close any existing ledgersmart instances before running -config");
        }
        else if (lastarg === "-server") {
            console.log("Attempting to start server if not already running");
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
        checkArgs()
    }

})


app.on('window-all-closed', function () {


    checkOkToQuit()

})

function handleAnotherInstance(event, commandLine, workingDirectory) {
    console.log("handleAnotherInstance:", commandLine);
    console.log("handleAnotherInstance:", workingDirectory);
    let lastoption = commandLine.pop()
    if (lastoption === "-help") {
        // do nothing
    }
    else if (lastoption === "-server") {
        // check to see that the server is running if not start it
        if (ws_server === null) {
            config.appmode = "server"
            startWebSocketServer("server")
        } else {
            console.log("The server is already running");
        }
    }
    else if (lastoption === "-config") {
        // if there are any open windows focus them and notify to exit before altering config

    }
    else {
        // if no options then open an new client window
        startClientOnly()
    }

}

//---------------------------handle terminal commands---------------------------

// capture keystrokes
// source: https://stackoverflow.com/questions/17470554/how-to-capture-the-arrow-keys-in-node-js
var stdin = process.stdin;
stdin.setRawMode(true);
stdin.resume();
stdin.setEncoding('utf8');


// Gives you the unicode of the pressed key
stdin.on('data', function(key){
    console.log(toUnicode(key));
    if (key == '\u0003') { //ctrl-c
        console.log("ctrl-c pressed");
        if (config.appmode === "both" || config.appmode === "server"){
            ws_server.send({type:"shutdown_server"})
        } else {
            checkOkToQuit()
        }

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
    if (config.appmode === "both" && ws_server !== null) {
        ws_server.send({type:"shutdown_server"})
        return
    }

    else if (config.appmode === "server" && ws_server !== null) {
        //ws_server.send({type:"shutdown_server"})
        return
    }
    else {
        process.stdin.setRawMode(false);
        app.quit()
    }


}

//-----------------------------ICP------------------------------------------
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
let WsFiles = ["header.js", "server.js"]
let ws_server = null
function startWebSocketServer(mode) {
    console.log("forking websocket server");
    // build the ws_server file
    //*** maybe remove this for release build and just included the concated file
    let start = `#!/usr/bin/env node` + "\n" +`const WebSocket = require('${path.join(__dirname,"node_modules","ws")}');` + "\n"

    fs.writeFileSync(app_data_path + "ws_server.js", start)
    WsFiles.forEach((item, i) => {
        fs.appendFileSync(app_data_path + "ws_server.js", fs.readFileSync( path.join(__dirname, "ws" , item ),'utf8'));
    });
    // fork the ws_server file
    ws_server = fork(app_data_path + "ws_server.js");
    //ws_server = fork( path.join(__dirname, "ws_server.js") );

    ws_server.on('message', (msg) => {
        console.log('Message from ws_server', msg);
        if (msg.type === "request_config") {
            ws_server.send({type:"config_info", config:config})
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

function startClientOnly(mode) {
    createWindow()
}
