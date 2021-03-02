
// this is a mirror of config.client in main.js
let lsconfig = {
    appmode:"ask",
    theme:"default",
    client_port: 25444,
    client_ip: "127.0.0.1",
    app_data_path: null
}

function saveConfig() {
    let config = {}
    config.server = WS.config
    config.client = lsconfig
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
        saveConfig()

    } else {
        if (fs.existsSync(app_data_path + "config.json")) {
            console.log('LOAD: config.json.');
            let config = JSON.parse( fs.readFileSync(app_data_path + "config.json",'utf8') )
            WS.config = config.server
            lsconfig = config.client
        } else {
            saveConfig()
        }

    }

    return true

}

let LSDATA = {}
let LsDataStoreList = []
function loadDataStores() {
    console.log("LS: Begin loading data stores");
    let path = lsconfig.app_data_path + "data"
    let filelist =  fs.readdirSync( path , { withFileTypes:true })
    for (var i = 0; i < filelist.length; i++) {
        //console.log(filelist[i]);
        if (filelist[i].isDirectory()) {
            let storeid = filelist[i].name
            if ( fs.existsSync( path + "/" + storeid + "/store.json" )  ){
                console.log("found a ledgersmart data store folder");
                LSDATA[storeid] = {
                    info: JSON.parse( fs.readFileSync(path + "/" + storeid + "/store.json",'utf8') ),
                    dates:{}
                }
                // load in all the date files
                let datelist =  fs.readdirSync( path + "/" + storeid + "/dates" , {})
                for (var i = 0; i < datelist.length; i++) {
                    let dateid = datelist[i].replace(".json", "")
                    LSDATA[storeid].dates[dateid] = JSON.parse( fs.readFileSync(path + "/" + storeid + "/dates/" + datelist[i] ,'utf8') )
                }
                LsDataStoreList.push(LSDATA[storeid].info.name)
            }
        }
    }
    console.log("LS: Finished loading data stores");
}