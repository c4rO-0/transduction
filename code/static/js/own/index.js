const electron = require("electron");
const ipc = electron.ipcRenderer

// =========等待消息==============
//  main消息
ipc.on('msg-ipc-asy-main-reply', function(event, arg){
    console.log("main asy reply : ", arg)

})   
// 其他消息


$(document).ready(function () {
    $("#goto-skype").on("click",()=>{
        $("#webview-wechat").css("visibility","hidden")
        $("#webview-skype").css("visibility","visible")
    })
    $("#goto-wechat").on("click",()=>{
        $("#webview-wechat").css("visibility","visible")
        $("#webview-skype").css("visibility","hidden")
    })    


    // =========向main发送消息==============
    let ASobjBtn = document.getElementById('asynchronous-messageBtn')

    let SobjBtn = document.getElementById('synchronous-messageBtn')

    ASobjBtn.addEventListener('click', function(){
        console.log("index : msg 1");
        ipc.send('msg-ipc-asy-to-main', {"type": "msg from index"})
    })

    SobjBtn.addEventListener('click', function(){
        console.log("index : msg 2");
        let msgReply = ipc.sendSync('msg-ipc-sy-to-main',{"type": "msg from index"})
        console.log("main sy reply : ",msgReply)
    })    

    // 
    
});

