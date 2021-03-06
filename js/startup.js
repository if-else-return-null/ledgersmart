
BYID("main_tab_btn_overview").addEventListener('click', showMainWorkarea )
BYID("main_tab_btn_addedit").addEventListener('click', showMainWorkarea )
BYID("main_tab_btn_reports").addEventListener('click', showMainWorkarea )
BYID("main_tab_btn_settings").addEventListener('click', showMainWorkarea )

BYID("view_tabs_list_cont").addEventListener('click', showTabWorkarea )

// connection lost listeners
BYID("reconnect_btn").addEventListener('click', tryConnect )

BYID("conn_lost_server_ip_input").addEventListener('change', function(event){
    config.ls.client_ip = BYID("conn_lost_server_ip_input").value
    if ( BYID("save_conn_changes").checked === true  ) {
        //*** request saveconfig to main process
    }
})
BYID("conn_lost_server_port_input").addEventListener('change', function(event){
    config.ls.client_port = BYID("conn_lost_server_port_input").value
    if ( BYID("save_conn_changes").checked === true  ) {
        //*** request saveconfig to main process
    }
})

// input text listeners

BYID("login_user_list_password_input").addEventListener('keyup', checkInputEnterKey )
BYID("login_user_info_pass").addEventListener('keyup', checkInputEnterKey )
BYID("login_user_info_pass_repeat").addEventListener('keyup', checkInputEnterKey )


// theme listeners
let root = document.documentElement;

let color_pickers = document.getElementsByClassName("color_picker_input");
for (var i = 0; i < color_pickers.length; i++) {
    color_pickers[i].addEventListener("input", updateThemeColor);
}

// menu and main button listeners
let window_buttons = document.getElementsByClassName("window_btn");
for (var i = 0; i < window_buttons.length; i++) {
    window_buttons[i].addEventListener("click", handleWindowButton);
}

let app_menus = document.getElementsByClassName("app_menu");
for (var i = 0; i < app_menus.length; i++) {
    app_menus[i].addEventListener("click", toggleAppMenu);
    app_menus[i].addEventListener("mouseleave", closeAppMenu);

    STATE.appmenu[app_menus[i].id] = { visible:false }
}
let app_menu_items = document.getElementsByClassName("app_menu_item");
for (var i = 0; i < app_menu_items.length; i++) {
    app_menu_items[i].addEventListener("click", clickAppMenuItem);

}

// work tab listeners

let maintab_buttons = document.getElementsByClassName("maintab_top_panel_btn");
for (var i = 0; i < maintab_buttons.length; i++) {
    maintab_buttons[i].addEventListener("click", clickWorkTabButton);

}

// user login/create listeners

BYID("login_user_create_start_btn").addEventListener('click', showCreateUser )
BYID("login_user_create_cancel_btn").addEventListener('click', function(){
    resetUserLoginScreen(false)
})

BYID("login_user_create_attempt_btn").addEventListener('click', requestCreateUser )

BYID("login_user_list").addEventListener("click", selectUserTile);
BYID("login_user_list_attempt_btn").addEventListener("click", requestAttemptLogin);
BYID("login_user_text_attempt_btn").addEventListener("click", requestAttemptLogin);
BYID("login_user_info_name").addEventListener("change", handleUserNameInputChange);


// settings:data listeners
BYID("data_store_new_create_button").addEventListener('click', requestCreateDataStore )
BYID("toggle_server_broadcast_user_btn").addEventListener('click', toggleServerBroadcastUsers )
BYID("debug_get_info_btn").addEventListener('click', requestDebugInfo )


let remember_checkbox = document.getElementsByClassName("remember_checkbox");
for (var i = 0; i < remember_checkbox.length; i++) {
    remember_checkbox[i].addEventListener("click", updateRememberSetting);
}



window.addEventListener('contextmenu', (event) => {
      //event.preventDefault();
      console.log("contextmenu", event);
      //x = event.x;
      //y = event.y;
      //menu.popup(event.x, event.y);
      //return false;
    });

function checkLocalStorage(){
    //*** add check for autologin info
    console.log("Checking localStorage");
    if (localStorage.getItem("last_user")){
        STATE.user = localStorage.getItem("last_user")
    }

    if (STATE.user !== null) {
        parseRemember()
    }
    // now check for autologin overrides
    if (localStorage.getItem("autologin")){
        let autodata = localStorage.getItem("autologin")
        STATE.user = autodata.user
        STATE.password = autodata.password
        STATE.dsid = autodata.dsid
        STATE.autologin = true
        // remove autologin
        localStorage.removeItem("autologin")

    }

}

function parseRemember() {

    let key = "remember_"+STATE.user
    if (localStorage.getItem(key)){
        let data = JSON.parse( localStorage.getItem(key) )
        console.log("datakey",data);
        STATE.remember = data.remember
        if (STATE.remember.user === true) {
            //*** maybe nothing to do here

        }
        if (STATE.remember.password === true) {
            STATE.password = data.info.password
            BYID("login_user_info_pass").value = STATE.password
            BYID("login_user_list_password_input").value = STATE.password
        }

        STATE.dsid = data.info.dsid
        setRememberCheckBoxes()
    } else {
        resetRemember()
    }
    // setup checkboxes


}

function resetRemember() {
    STATE.remember = { user:false, password:false }
    STATE.password = null
    STATE.dsid = null
    BYID("login_user_info_pass").value = ""
    BYID("login_user_list_password_input").value = ""
    setRememberCheckBoxes()
}

function setRememberCheckBoxes() {
    for (var i = 0; i < remember_checkbox.length; i++){
        let box = remember_checkbox[i].id.split("_").pop()
        if ( STATE.remember[box] === true ) {
            remember_checkbox[i].checked = true
        } else {
            remember_checkbox[i].checked = false
        }
    }
}

function saveLocalStorage(type, value){
    console.log("save localStorage ", type,value);
    if (typeof(value) === "string") {
        localStorage.setItem(type, value)
    } else {
        localStorage.setItem(type, JSON.stringify(value))
    }

}

function saveRemember(){
    let key = "remember_"+STATE.user
    let data = { remember:STATE.remember, info:{} }
    if (STATE.remember.user === true) {
        data.info.user = STATE.user
        saveLocalStorage("last_user", STATE.user )
    }
    if (STATE.remember.password === true) { data.info.password = STATE.password }
    data.info.dsid = STATE.dsid
    console.log("saveRemember",key,data);
    saveLocalStorage(key,data)
}

window.addEventListener('DOMContentLoaded', () => {
    // display initial wotktab views
    switchTabs("main_tab_btn_overview", "main_tab_overview")
    clickWorkTabButton("mt_btn_overview_main")
    clickWorkTabButton("mt_btn_addedit_main")
    clickWorkTabButton("mt_btn_reports_main")
    clickWorkTabButton("mt_btn_settings_data")
    checkLocalStorage()
    lsapi.send("client_window",{ type:"request_current_config" })
})
