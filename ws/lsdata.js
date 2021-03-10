
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
