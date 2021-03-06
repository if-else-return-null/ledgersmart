
//---------------------------worktab controls----------------------------------
function showMainWorkarea(event) {
    let btn_id, tab_id
    if (typeof(event) === "string") {
        btn_id = event
    } else {
        btn_id = event.target.id
    }
    console.log("click", event.target.id);
    tab_id = btn_id.replace("main_tab_btn_", "main_tab_")
    switchTabs(btn_id, tab_id)

}

function showTabWorkarea(event) {
    let btn_id, tab_id
    if (typeof(event) === "string") {
        btn_id = event
    } else {
        btn_id = event.target.id
    }
    console.log("click", btn_id);

    if (btn_id === "view_tabs_list_cont") { return; }
    tab_id = btn_id.replace("view_tab_btn_", "view_tab_")
    switchTabs(btn_id, tab_id)
}

function switchTabs(btn_id, tab_id) {
    BYID(STATE.active_tab_info.btn_id).classList.remove("button_active")
    BYID(STATE.active_tab_info.tab_id).style.display = "none"
    STATE.active_tab_info.btn_id = btn_id
    STATE.active_tab_info.tab_id = tab_id
    BYID(STATE.active_tab_info.btn_id).classList.add("button_active")
    BYID(STATE.active_tab_info.tab_id).style.display = "block"
}

//--------------------------------modal control--------------------------------
function showModal(modal_id, html = null) {
    let elems = document.getElementsByClassName("modal_tab");
    for (var i = 0; i < elems.length; i++) {
        elems[i].style.display = "none"
    }
    if (html !== null){
        BYID(modal_id).innerHTML = html
    }
    BYID(modal_id).style.display = "block"
    BYID('modal_cont').style.display = "block"
}

function hideModal() {

    BYID('modal_cont').style.display = "none"
}

//-----------------------window buttons----------------------------------------
// minimum/maximize/close
function handleWindowButton(event) {
    let btn_id
    if (typeof(event) === "string") {
        btn_id = event
    } else {
        btn_id = event.target.id
    }
    console.log("win-button", btn_id);
    lsapi.send("client_window",{type:"window_button", button:btn_id})
}

//----------------------------app menu--------------------------------------

function toggleAppMenu(event) {
    let valid_ids = ["app_menu_file","app_menu_window"]
    let menu_id
    if (typeof(event) === "string") {
        menu_id = event
    } else {
        menu_id = event.target.id
    }
    if (!valid_ids.includes(menu_id)){ return;}
    //console.log("appmenu click", menu_id);
    if (STATE.appmenu[menu_id].visible === false ) {
        BYID(menu_id).classList.add("app_menu_active")
        STATE.appmenu[menu_id].visible = true
    } else {
        BYID(menu_id).classList.remove("app_menu_active")
        STATE.appmenu[menu_id].visible = false
    }
}

function closeAppMenu(event) {
    let valid_ids = ["app_menu_file","app_menu_window"]
    let menu_id
    if (typeof(event) === "string") {
        menu_id = event
    } else {
        menu_id = event.target.id
    }
    if (!valid_ids.includes(menu_id)){ return;}
    //console.log("appmenu close", menu_id);
    BYID(menu_id).classList.remove("app_menu_active")
    STATE.appmenu[menu_id].visible = false
}

function clickAppMenuItem(event) {
    let item_id
    if (typeof(event) === "string") {
        item_id = event
    } else {
        item_id = event.target.id
    }

    console.log("appmenuitem click", item_id);
    // window
    if (item_id === "app_menu_window_new" ){
        //*** eventually this should include a method to auto log into current user
        // maybe through the use of a localStorage item

        lsapi.send("client_window",{type:"request_new_window"})
    }

    if (item_id === "app_menu_window_logout" ){
        
        window.location.reload()
    }
    if (item_id === "app_menu_window_close" ){
        lsapi.send("client_window",{type:"window_button", button:"win_close"})
    }
    // tools
    if (item_id === "app_menu_file_load" || item_id === "app_menu_file_new") {
        switchTabs("main_tab_btn_settings", "main_tab_settings")
        clickWorkTabButton("mt_btn_settings_data")
    }
    if (item_id === "app_menu_window_devtool" ){
        lsapi.send("client_window",{type:"window_button", button:"win_devtools"})
    }
    if (item_id === "app_menu_app_reload" ){
        window.location.reload()
    }

    closeAppMenu("app_menu_file")

}




//------------------------main tab top panel------------------------------------
// this is for divs with id=main_tabs_* only.
//*** divs with id=view_tab_* will eventually have a similar interface
function clickWorkTabButton(event) {
    let item_id
    if (typeof(event) === "string") {
        item_id = event
    } else {
        item_id = event.target.id
    }

    let info = item_id.replace("mt_btn_", "").split("_")
    console.log("maintab_top_panel_btn click", info);
    workTabActions(info)

}

//
function workTabActions(info) {
    function clearViews(tabname){ // hide all of this worktabs views
        let views = BYID("main_tab_"+tabname).getElementsByClassName("worktab_view");
        for (var i = 0; i < views.length; i++) {
            views[i].style.display = "none"
        }
    }
    //*** the actions below will likely change as the code progresses
    if (info[0] === "settings"){
        clearViews(info[0])
        BYID("mt_view_"+info[0]+"_"+info[1]).style.display = "block"
    }
    if (info[0] === "overview"){
        clearViews(info[0])
        BYID("mt_view_"+info[0]+"_"+info[1]).style.display = "block"
    }
    if (info[0] === "addedit"){
        clearViews(info[0])
        BYID("mt_view_"+info[0]+"_"+info[1]).style.display = "block"
    }
    if (info[0] === "reports"){
        clearViews(info[0])
        BYID("mt_view_"+info[0]+"_"+info[1]).style.display = "block"
    }
}

//---------------------misc controls--------------------------------------
function checkInputEnterKey(event) {
    if(event.key === 'Enter') {
        console.log("enter key pressed", event.target.id);
        if (event.target.id === "login_user_list_password_input"){
            requestAttemptLogin("login_user_list_attempt_btn")
        }
        else if (event.target.id === "login_user_info_pass"){
            if (STATE.create_user_visible === false) {
                requestAttemptLogin("login_user_text_attempt_btn")
            }

        }
        else if (event.target.id === "login_user_info_pass_repeat") {
            requestCreateUser()
        }
        else {
            // do nothing
        }

    }
}
