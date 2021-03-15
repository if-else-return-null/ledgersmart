function setupTransactionForm(type = "income"){
    console.log("setupTransactionForm", type);
    STATE.view.transaction_type = type
    // fill in the proper category selectors
    form.tnew.category.innerHTML = STATE.view["cat_options_" + type]
    form.tnew.date.value = getDateNow()
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
        form.tnew.amount.style.color = "var(--postext)"
    } else {
        form.tnew.amount.style.color = "var(--negtext)"
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
    form.tnew.tag.value = tagstr[tag]
    if (tag === "check") {
        form.tnew.tag.focus()
    }
}

function clearTrasactionForm(){
    console.log("clearTrasactionForm");
    form.tnew.reset()
    form.tnew.amount.style.outline = "none"
    form.tnew.payee.style.outline = "none"
    form.tnew.transfer_amount.style.outline = "none"
    form.tnew.date.value = getDateNow()
    // clear up and split entrys
    startTrasactionSplit(true)

}

function startTrasactionSplit(clear = false) {
    console.log("startTrasactionSplit");
    // cancel the split
    if (STATE.view.transaction_split === true || clear === true) {
        STATE.view.transaction_split = false
        BYID("transaction_new_button_split").innerHTML = "Split Transaction"
        BYID("transaction_new_split_area").style.display = "none"
        BYID("transaction_new_split_items_list").innerHTML = ""
        STATE.transaction_splits = {}

    } else {
        STATE.view.transaction_split = true
        BYID("transaction_new_button_split").innerHTML = "Cancel Split"
        BYID("transaction_new_split_area").style.display = "block"
    }

}

function postNewTransaction() {
    // clear any warnings
    form.tnew.amount.style.outline = "none"
    form.tnew.payee.style.outline = "none"
    form.tnew.transfer_amount.style.outline = "none"
    let valid = true
    let dsitem = {}
    dsitem.ttype = STATE.view.transaction_type
    dsitem.department = form.tnew.department.value
    dsitem.date = form.tnew.date.value
    dsitem.payee = form.tnew.payee.value
    if (dsitem.payee === ""){
        form.tnew.payee.style.outline = "1px solid red"
        valid = false
    }
    dsitem.category = form.tnew.category.value
    dsitem.tag = form.tnew.tag.value
    dsitem.memo = form.tnew.memo.value
    if (STATE.view.transaction_type !== "transfer") {
        dsitem.account = form.tnew.account.value
        //*** update sign according to
        dsitem.rawAmount = form.tnew.amount.value
        if (dsitem.rawAmount === ""){
            form.tnew.amount.style.outline = "1px solid red"
            valid = false
        }
        dsitem.amount = getsignedAmount(dsitem.rawAmount)

    } else {
        dsitem.from_account = form.tnew.from_account.value
        dsitem.to_account = form.tnew.to_account.value
        dsitem.amount = form.tnew.transfer_amount.value
        if (dsitem.amount === ""){
            form.tnew.transfer_amount.style.outline = "1px solid red"
            valid = false
        }
    }
    console.log("postNewTransaction", dsitem);
    if (valid === false ) {
        console.log("transaction data NOT valid");
        return;
    }
    console.log("transaction data valid");



}
