function setupTransactionForm(type = "income"){
    console.log("setupTransactionForm", type);
    STATE.view.transaction_type = type
    // fill in the proper category selectors
    BYID("transaction_new_input_category").innerHTML = STATE.view["cat_options_" + type]
    BYID("transaction_new_input_date").value = getDateNow()
    if (type === "income") {
        setTrasactionSign(true)
        toggleTransactionTransferArea(true)
    }
    else if (type === "expence") {
        setTrasactionSign(false)
        toggleTransactionTransferArea(true)
    }
    else if (type === "transfer") {
        toggleTransactionTransferArea(false)
    }
    else {

    }

}


function toggleTransactionTransferArea(value){
    if (value === true) {
        BYID(`transaction_new_aa_area_default`).style.display = "block"
        BYID(`transaction_new_aa_area_transfer`).style.display = "none"
    } else {
        BYID(`transaction_new_aa_area_default`).style.display = "none"
        BYID(`transaction_new_aa_area_transfer`).style.display = "block"
    }
}

function setTrasactionSign(value){
    STATE.transaction_sign = value
    if (value === true) {
        BYID("transaction_new_input_amount").style.color = "var(--postext)"
    } else {
        BYID("transaction_new_input_amount").style.color = "var(--negtext)"
    }

}

function transactionChangeSign(){
    setTrasactionSign(!STATE.transaction_sign)
}

function getsignedAmount(amt){
    amt = amt.replace("-","")
    if (STATE.transaction_sign === true) {
        return amt
    } else {
        return "-" + amt
    }

}

function clickTransactionSetTag(event) {
    let tag = event.target.id.split("_").pop()
    let tagstr = {check:"#", card:"Card", atm:"ATM", ach:"ACH" }
    console.log("clickTransactionSetTag", tag);
    BYID("transaction_new_input_tag").value = tagstr[tag]
    if (tag === "check") {
        BYID("transaction_new_input_tag").focus()
    }
}

function clearTrasactionForm(){
    console.log("clearTrasactionForm");
    BYID("transaction_new_input_amount").style.outline = "none"
    BYID("transaction_new_input_payee").style.outline = "none"
    BYID("transaction_new_input_transfer_amount").style.outline = "none"
    BYID("transaction_new_input_payee").value = ""
    BYID("transaction_new_input_date").value = getDateNow()
    BYID("transaction_new_input_amount").value = ""
    BYID("transaction_new_input_transfer_amount").value = ""
}

function postNewTransaction() {
    // clear any warnings
    BYID("transaction_new_input_amount").style.outline = "none"
    BYID("transaction_new_input_payee").style.outline = "none"
    BYID("transaction_new_input_transfer_amount").style.outline = "none"
    let valid = true
    let dsitem = {}
    dsitem.ttype = STATE.view.transaction_type
    dsitem.department = BYID("transaction_new_input_department").value
    dsitem.date = BYID("transaction_new_input_date").value
    dsitem.payee = BYID("transaction_new_input_payee").value
    if (dsitem.payee === ""){
        BYID("transaction_new_input_payee").style.outline = "1px solid red"
        valid = false
    }
    dsitem.category = BYID("transaction_new_input_category").value
    dsitem.tag = BYID("transaction_new_input_tag").value
    dsitem.memo = BYID("transaction_new_input_memo").value
    if (STATE.view.transaction_type !== "transfer") {
        dsitem.account = BYID("transaction_new_input_account").value
        //*** update sign according to
        dsitem.rawAmount = BYID("transaction_new_input_amount").value
        if (dsitem.rawAmount === ""){
            BYID("transaction_new_input_amount").style.outline = "1px solid red"
            valid = false
        }
        dsitem.amount = getsignedAmount(BYID("transaction_new_input_amount").value)

    } else {
        dsitem.from_account = BYID("transaction_new_input_from_account").value
        dsitem.to_account = BYID("transaction_new_input_to_account").value
        dsitem.amount = BYID("transaction_new_input_transfer_amount").value
        if (dsitem.amount === ""){
            BYID("transaction_new_input_transfer_amount").style.outline = "1px solid red"
            valid = false
        }
    }
    console.log("postNewTransaction", dsitem);
    if (valid = false ) {
        return;
    }
    console.log("transaction data valid");
    console.log(document.transaction_new.transaction_new_input_payee.value);



}
