function showMainWorkarea(event) {
    let btn_id, tab_id
    if (typeof(event) === "string") {
        btn_id = event
    } else {
        btn_id = event.target.id
    }
    console.log("click", event.target.id);
    tab_id = btn_id.replace("main_btn_", "main_tab_")
    switchTabs(btn_id, tab_id)

}

function showTabWorkarea(event) {
    let btn_id, tab_id
    if (typeof(event) === "string") {
        btn_id = event
    } else {
        btn_id = event.target.id
    }
    console.log("click", event.target.id);

    if (btn_id === "view_tabs_list_cont") { return; }
    tab_id = btn_id.replace("tab_btn_", "work_tab_")
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


function showModal(modal_id) {
    let elems = document.getElementsByClassName("modal_tab");
    for (var i = 0; i < elems.length; i++) {
        elems[i].style.display = "none"
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

//----------------------------app menus--------------------------------------

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
    if (item_id === "app_menu_file_load") {

    }
    if (item_id === "app_menu_file_load") {

    }

}



//-------------------------THEME----------------------------------------------
function updateThemeColor(event, value = null) {
    let css_id
    if (typeof(event) === "string") {
        css_id = event
    } else {
        css_id = event.target.id
    }
    console.log("input", css_id);
    if (value === null){
         value = BYID(css_id).value
    }

    css_id = "--" + css_id.replace("color_picker_", "")

    root.style.setProperty(css_id, value);
}

//------------------------worktab top panel------------------------------------
function workTabActions(info) {
    function clearViews(tabname){ // hide all of this worktabs views
        let views = BYID("main_tab_"+tabname).getElementsByClassName("worktab_view");
        for (var i = 0; i < views.length; i++) {
            views[i].style.display = "none"
        }
    }

    if (info[0] === "settings"){
        clearViews(info[0])
        BYID("wt_view_"+info[0]+"_"+info[1]).style.display = "block"
    }
    if (info[0] === "overview"){
        clearViews(info[0])
        BYID("wt_view_"+info[0]+"_"+info[1]).style.display = "block"
    }
    if (info[0] === "addedit"){
        clearViews(info[0])
        BYID("wt_view_"+info[0]+"_"+info[1]).style.display = "block"
    }
    if (info[0] === "reports"){
        clearViews(info[0])
        BYID("wt_view_"+info[0]+"_"+info[1]).style.display = "block"
    }
}


function clickWorkTabButton(event) {
    let item_id
    if (typeof(event) === "string") {
        item_id = event
    } else {
        item_id = event.target.id
    }

    let info = item_id.replace("wt_btn_", "").split("_")
    console.log("worktab_top_panel_btn click", info);
    workTabActions(info)

}
