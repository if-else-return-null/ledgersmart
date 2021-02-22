let main_radio = document.getElementsByName('appmode');
let BYID = function (id){ return document.getElementById(id) }
let config
window.addEventListener('DOMContentLoaded', () => {

    ipcSend("config_window",{ type:"request_current_config" })
})
// serverRestrict
BYID("server_local_only").addEventListener('change', () => {
    config.serverRestrict = true
    config.server_ip = "127.0.0.1"
})
BYID("server_network_wide").addEventListener('change', () => {
    config.serverRestrict = false
    config.server_ip = "0.0.0.0"
})
BYID("server_port").addEventListener('change', () => {
    config.server_port = BYID("server_port").value
    // add checks or min max for port numver
})
// clinet ip/port
BYID("client_server_ip").addEventListener('change', () => {
    config.client_ip = BYID("client_server_ip").value
    // add checks or min max for port numver
})
BYID("client_server_port").addEventListener('change', () => {
    config.client_port = BYID("client_server_port").value
    // add checks or min max for port numver
})


//save/cancel
BYID("save_config").addEventListener('click', () => {
    BYID("loading_div").style.display = "block"
    BYID("main_config").style.display = "none"
    ipcSend("config_window",{ type:"save_config", config:config })
})

BYID("cancel_config").addEventListener('click', () => {
    ipcSend("config_window",{ type:"cancel_config" })
})

BYID("close_config").addEventListener('click', () => {
    window.close()
})

for (var i = 0; i < main_radio.length; i++) {
    main_radio[i].addEventListener("change", handleMainRadio)
}




function handleMainRadio(ev) {
    console.log("main_radio", ev.target.id);
    let mode = ev.target.id
    if (mode === "use_as_both") {
        config.appmode = "both"
        BYID("server_options").style.display = "block"
        BYID("client_connect_options").style.display = "none"
    }
    if (mode === "use_as_server") {
        config.appmode = "server"
        BYID("server_options").style.display = "block"
        BYID("client_connect_options").style.display = "none"
    }
    if (mode === "use_as_client") {
        config.appmode = "client"
        BYID("server_options").style.display = "none"
        BYID("client_connect_options").style.display = "block"
    }
}


function handleFromMainProcess(data) {
    console.log("from_mainProcess",data);
    if (data.type === "current_config") {
        config = data.config
        if (config.appmode !== "ask") {
            BYID("use_as_" + config.appmode).checked = true


        } else {
            // default to both
            config.appmode = "both"
            BYID("use_as_both").checked = true
            BYID("server_options").style.display = "block"
        }

        if (config.serverRestrict === true) {
            BYID("server_local_only").checked = true
        } else {
            BYID("server_network_wide").checked = true
        }

        BYID("server_port").value = config.server_port
        BYID("client_server_ip").value = config.client_ip
        BYID("client_server_port").value = config.client_port

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
