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
    STATE.remember[box] = value
    /*
    // update check boxes if needed
    for (var i = 0; i < remember_checkbox.length; i++){
        if ( STATE.remember[box] === true ) { remember_checkbox[i].checked = true }
    }
    */
    saveRemember()
    parseRemember()
}

function toggleServerBroadcastUsers(){
    conn.send( JSON.stringify({type:"toggle_broadcast_users" }) )
}

function requestDebugInfo(name){
    if (typeof(name) !== "string" ){
        name = BYID("debug_request_input").value
    }
    conn.send( JSON.stringify({type:"debug_info", name:name  }) )
}

function handleDebugInfoResponce(data){
    console.log("DEBUG:",data.name);
    console.log(data.item);
}

//----------------------settings data------------------------------------------
function updateDataStoreList(list){
    let htmlstr = ""
    STATE.datastore_list = list

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


//-------------------------------settings users--------------------------------

function updateUserList(data){
    let usercard = `<div><div class="clicksurface" id="user_tile_username"> </div>username</div>`
    let htmlstr = ""
    BYID("login_user_list").style.display = "block"
    // if we are getting this update then we can hide the text based login
    STATE.text_based_login = false
    BYID("login_user_info").style.display = "none"
    // check if the server has no users and needs an admin account
    if (data.list.length === 0) {
        showCreateUser(true)
    } else {
        // populate the user list
        data.list.forEach((item, i) => {
            htmlstr+= usercard.replace(/username/g , item)
        });
    }
    BYID("login_user_list").innerHTML = htmlstr

}

//
function showUserLoginScreen() {
    //*** check for remember settings and update login inputs
    console.log("showUserLoginScreen" ,STATE.text_based_login);
    if (STATE.remember.user === true) {
        if (STATE.text_based_login === true) {
            BYID("login_user_info_name").value = STATE.user
        } else {
            selectUserTile("user_tile_"+STATE.user)
        }
    }
    if (STATE.remember.password === true) {
        if (STATE.text_based_login === true) {
            BYID("login_user_info_pass").value = STATE.password
        } else {
            //selectUserTile("user_tile_"+STATE.user)
        }
    }
    showModal("modal_user_login")
}

function toggleLoginLoading(show = true , html = "<br>Loading...") {
    if ( show === true ) {
        BYID("modal_user_login_loading").innerHTML = html
        BYID("modal_user_login_loading").style.display = "block"
    } else {
        BYID("modal_user_login_loading").style.display = "none"
    }
}

function resetUserLoginScreen(hide = true) {
    STATE.create_user_visible = false
    STATE.user = null
    BYID("login_user_info_name").value = ""
    BYID("login_user_info_pass").value = ""
    BYID("login_user_info_pass_repeat").value = ""
    BYID("login_user_list_password_input").value = ""

    BYID("login_user_list_password_area").style.display = "none"
    BYID("login_user_pass_repeat_area").style.display = "none"

    BYID("login_user_text_btn_area").style.display = "block"
    BYID("login_user_create").style.display = "inline-block"

    if (STATE.text_based_login === true) {
        BYID("login_user_info").style.display = "inline-block"
        BYID("login_user_list").style.display = "none"
    } else {
        BYID("login_user_info").style.display = "none"
        BYID("login_user_list").style.display = "block"
    }
    BYID("login_user_create_infotext").innerHTML = ""
    BYID("login_user_info_heading").textContent = "Login"

    if (hide === true) {
        hideModal()
    }
}


function showCreateUser(admin = false) {
    resetRemember()
    BYID("login_user_info_name").value = ""
    STATE.create_user_visible = true
    BYID("login_user_info").style.display = "inline-block"
    BYID("login_user_pass_repeat_area").style.display = "block"
    BYID("login_user_info_heading").textContent = "Create User"
    BYID("login_user_text_btn_area").style.display = "none"
    BYID("login_user_create").style.display = "none"
    if (admin === true) {
        let msg = `No users found on server <br> The user you create now will becone
        the servers root user.
        `
        BYID("login_user_create_infotext").innerHTML = msg
    }

}

function requestCreateUser(){
    let name = BYID("login_user_info_name").value
    let pass1 = BYID("login_user_info_pass").value.trim()
    let pass2 = BYID("login_user_info_pass_repeat").value.trim()
    console.log("requestCreateUser", name, pass1, pass2);
    if (pass1 !== pass2) {
        BYID("login_user_create_infotext").innerHTML = "Passwords do not match"
        return;
    }
    BYID("login_user_create_infotext").innerHTML = "Requesting new user..."
    toggleLoginLoading(true,"Requesting new user...")
    conn.send( JSON.stringify({type:"user_create", username:name, password:pass1 }) )
}

function selectUserTile(event){
    let tile_id
    if (typeof(event) === "string") {
        tile_id = event
    } else {
        tile_id = event.target.id
    }
    if ( !tile_id.startsWith("user_tile_") ) { return; }
    console.log("selectUserTile click", tile_id);
    let username = tile_id.replace("user_tile_", "")
    STATE.user = username
    parseRemember()
    /*
    if (STATE.remember.password === true) {
        BYID("login_user_list_password_input").value = STATE.password
    }
    */
    //*** maybe change the look of the tile or outline it
    // show password input
    BYID("login_user_list_password_area").style.display = "block"
    BYID("login_user_list_password_input").focus()

}

function handleUserNameInputChange(event) {
    console.log("username input text" , event);
    STATE.user = BYID("login_user_info_name").value
    parseRemember()
}

function requestAttemptLogin(event){
    let sourceid, name, pass
    if (typeof(event) === "string") {
        sourceid = event
    } else {
        sourceid = event.target.id
    }
    if (STATE.autologin === false){
        if (sourceid === "login_user_list_attempt_btn"){
            //STATE.user = STATE.user_tile_name
            STATE.password  = BYID("login_user_list_password_input").value.trim()
        } else {
            STATE.user = BYID("login_user_info_name").value.trim()
            STATE.password  = BYID("login_user_info_pass").value.trim()
        }
    } else {
        // if we are using autologin then clear it
        STATE.autologin = false
    }

    toggleLoginLoading(true,"<br>Checking Login...")
    conn.send( JSON.stringify({type:"user_login", username:STATE.user, password:STATE.password, dsid:STATE.dsid }) )
}

function handleUserCreateResponce(data){
    if (data.success === true) {
        // send a login request
        BYID("login_user_info_name").value = data.username
        BYID("login_user_info_pass").value = data.password
        requestAttemptLogin("login_user_text_attempt_btn")
        toggleLoginLoading(true,"<br>Logging In...")
    } else {
        BYID("login_user_create_infotext").innerHTML = "Create user faild<br>"+ data.reason
        setTimeout(function(){ toggleLoginLoading(false,"") },1500)

    }
}

function handleUserLoginResponce(data) {
    // bad logins
    toggleLoginLoading(true,"<br>Login Failed")
    setTimeout(function(){
        toggleLoginLoading(false,"")
    },1500)
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
