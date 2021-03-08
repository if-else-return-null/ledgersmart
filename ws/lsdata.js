
// this is a mirror of config.ls in main.js
let lsconfig = {
    appmode:"ask",
    theme:"default",
    client_port: 25444,
    client_ip: "127.0.0.1",
    app_data_path: null,
    broadcast_users: true
}

function saveConfig() {
    let config = {}
    config.server = WS.config
    config.ls = lsconfig
    fs.writeFileSync(lsconfig.app_data_path + "config.json", JSON.stringify(config,null,4) ) //
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
        saveConfig()

    } else {
        if (fs.existsSync(app_data_path + "config.json")) {
            console.log('LOAD: config.json.');
            let config = JSON.parse( fs.readFileSync(app_data_path + "config.json",'utf8') )
            WS.config = config.server
            lsconfig = config.ls
        } else {
            saveConfig()
        }

    }

    return true

}
//------------------------Data Stores----------------------------------------
let LSDATA = {
    /*
    dsid: {
        info:{
            name:"storename",

        },
        dates:{

        }
    }
    */
}

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

function createDataStore(packet){
    console.log("LS: Creating new datastore", packet);
    let client_id = packet.client_id
    let username = WS.clients[client_id].username
    packet.username = username
    let dsid = packet.uuid
    let path = lsconfig.app_data_path + "data/"+ dsid + "/dates"
    fs.mkdirSync( path, { recursive: true } )

    let info = {
        owner:username,
        name:packet.name,
        dsid:dsid,
        accounts:{},
        category:{},
        department:{},
        schedule:{}

    }

    path = path.replace("dates", "store.json")
    fs.writeFileSync(path, JSON.stringify(info,null,4) ) //
    LSDATA[dsid] = {
        info:cloneOBJ(info),
        dates:{}
    }
    LsDataStoreList.name.push(LSDATA[dsid].info.name)
    LsDataStoreList.id.push(dsid)
    // send list update to roots and other clients of user
    let list_item = { type:"ds_list_update", subtype:"add", name:LSDATA[dsid].info.name, id:dsid }
    WS.sendToOtherClientsOfUser(client_id, list_item)
    WS.sendToAllOtherRoots(client_id, list_item)
    // update clients user perm & active datastore
    LSUSER[username].perm[dsid] = {}
    LSUSER[username].lastUsedDataStore = dsid
    //WS.clients[client_id].dsid
    SAVE.user(username)

    // we should probobly just do client_init now so the new
    // datastore can be set in the client
    clientInit(packet)

}


//--------------------------------user accounts--------------------------------
let LSUSER = {

}
let LsUserList = []

function loadUsers() {
    console.log("LS: Begin loading user accounts");
    let path = lsconfig.app_data_path + "user"
    let filelist =  fs.readdirSync( path , { })
    for (var i = 0; i < filelist.length; i++) {
        if ( filelist[i].endsWith(".json") ){
            let username = filelist[i].replace(".json","")
            LSDATA[username] = JSON.parse( fs.readFileSync(path + "/" + filelist[i] ,'utf8') )
            if (LSDATA[username].isRoot === true) {
                STATE.found_root_user = true
                STATE.rootUsers.push(username)
            }
            // add to lists
            LsUserList.push(username)
        }
    }
    console.log("LS: Finished loading user accounts");
}
