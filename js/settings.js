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
    updateAccountList()
    updateCategoryList()

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
    let name = BYID("data_store_new_category_name").value
    let cattype = document.querySelector('input[name="data_store_new_category_type"]:checked').value;
    let parent_id = null
    let sub_check = BYID("data_store_new_category_parent_checkbox").checked
    if (sub_check === true) { parent_id = BYID("data_store_new_category_parent").value  }
    conn.send( JSON.stringify({type:"datastore_update_category", uuid:"new", name:name , ctype: cattype , parent: parent_id }) )
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
    if ( data.success === true ){
        if (data.dsid === STATE.dsid){
            STATE.storeinfo.account[data.uuid] = cloneObj(data.dsitem)
            updateAccountList()
        } else {
            console.log("handleUpdateDataStoreAccount not needed ", data);
        }
    } else {
        console.log("handleUpdateDataStoreAccount FAILED ", data);
    }
}
function handleUpdateDataStoreCategory(data) {
    if ( data.success === true ){
        if (data.dsid === STATE.dsid){
            STATE.storeinfo.category[data.uuid] = cloneObj(data.dsitem)
            updateCategoryList()
        } else {
            console.log("handleUpdateDataStoreCategory not needed ", data);
        }
    } else {
        console.log("handleUpdateDataStoreCategory FAILED ", data);
    }
}



// -------------------gui updates for account/category/department--------------
let gui_temps = {}
gui_temps.department_item_card = `
    <div class="item_card item_card_clickable icc_department" id="ds_edit_department_thisdept.id">
    thisdept.name <hr>
    Active: thisdept.active<br>
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
        //temp_html = temp_html.replace(/thisdept.sort/g, thisdept.sort )
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

gui_temps.account_item_card = `
    <div class="item_card item_card_clickable icc_account" id="ds_edit_account_thisacct.id">
    thisacct.name <hr>
    Active: thisacct.active<br>
    Type: thisacct.atype
    </div>

`

function updateAccountList() {
    BYID("data_store_new_account_name").value = ""
    let html_sel_active = "" // selector string
    let html_sel_all = "" // selector string
    let html_edit = "" // clickable item card

    for (let acct in STATE.storeinfo.account) {
        let thisacct = STATE.storeinfo.account[acct]
        // select inputs
        if (thisacct.active === true){
            html_sel_active +=`<option value="${acct}" >${thisacct.name}</option> `
        }
        html_sel_all +=`<option value="${acct}" >${thisacct.name}</option> `
        // list_edit item card

        let temp_html = gui_temps.account_item_card.replace(/thisacct.id/g , acct )
        temp_html = temp_html.replace(/thisacct.name/g, thisacct.name )
        //temp_html = temp_html.replace(/thisacct.sort/g, thisacct.sort )
        temp_html = temp_html.replace(/thisacct.active/g, thisacct.active )
        temp_html = temp_html.replace(/thisacct.atype/g, STATE.typenames.account[thisacct.atype] )
        //temp_html = temp_html.replace(/thisacct.createdBy/g, thisacct.createdBy )
        html_edit += temp_html


    }

    BYID("list_edit_table_area_account").innerHTML = html_edit
    // add edit listeners
    let icc_account = document.getElementsByClassName("icc_account");
    for (var i = 0; i < icc_account.length; i++) {
        console.log("adding listener");
        icc_account[i].addEventListener("click", clickItemCard);
    }
    // find and fill any html select elements
    BYID("transaction_new_input_account").innerHTML = html_sel_active
    BYID("transaction_new_input_from_account").innerHTML = html_sel_active
    BYID("transaction_new_input_to_account").innerHTML = html_sel_active
}

gui_temps.category_item_card = `
    <div class="item_card item_card_clickable icc_category parent.child" id="ds_edit_category_thiscat.id">
    thiscat.name | Active: thiscat.active | Type: thiscat.ctype
    </div>

