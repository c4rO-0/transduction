const electron = require("electron");
const ipc = electron.ipcRenderer


ipc.on('ipc-asynchronous-reply', function(event, arg){
    console.log("asynchronous-ipc reply : ", arg)

})   


$(document).ready(function () {
    $("#goto-skype").on("click",()=>{
        $("#webview-wechat").css("visibility","hidden")
        $("#webview-skype").css("visibility","visible")
    })
    $("#goto-wechat").on("click",()=>{
        $("#webview-wechat").css("visibility","visible")
        $("#webview-skype").css("visibility","hidden")
    })    

    let ASobjBtn = document.getElementById('asynchronous-messageBtn')

    let SobjBtn = document.getElementById('synchronous-messageBtn')

    ASobjBtn.addEventListener('click', function(){
        console.log("index : msg 1");
        ipc.send('ipc-asynchronous-message', "asynchronous msg from index")
    })

    SobjBtn.addEventListener('click', function(){
        console.log("index : msg 2");
        let msgReply = ipc.sendSync('ipc-synchronous-message', "synchronous msg from index")
        console.log("synchronous-ipc reply : ",msgReply)
    })    
    
});

