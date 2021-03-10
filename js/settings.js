//----------------------settings general------------------------------------------
function updateRememberSetting(event, request_value = null){
    if (STATE.user === null) {
        event.preventDefault()
        return
    }
    let box_id
    if (typeof(event) === "string") {
        box_id = event
    } else {
        box_id = event.target.id
    }
    let box = box_id.split("_").pop()
    let value = BYID(box_id).checked
    if (request_value !== null){
        value = request_value
    }

    console.log("updateRememberSetting click", box , value);
    BYID(box_id).checked = value
    if (box === "user") {
        let list_id = STATE.local_users.list.indexOf(STATE.user)
        if (value === true) { // remember user
            if (list_id === -1) { STATE.local_users.list.push(STATE.user) }
            STATE.last_user.value = STATE.user
            saveLocalStorage("last_user", STATE.last_user )
        } else {// forget user
            if (list_id !== -1) { let forgot = STATE.local_users.list.splice(list_id,1) }
            STATE.last_user.value = null
            saveLocalStorage("last_user", STATE.last_user )

        }
    }
    if (box === "password") {
        if (value === true){
            STATE.local_users.info[STATE.user] = { password:STATE.password, dsid:STATE.dsid }
        } else {
            STATE.local_users.info[STATE.user] = { password:false, dsid:STATE.dsid }
        }
    }

    saveLocalStorage("local_users", STATE.local_users)

}
//--------------debug/server
function toggleServerBroadcastUsers(){
    conn.send( JSON.stringify({type:"toggle_broadcast_users" }) )
}

function requestDebugInfo(event){
    let name
    if (typeof(event) === "string" ){
        name = event
    } else {
        name = event.target.id.split("_").pop()
    }

    conn.send( JSON.stringify({type:"debug_info", name:name  }) )
}

function handleDebugInfoResponce(data){
    console.log("DEBUG:",data.name);
    console.log(data.item);
}

function updateDebugList(list) {
    let buttonstr = ``
    list.forEach((item, i) => {
        buttonstr += `<button class="debug_object_button" type="button" id="debug_object_button_${item}">${item}</button><br>`
    });
    BYID("debug_object_button_area").innerHTML = buttonstr
    let debug_object_button = document.getElementsByClassName("debug_object_button");
    for (var i = 0; i < list_edit_buttons.length; i++) {
        debug_object_button[i].addEventListener("click", requestDebugInfo);
    }
}

//----------------------settings data------------------------------------------
function updateDataStoreList(){
    let list = STATE.datastore_list
    let htmlstr = ""


    console.log("updaing store lists ");
    if (list.id.length === 0 ) {
        // no stores available
        BYID("data_store_selector_warning").innerHTML = "No data stores on server.<br>"
        BYID("data_store_active_display").innerHTML = "NONE"

    } else {
        list.id.forEach((item, i) => {
            htmlstr += `<option id="ds_opt_${item}" value="${item}">${list.name[i]}</option>`
        });
        BYID("data_store_selector").innerHTML = htmlstr
        // check for and select dsid
        if (STATE.dsid !== null) {
            BYID(`ds_opt_${STATE.dsid}`).selected = true
            BYID("data_store_active_display").innerHTML = list.name[list.id.indexOf(STATE.dsid)]
            BYID("data_store_selector_warning").innerHTML = ""
        } else {
            BYID("data_store_active_display").innerHTML = "NONE"
            BYID("data_store_selector_warning").innerHTML = "No data store selected.<br>"
        }

    }

}

function resetCreateDataStore(){
    BYID("data_store_new_name_warning").innerHTML = "&nbsp;"
}

function requestCreateDataStore(){
    let storename = BYID("data_store_new_name").value.trim()
    let requestOK = true
    if (storename === "" ) {
        BYID("data_store_new_name_warning").innerHTML = "Name required"
        requestOK = false
    }
    if ( STATE.datastore_list.name.includes(storename) ) {
        BYID("data_store_new_name_warning").innerHTML = "Name already exists"
        requestOK = false
    }
    if (requestOK === false) { return;}
    showModal("modal_dynamic", "<h2>Requesting new data store</h2>")
    conn.send( JSON.stringify({type:"datastore_create", name:storename, uuid:generateUUIDv4() }) )
    // on success the server will send a client_init packet with the new store
}

function setActiveDataStore(){
    console.log("setActiveDataStore", STATE.dsid);

}

function changeActiveDataStore(){
    let new_dsid = BYID("data_store_selector").value
    console.log("new_dsid", new_dsid);
    showModal("modal_dynamic", "<h2>Requesting change active data store</h2>")
    conn.send( JSON.stringify({type:"datastore_change", dsid:new_dsid }) )
}

console.log("queryselect", document.querySelector('input[name="data_store_new_account_type"]:checked').value);

// check if user is allowed to create create/modify/delete --> account/category/department
// these permissions will be checked again on the server to counter a user altering STATE
function createOK() {
    let ok = true
    if (STATE.dsid === null || STATE.storeinfo === null) { ok = false }
    if ( STATE.user !== STATE.storeinfo.owner ){
        if (!STATE.storeinfo.creators.includes(STATE.user)) { ok = false } //*** maybe display warning
    }
    if (STATE.isRoot === true) { ok = true }
    return ok
}


function createDataStoreDepartment() {
    if (createOK() === false ) { return; }
    let name = BYID("data_store_new_department_name").value
    conn.send( JSON.stringify({type:"datastore_update_department", uuid:"new", name:name }) )
}

function createDataStoreAccount() {
    if (createOK() === false ) { return; }
    let name = BYID("data_store_new_account_name").value
    let accttype = document.querySelector('input[name="data_store_new_account_type"]:checked').value;
    conn.send( JSON.stringify({type:"datastore_update_account", uuid:"new", name:name , atype: accttype   }) )

}
function createDataStoreCategory() {
    if (createOK() === false ) { return; }
    let name = BYID("data_store_new_account_name").value
    let cattype = document.querySelector('input[name="data_store_new_category_type"]:checked').value;
    conn.send( JSON.stringify({type:"datastore_update_category", uuid:"new", name:name , ctype: cattype  }) )
}

function handleUpdateDataStoreDepartment(data) {
    if ( data.success === false ){

    } else {

    }
}
function handleUpdateDataStoreAccount(data) {
    if ( data.success === false ){

    } else {

    }
}
function handleUpdateDataStoreCategory(data) {
    if ( data.success === false ){

    } else {

    }
}

//-------------------------------settings users--------------------------------







//-------------------------------settings theme--------------------------------

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