`

function updateCategoryList() {
    BYID("data_store_new_category_name").value = ""
    BYID("data_store_new_category_parent_checkbox").checked = false
    let html_sel_active ={"0":"","1":"","2":"","3":""} //"" // selector string
    let html_sel_all = "" // selector string
    let html_sel_parent = "" // parent category selector string
    let html_edit = "" // clickable item card
    // build the sorty list
    let sorty = { parent:[], child:{} }
    for (let cat in STATE.storeinfo.category) {
        let thiscat = STATE.storeinfo.category[cat]
        if (thiscat.parent === null) {
            sorty.parent.push(thiscat)
            if ( !sorty.child[cat] ) { sorty.child[cat] = [] }
        } else {
            if ( !sorty.child[thiscat.parent] ) { sorty.child[thiscat.parent] = [] }
            sorty.child[thiscat.parent].push(thiscat)
        }
    }
    // do the sorting
    sorty.parent.sort(function(a, b){
        return a.sort == b.sort ? 0 : +(a.sort > b.sort) || -1;
    });
    for (let ch in sorty.child) {
        sorty.child[ch].sort(function(a, b){
            return a.sort == b.sort ? 0 : +(a.sort > b.sort) || -1;
        });
    }

    // build html
    sorty.parent.forEach((parent, i) => {
        let pstr = `<option value="${parent.uuid}" >${parent.name}</option> `

        html_sel_all += pstr
        if (parent.active === true) {
            html_sel_active[parent.ctype]  += pstr
            html_sel_parent += pstr
            let temp_html = gui_temps.category_item_card.replace(/thiscat.id/g , parent.uuid )
            temp_html = temp_html.replace(/thiscat.name/g, parent.name )
            temp_html = temp_html.replace(/thiscat.active/g, parent.active )
            temp_html = temp_html.replace(/thiscat.ctype/g, STATE.typenames.category[parent.ctype] )
            temp_html = temp_html.replace(/parent.child/g, "item_card_cat_parent" )
            html_edit += temp_html
        }
        sorty.child[parent.uuid].forEach((child, ii) => {
            let cstr = `<option class="category_child_option" value="${child.uuid}" >${child.name}</option> `
            html_sel_all += cstr
            if (parent.active === true && child.active === true) { html_sel_active[parent.ctype]  += cstr  }
            let temp_html = gui_temps.category_item_card.replace(/thiscat.id/g , child.uuid )
            temp_html = temp_html.replace(/thiscat.name/g, child.name )
            temp_html = temp_html.replace(/thiscat.active/g, child.active )
            temp_html = temp_html.replace(/thiscat.ctype/g, STATE.typenames.category[child.ctype] )
            temp_html = temp_html.replace(/parent.child/g, "item_card_cat_child" )
            html_edit += temp_html
        });


    });

    BYID("list_edit_table_area_category").innerHTML = html_edit
    // add edit listeners
    let icc_category = document.getElementsByClassName("icc_category");
    for (var i = 0; i < icc_category.length; i++) {
        console.log("adding listener");
        icc_category[i].addEventListener("click", clickItemCard);
    }

    // find and fill any html select elements
    STATE.view.cat_options_income = html_sel_active["0"] + html_sel_active["3"]
    STATE.view.cat_options_expence = html_sel_active["1"] + html_sel_active["3"]
    STATE.view.cat_options_transfer = html_sel_active["2"]
    BYID("transaction_new_input_category").innerHTML = STATE.view.cat_options_income
    BYID("data_store_new_category_parent").innerHTML = html_sel_parent
}

//-----------------------EDIT MODAL account/category/department

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
    if (type === "account"){

        document.em_account_type_radio.em_account_type.value = STATE.storeinfo.account[id].atype;
        BYID(`em_account_id`).value = id
        BYID(`em_account_name`).value = STATE.storeinfo.account[id].name
        BYID(`em_account_sort`).value = STATE.storeinfo.account[id].sort
        BYID(`em_account_active`).checked = STATE.storeinfo.account[id].active
        BYID(`em_account_createdby`).textContent = STATE.storeinfo.account[id].createdBy
        BYID(`em_account_createdat`).textContent = STATE.storeinfo.account[id].createdAt
        BYID(`em_account_changedby`).textContent = STATE.storeinfo.account[id].lastChangedBy
        BYID(`em_account_changedat`).textContent = STATE.storeinfo.account[id].lastChangedAt
        BYID("em_name_account_warning").innerHTML = ""
        if (STATE.storeinfo.account[id].tcount === 0) {
            BYID(`em_delete_area_account`).style.display = "block"
        } else {
            BYID(`em_delete_area_account`).style.display = "none"
        }
    }

    if (type === "category"){

        document.em_category_type_radio.em_category_type.value = STATE.storeinfo.category[id].ctype;
        BYID(`em_category_id`).value = id
        BYID(`em_category_name`).value = STATE.storeinfo.category[id].name
        BYID(`em_category_sort`).value = STATE.storeinfo.category[id].sort
        BYID(`em_category_active`).checked = STATE.storeinfo.category[id].active
        BYID(`em_category_createdby`).textContent = STATE.storeinfo.category[id].createdBy
        BYID(`em_category_createdat`).textContent = STATE.storeinfo.category[id].createdAt
        BYID(`em_category_changedby`).textContent = STATE.storeinfo.category[id].lastChangedBy
        BYID(`em_category_changedat`).textContent = STATE.storeinfo.category[id].lastChangedAt
        BYID("em_name_category_warning").innerHTML = ""
        if (STATE.storeinfo.category[id].tcount === 0) {
            BYID(`em_delete_area_category`).style.display = "block"
        } else {
            BYID(`em_delete_area_category`).style.display = "none"
        }
    }


    showModal("modal_edit_screen")

}
//----- attempt delete account/category/department
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
    STATE.view.wait_for_delete = true
    conn.send( JSON.stringify({type:"datastore_delete_item", uuid:uuid, itemtype:type }) )
}

function handleDeleteDataStoreItem(data){
    console.log("handleDeleteDataStoreItem" , data);
    if (data.success === true) {
        if (STATE.dsid === data.dsid) {
            delete STATE.storeinfo[data.itemtype][data.uuid]
            if (data.itemtype === "department") { updateDepartmentList()  }
            if (data.itemtype === "account") { updateAccountList() }
            if (data.itemtype === "category") { updateCategoryList() }
        }

    }
    if ( STATE.view.wait_for_delete ) {
        delete STATE.view.wait_for_delete
        hideModal()
    }
}

//--------------edit modal button actions
function clickEditModalButton(event) {
    let but_id , dsitem
    if (typeof(event) === "string") { but_id = event }
    else { but_id = event.target.id }
    let split = but_id.split("_")
    let type = split[2]
    let action = split[3]
    console.log("clickEditModalButton" , type, action);
    if (action === "cancel") {
        STATE.confirm.delete_datastore_item = false
        BYID(`em_button_${type}_delete`).innerHTML = "Delete"
        hideModal()
        return;
    }
    if (action === "delete") {
        if (STATE.confirm.delete_datastore_item === true){
            deleteDataStoreItem(type)
            BYID(`em_button_${type}_delete`).innerHTML = "Delete"
        } else {
            //change to confirm
            STATE.confirm.delete_datastore_item = true
            BYID(`em_button_${type}_delete`).innerHTML = "Confirm Delete"
        }

    }
    if (action === "save" && type === "department") {
        if (createOK() === false ) {
            BYID("em_name_department_warning").innerHTML = "Action not permitted"
            return;
        }
        let dept_id = BYID("em_department_id").value
        dsitem = cloneObj(STATE.storeinfo.department[dept_id])
        dsitem.name = BYID("em_department_name").value.trim()
        dsitem.sort = BYID("em_department_sort").value
        dsitem.active = BYID("em_department_active").checked
        conn.send( JSON.stringify({type:"datastore_update_department", uuid:dept_id, dsitem:dsitem }) )
        hideModal()
    }
    if (action === "save" && type === "account") {
        if (createOK() === false ) {
            BYID("em_name_account_warning").innerHTML = "Action not permitted"
            return;
        }
        let acct_id = BYID("em_account_id").value
        dsitem = cloneObj(STATE.storeinfo.account[acct_id])
        dsitem.name = BYID("em_account_name").value.trim()
        dsitem.sort = BYID("em_account_sort").value
        dsitem.active = BYID("em_account_active").checked
        dsitem.atype = document.querySelector('input[name="em_account_type"]:checked').value;
        conn.send( JSON.stringify({type:"datastore_update_account", uuid:acct_id, dsitem:dsitem }) )
        hideModal()

    }
    if (action === "save" && type === "category") {
        if (createOK() === false ) {
            BYID("em_name_category_warning").innerHTML = "Action not permitted"
            return;
        }
        let cat_id = BYID("em_category_id").value
        dsitem = cloneObj(STATE.storeinfo.category[cat_id])
        dsitem.name = BYID("em_category_name").value.trim()
        dsitem.sort = BYID("em_category_sort").value
        dsitem.active = BYID("em_category_active").checked
        dsitem.acype = document.querySelector('input[name="em_category_type"]:checked').value;
        conn.send( JSON.stringify({type:"datastore_update_category", uuid:cat_id, dsitem:dsitem }) )
        hideModal()
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
