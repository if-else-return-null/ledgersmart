
BYID("main_btn_overview").addEventListener('click', showMainWorkarea )
BYID("main_btn_addedit").addEventListener('click', showMainWorkarea )
BYID("main_btn_reports").addEventListener('click', showMainWorkarea )
BYID("main_btn_settings").addEventListener('click', showMainWorkarea )

BYID("view_tabs_list_cont").addEventListener('click', showTabWorkarea )

// connection lost listeners
BYID("reconnect_btn").addEventListener('click', tryConnect )

BYID("conn_lost_server_ip_input").addEventListener('change', function(event){
    config.client.client_ip = BYID("conn_lost_server_ip_input").value
    if ( BYID("save_conn_changes").checked === true  ) {
        //*** request saveconfig to main process
    }
})
BYID("conn_lost_server_port_input").addEventListener('change', function(event){
    config.client.client_port = BYID("conn_lost_server_port_input").value
    if ( BYID("save_conn_changes").checked === true  ) {
        //*** request saveconfig to main process
    }
})

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

let worktab_buttons = document.getElementsByClassName("worktab_top_panel_btn");
for (var i = 0; i < worktab_buttons.length; i++) {
    worktab_buttons[i].addEventListener("click", clickWorkTabButton);

}


window.addEventListener('contextmenu', (event) => {
      //event.preventDefault();
      console.log("contextmenu", event);
      //x = event.x;
      //y = event.y;
      //menu.popup(event.x, event.y);
      //return false;
    });

window.addEventListener('DOMContentLoaded', () => {
    lsapi.send("client_window",{ type:"request_current_config" })
})

// display initial wotktab views
switchTabs("main_btn_overview", "main_tab_overview")
clickWorkTabButton("wt_btn_overview_main")
clickWorkTabButton("wt_btn_addedit_main")
clickWorkTabButton("wt_btn_reports_main")
clickWorkTabButton("wt_btn_settings_data")
