let main_radio = document.getElementsByName('appmode');
let BYID = function (id){ return document.getElementById(id) }
let config

// when appmode is both the client settings will mirror the server server settings
// serverRestrict
BYID("server_local_only").addEventListener('change', () => {
    //config.serverRestrict = true
    config.server.server_ip = "127.0.0.1"
    config.ls.client_ip = "127.0.0.1"
    BYID("client_server_ip").value = config.server.server_ip
})
BYID("server_network_wide").addEventListener('change', () => {
    //config.serverRestrict = false
    config.server.server_ip = "0.0.0.0"
    config.ls.client_ip = "0.0.0.0"
    BYID("client_server_ip").value = config.server.server_ip
})
BYID("server_port").addEventListener('change', () => {
    config.server.server_port = BYID("server_port").value
    config.ls.client_port = BYID("server_port").value
    BYID("client_server_port").value = BYID("server_port").value
    // add checks or min max for port numver
})
// clinet ip/port
BYID("client_server_ip").addEventListener('change', () => {
    config.ls.client_ip = BYID("client_server_ip").value
    // add checks or min max for port numver
})
BYID("client_server_port").addEventListener('change', () => {
    config.ls.client_port = BYID("client_server_port").value
    // add checks or min max for port numver
})
// clent Protocal
BYID("client_protocal_ws").addEventListener('change', () => {
    //config.serverRestrict = true
    console.log("ws_change");
    config.ls.client_protocal = "ws"
})
BYID("client_protocal_wss").addEventListener('change', () => {
    //config.serverRestrict = false
    console.log("wss_change");
    config.ls.client_protocal = "wss"
})


//save/cancel
BYID("save_config").addEventListener('click', () => {
    BYID("loading_div").style.display = "block"
    BYID("main_config").style.display = "none"
    lsapi.send("config_window",{ type:"save_config", config:config })
})

BYID("cancel_config").addEventListener('click', () => {
    lsapi.send("config_window",{ type:"cancel_config" })
})

BYID("close_config").addEventListener('click', () => {
    window.close()
})

for (var i = 0; i < main_radio.length; i++) {
    main_radio[i].addEventListener("change", handleMainRadio)
}




function handleMainRadio(ev) {
    let mode
    if (typeof(ev) === "string") {
        mode = ev
    } else {
        mode = ev.target.id
    }
    console.log("main_radio", mode);

    if (mode === "use_as_both") {
        config.ls.appmode = "both"
        config.ls.client_protocal = "ws"
        config.ls.client_ip =  config.server.server_ip
        config.ls.client_port =  config.server.server_port
        BYID("server_options").style.display = "block"
        BYID("client_connect_options").style.display = "none"
    }

    if (mode === "use_as_client") {
        config.ls.appmode = "client"
        BYID("server_options").style.display = "none"
        BYID("client_connect_options").style.display = "block"
    }
}


function handleFromMainProcess(data) {
    console.log("from_mainProcess",data);
    if (data.type === "current_config") {
        config = data.config
        if (config.ls.appmode === "ask"){
            // default to both
            config.ls.appmode = "both"
        }

        if (config.ls.appmode === "both") {
            BYID("use_as_both").checked = true
            handleMainRadio("use_as_both")
        } else {
            BYID("use_as_client").checked = true
            handleMainRadio("use_as_client")
        }

        if (config.ls.client_protocal === "ws") {
            BYID("client_protocal_ws").checked = true
        } else {
            BYID("client_protocal_wss").checked = true
        }

        if (config.server.server_ip === "127.0.0.1") {
            BYID("server_local_only").checked = true
        } else {
            BYID("server_network_wide").checked = true
        }

        BYID("server_port").value = config.server.server_port
        BYID("client_server_ip").value = config.ls.client_ip
        BYID("client_server_port").value = config.ls.client_port

        setTimeout(function (){
            BYID("loading_div").style.display = "none"
            BYID("main_config").style.display = "block"
        },1500)


    }
    if (data.type === "saved_config") {
        setTimeout(function (){
            BYID("loading_div").style.display = "none"
            BYID("config_saved").style.display = "block"
        },1500)

    }
}

window.addEventListener('DOMContentLoaded', () => {

    lsapi.send("config_window",{ type:"request_current_config" })
})
