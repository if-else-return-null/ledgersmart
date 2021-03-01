const ipc = require('electron').ipcRenderer;

console.log("pre-load : " , "test");


// ipc to the main process
window.ipcSend = function (channel,data) {
    ipc.send(channel, data)
}


ipc.on('from_mainProcess', (event, data) => {
    handleFromMainProcess(data)
})

window.addEventListener('DOMContentLoaded', () => {

    //ipcSend("config_window",{ type:"request_current_config" })
})
