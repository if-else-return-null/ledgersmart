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
    console.log("requestDebugInfo ", name);
    conn.send( JSON.stringify({type:"debug_info", name:name  }) )
}

function handleDebugInfoResponce(data){
    console.log("DEBUG:",data.name);
    console.log( JSON.parse(data.item) );
}

function updateDebugList(list) {
    let buttonstr = ``
    list.forEach((item, i) => {
        buttonstr += `<button class="debug_object_button" type="button" id="debug_object_button_${item}">${item}</button><br>`
    });
    BYID("debug_object_button_area").innerHTML = buttonstr
    let debug_object_button = document.getElementsByClassName("debug_object_button");
    for (var i = 0; i < debug_object_button.length; i++) {
        debug_object_button[i].addEventListener("click", requestDebugInfo);
    }


}

//----------------------settings data store------------------------------------------
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

// add or remove items from the datastore_list
//*** maybe add a check  that we
function handleDataStoreListEdit(data) {
    console.log("handleDataStoreListEdit", data);
    if (data.subtype === "add"){
        STATE.datastore_list.name.push(data.name)
        STATE.datastore_list.id.push(data.id)
    }
    if (data.subtype === "remove"){
        // a data store was deleted by another client
        // check that we're not removing the active dsid for this window
        if (data.id === STATE.dsid) {
            // logout the window
            clickAppMenuItem("app_menu_window_logout")
            return;
        }
        let i = STATE.datastore_list.id.indexOf(data.id)
        STATE.datastore_list.name.splice(i,1)
        STATE.datastore_list.id.splice(i,1)
    }
    updateDataStoreList()

}

function resetCreateDataStore(){
    BYID("data_store_new_name_warning").innerHTML = "&nbsp;"
    BYID("data_store_new_name").value = ""
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
    conn.send( JSON.stringify({type:"datastore_create", name:storename }) )
    // on success the server will send a client_init packet with the new store
    // there can be no failure so clear the input
    resetCreateDataStore()
}

// this function will have to update all the selectors,lists, etc.
// for account/category/department
function setActiveDataStore(){
    console.log("setActiveDataStore", STATE.dsid);
    // departments
    updateDepartmentList()

}

function changeActiveDataStore(){
    let new_dsid = BYID("data_store_selector").value
    console.log("new_dsid", new_dsid);
    showModal("modal_dynamic", "<h2>Requesting change active data store</h2>")
    conn.send( JSON.stringify({type:"datastore_change", dsid:new_dsid }) )
}


//---------create/modify/delete --> account/category/department----------------
//console.log("queryselect", document.querySelector('input[name="data_store_new_account_type"]:checked').value);

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

//-------------CREATE
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


