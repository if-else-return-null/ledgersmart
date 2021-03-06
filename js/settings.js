
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

//*** maybe don't need this
function showUserLoginScreen() {
    showModal("modal_user_login")
}

function toggleLoginLoading(show = true , text="Loading...") {
    if ( show === true ) {
        BYID("modal_user_login_loading").textContent = text
        BYID("modal_user_login_loading").style.display = "block"
    } else {
        BYID("modal_user_login_loading").style.display = "none"
    }
}

function resetUserLoginScreen(hide = true) {
    BYID("login_user_info_name").value = ""
    BYID("login_user_info_pass").value = ""
    BYID("login_user_info_pass_repeat").value = ""
    BYID("login_user_list_password_input").value = ""

    BYID("login_user_list_password_area").style.display = "none"
    BYID("login_user_pass_repeat_area").style.display = "none"

    BYID("login_user_text_btn_area").style.display = "block"
    BYID("login_user_create_start_btn").style.display = "block"

    if (STATE.text_based_login === true) {
        BYID("login_user_info").style.display = "inline-block"
        BYID("login_user_list").style.display = "none"
    }
    BYID("login_user_create_infotext").innerHTML = ""
    BYID("login_user_info_heading").textContent = "Login"

    if (hide === true) {
        hideModal("modal_user_login")
    }
}


function showCreateUser(admin = false) {
    BYID("login_user_info").style.display = "inline-block"
    BYID("login_user_pass_repeat_area").style.display = "block"
    BYID("login_user_info_heading").textContent = "Create User"
    BYID("login_user_text_btn_area").style.display = "none"
    BYID("login_user_create_start_btn").style.display = "none"
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
    STATE.user_tile_name = username

    // if password is saved just login
    if (localStorage.getItem("user_pass_"+username)){
        BYID("login_user_list_password_input").value = localStorage.getItem("user_pass_"+username)
        requestAttemptLogin("login_user_list_attempt_btn")
    } else {
        // show password input
        BYID("login_user_list_password_area").style.display = "block"
    }
}

function requestAttemptLogin(event){
    let sourceid, name, pass
    if (typeof(event) === "string") {
        sourceid = event
    } else {
        sourceid = event.target.id
    }
    if (sourceid === "login_user_list_attempt_btn"){
        name = STATE.user_tile_name
        pass = BYID("login_user_list_password_input").value.trim()
    } else {
        name = BYID("login_user_info_name").value.trim()
        pass = BYID("login_user_info_pass").value.trim()
    }
    toggleLoginLoading(true,"Checking Login...")
    conn.send( JSON.stringify({type:"user_login", username:name, password:pass }) )
}

function handleUserCreateResponce(data){
    if (data.success === true) {
        // send a login request
        BYID("login_user_info_name").value = data.username
        BYID("login_user_info_pass").value = data.password
        requestAttemptLogin("login_user_text_attempt_btn")
        toggleLoginLoading(true,"Logging In")
    } else {
        BYID("login_user_create_infotext").innerHTML = "Create user faild<br>"+ data.reason
        setTimeout(function(){ toggleLoginLoading(false,"") },1500)

    }
}

function handleUserLoginResponce(data) {
    // bad logins
    toggleLoginLoading(true,"Login Failed")
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
