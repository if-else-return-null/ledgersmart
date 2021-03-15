
BYID("main_tab_btn_overview").addEventListener('click', showMainWorkarea )
BYID("main_tab_btn_transaction").addEventListener('click', showMainWorkarea )
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

//BYID("login_user_list_password_input").addEventListener('keyup', checkInputEnterKey )
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
//BYID("login_user_list_attempt_btn").addEventListener("click", requestAttemptLogin);
BYID("login_user_text_attempt_btn").addEventListener("click", requestAttemptLogin);
BYID("login_user_info_name").addEventListener("change", handleUserNameInputChange);
BYID("login_user_info_pass").addEventListener("change", handlePasswordInputChange);

// settings:data listeners
BYID("data_store_new_create_button").addEventListener('click', requestCreateDataStore )
BYID("data_store_change_button").addEventListener('click', changeActiveDataStore )


let list_edit_buttons = document.getElementsByClassName("list_edit_button");
for (var i = 0; i < list_edit_buttons.length; i++) {
    list_edit_buttons[i].addEventListener("click", clickListEditButton);
}


BYID("data_store_new_department_create_button").addEventListener('click', createDataStoreDepartment )
BYID("data_store_new_account_create_button").addEventListener('click', createDataStoreAccount )
BYID("data_store_new_category_create_button").addEventListener('click', createDataStoreCategory )

BYID("toggle_server_broadcast_user_btn").addEventListener('click', toggleServerBroadcastUsers )
//BYID("debug_get_info_btn").addEventListener('click', requestDebugInfo )


BYID("settings_user_remember_user").addEventListener('click', updateRememberSetting )
BYID("settings_user_remember_password").addEventListener('click', updateRememberSetting )

// edit modal listeners
let edit_modal_buttons = document.getElementsByClassName("edit_modal_button");
for (var i = 0; i < edit_modal_buttons.length; i++) {
    edit_modal_buttons[i].addEventListener("click", clickEditModalButton);
}

// new transaction listeners

let transaction_new_tag_btns = document.getElementsByClassName("transaction_new_tag_btns");
for (var i = 0; i < transaction_new_tag_btns.length; i++) {
    transaction_new_tag_btns[i].addEventListener("click", clickTransactionSetTag);
}
form.tnew.change_sign.addEventListener("click", transactionChangeSign);
BYID("transaction_new_button_post").addEventListener("click", postNewTransaction);
BYID("transaction_new_button_clear").addEventListener("click", clearTrasactionForm);
BYID("transaction_new_button_split").addEventListener("click", startTrasactionSplit);

window.addEventListener('contextmenu', (event) => {
      //event.preventDefault();
      console.log("contextmenu", event);
      //x = event.x;
      //y = event.y;
      //menu.popup(event.x, event.y);
      //return false;
    });

function checkLocalStorage(){

    console.log("Checking localStorage");
    if (localStorage.getItem("last_user")){

        STATE.last_user = JSON.parse(localStorage.getItem("last_user"))
    }
    if (localStorage.getItem("local_users")){
        STATE.local_users = JSON.parse( localStorage.getItem("local_users") )
    }

    if (STATE.user !== null) {

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

window.addEventListener('DOMContentLoaded', () => {
    // display initial wotktab views
    switchTabs("main_tab_btn_overview", "main_tab_overview")
    clickWorkTabButton("mt_btn_overview_main")
    clickWorkTabButton("mt_btn_transaction_income")
    clickWorkTabButton("mt_btn_reports_main")
    clickWorkTabButton("mt_btn_settings_data")
    checkLocalStorage()
    lsapi.send("client_window",{ type:"request_current_config" })
})