//--------------------
function handleUpdateDataStoreDepartment(data) {
    if ( data.success === true ){
        if (data.dsid === STATE.dsid){
            STATE.storeinfo.department[data.uuid] = cloneObj(data.dsitem)
            updateDepartmentList()
        } else {
            console.log("handleUpdateDataStoreDepartment not needed ", data);
        }
    } else {
        console.log("handleUpdateDataStoreDepartment FAILED ", data);
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



// -------------------gui updates for account/category/department--------------
let gui_temps = {}
gui_temps.department_item_card = `
    <div class="item_card item_card_clickable icc_department" id="ds_edit_department_thisdept.id">
    thisdept.name <hr>
    Sort: thisdept.sort | Active: thisdept.active<br>
    Creator: thisdept.createdBy
    </div>

`

function updateDepartmentList() {
    BYID("data_store_new_department_name").value = ""
    let html_sel_active = "" // selector string
    let html_sel_all = "" // selector string
    let html_edit = "" // clickable item card

    for (let dept in STATE.storeinfo.department) {
        let thisdept = STATE.storeinfo.department[dept]
        // select inputs
        if (thisdept.active === true){
            html_sel_active +=`<option value="${dept}" >${thisdept.name}</option> `
        }
        html_sel_all +=`<option value="${dept}" >${thisdept.name}</option> `
        // list_edit item card

        let temp_html = gui_temps.department_item_card.replace(/thisdept.id/g , dept )
        temp_html = temp_html.replace(/thisdept.name/g, thisdept.name )
        temp_html = temp_html.replace(/thisdept.sort/g, thisdept.sort )
        temp_html = temp_html.replace(/thisdept.active/g, thisdept.active )
        temp_html = temp_html.replace(/thisdept.createdBy/g, thisdept.createdBy )
        html_edit += temp_html


    }

    BYID("list_edit_table_area_department").innerHTML = html_edit
    // add edit listeners
    let icc_department = document.getElementsByClassName("icc_department");
    for (var i = 0; i < icc_department.length; i++) {
        console.log("adding listener");
        icc_department[i].addEventListener("click", clickItemCard);
    }
    // find and fill any html select elements
    BYID("transaction_new_input_department").innerHTML = html_sel_active
}



//-----------------------EDIT  account/category/department

function clickItemCard(event){
    let row_id
    if (typeof(event) === "string") { row_id = event }
    else { row_id = event.target.id }
    let split = row_id.split("_")
    let type = split[2]
    let id = split[3]
    console.log("clickItemCard" , type, id);
    // show an edit box with row information from STATE.storeinfo
    // hide all edit_modal_tab first
    let elems = document.getElementsByClassName("edit_modal_tab");
    for (var i = 0; i < elems.length; i++) {
        elems[i].style.display = "none"
    }
    BYID(`edit_modal_tab_${type}`).style.display = "block"
    // now update the input field values
    if (type === "department") {
        BYID(`em_department_id`).value = id
        BYID(`em_department_name`).value = STATE.storeinfo.department[id].name
        BYID(`em_department_sort`).value = STATE.storeinfo.department[id].sort
        BYID(`em_department_active`).checked = STATE.storeinfo.department[id].active
        BYID(`em_department_createdby`).textContent = STATE.storeinfo.department[id].createdBy
        BYID(`em_department_createdat`).textContent = STATE.storeinfo.department[id].createdAt
        BYID(`em_department_changedby`).textContent = STATE.storeinfo.department[id].lastChangedBy
        BYID(`em_department_changedat`).textContent = STATE.storeinfo.department[id].lastChangedAt
        BYID("em_name_department_warning").innerHTML = ""
        if (STATE.storeinfo.department[id].tcount === 0) {
            BYID(`em_delete_area_department`).style.display = "block"
        } else {
            BYID(`em_delete_area_department`).style.display = "none"
        }
    }


    showModal("modal_edit_screen")

}

//-------------------------------settings EDIT MODAL--------------------------------
function deleteDataStoreItem(type) {
    let uuid
    if (type === "department") {
        uuid = BYID("em_department_id").value
    }
    if (type === "account") {
        uuid = BYID("em_account_id").value
    }
    if (type === "category") {
        uuid = BYID("em_category_id").value
    }
    conn.send( JSON.stringify({type:"datastore_delete_item", uuid:uuid, itemtype:type }) )
}

function handleDeleteDataStoreItem(data){
    console.log("handleDeleteDataStoreItem" , data);
}


function clickEditModalButton(event) {
    let but_id
    if (typeof(event) === "string") { but_id = event }
    else { but_id = event.target.id }
    let split = but_id.split("_")
    let type = split[2]
    let action = split[3]
    console.log("clickEditModalButton" , type, action);
    if (action === "cancel") {
        hideModal()
        return;
    }
    if (action === "delete") {
        deleteDataStoreItem(type)
    }
    if (action === "save" && type === "department") {
        if (createOK() === false ) {
            BYID("em_name_department_warning").innerHTML = "Action not permitted"
            return;
        }
        let dept_id = BYID("em_department_id").value
        let dsitem = cloneObj(STATE.storeinfo.department[dept_id])
        dsitem.name = BYID("em_department_name").value.trim()
        dsitem.sort = BYID("em_department_sort").value
        dsitem.active = BYID("em_department_active").checked
        conn.send( JSON.stringify({type:"datastore_update_department", uuid:dept_id, dsitem:dsitem }) )
        hideModal()
    }
    if (action === "save" && type === "account") {
        
    }
    if (action === "save" && type === "category") {

    }
}






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
