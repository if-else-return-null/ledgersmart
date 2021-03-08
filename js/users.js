

function updateUserList(data){
    let usercard = `<div><div class="clicksurface" id="user_tile_username"> </div>username</div>`
    let htmlstr = ""
    let list = data.list
    let showCreate = false
    if ( list === null ){
        list = STATE.local_users.list
    } else {
        if (list.length === 0) { showCreate = true }
    }
    // check if the server has no users and needs an admin account
    if (showCreate === true) {
        showCreateUser(true)
    } else {
        // populate the user list
        list.forEach((item, i) => {
            htmlstr+= usercard.replace(/username/g , item)
        });
    }
    BYID("login_user_list").innerHTML = htmlstr

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
    BYID("login_user_info_name").value = ""
    BYID("login_user_info_pass").value = ""
    BYID("login_user_info_pass_repeat").value = ""

    BYID("login_user_pass_repeat_area").style.display = "none"
    BYID("login_user_text_btn_area").style.display = "block"
    BYID("login_user_info_heading").textContent = "Login"
    BYID("login_user_list").style.opacity = "1"
    BYID("login_user_create_start_btn").style.opacity = "1"
    BYID("login_user_create_infotext").innerHTML = ""

    if (hide === true) { hideModal(); }

}



function showUserLoginScreen() {
    console.log("showUserLoginScreen" );

    //*** check for local_users settings and update login inputs
    if (STATE.last_user.value !== null){
        console.log("selecting last user");
        STATE.user = STATE.last_user.value
        selectUserTile("user_tile_"+STATE.user)
    }

    showModal("modal_user_login")
}



// ------------------inputs

function handleUserNameInputChange(event) {
    console.log("username input text" , event);
    let username = BYID("login_user_info_name").value.toLowerCase().replace(/ /g, "_")
    STATE.user = username
    BYID("login_user_info_name").value = username
    // check local_users for autofill
    checkLocalUserInfo()
}

function handlePasswordInputChange(event) {
    console.log("password input text" , event);
    STATE.password = BYID("login_user_info_pass").value

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
    BYID("login_user_info_name").value = username
    checkLocalUserInfo()
}

function checkLocalUserInfo(){
    let user = STATE.user
    if (STATE.local_users.info[user]){
        if (STATE.local_users.info[user].password !== false){
            STATE.password = STATE.local_users.info[user].password
        } else {
            STATE.password = ""
        }
        STATE.dsid = STATE.local_users.info[user].dsid
        BYID("login_user_info_pass").value = STATE.password
    } else {
        STATE.password = ""
        STATE.dsid = null
        BYID("login_user_info_pass").value = ""
    }
}

// ------------------Create user
function showCreateUser(admin = false) {
    //resetRemember()
    BYID("login_user_info_name").value = ""
    BYID("login_user_info_pass").value = ""
    BYID("login_user_info_pass_repeat").value = ""
    STATE.create_user_visible = true

    BYID("login_user_pass_repeat_area").style.display = "block"
    BYID("login_user_info_heading").textContent = "Create User"
    BYID("login_user_text_btn_area").style.display = "none"
    //** may need to add a click shield of somesort
    BYID("login_user_list").style.opacity = "0"
    BYID("login_user_create_start_btn").style.opacity = "0"
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

function handleUserCreateResponce(data){
    if (data.success === true) {
        // send a login request
        BYID("login_user_info_name").value = data.username
        BYID("login_user_info_pass").value = data.password
        requestAttemptLogin()
        toggleLoginLoading(true,"<br>Logging In...")
    } else {
        BYID("login_user_create_infotext").innerHTML = "Create user faild<br>"+ data.reason
        setTimeout(function(){ toggleLoginLoading(false,"") },1500)

    }
}


//-----------------Login User

function requestAttemptLogin(event){

    toggleLoginLoading(true,"<br>Checking Login...")
    conn.send( JSON.stringify({type:"user_login", username:STATE.user, password:STATE.password, dsid:STATE.dsid }) )
}





function handleBadUserLoginResponce(data) {
    // bad logins
    toggleLoginLoading(true,"<br>Login Failed")
    setTimeout(function(){
        toggleLoginLoading(false,"")
    },1500)
}
