
//----------------------settings data------------------------------------------
function updateDataStoreList(list){
    console.log("updaing store lists");
    if (list.id.length === 0) {
        // no stores available
        BYID("data_store_selector_warning").innerHTML = "No data stores on server.<br>"
        BYID("data_store_active_display").innerHTML = "NONE"

    } else {

    }
}
