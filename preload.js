const ipc = require('electron').ipcRenderer;

console.log("pre-load : " , "test");

window.lsapi = {}
// ipc to the main process
window.lsapi.send = function (channel,data) {
    ipc.send(channel, data)
}


ipc.on('from_mainProcess', (event, data) => {
    handleFromMainProcess(data)
})
