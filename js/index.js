const core = require("../js/core.js")
console.log(process.versions.electron)
let status = "webviewSkype"
$(document).ready(function () {
    $("#switch").on("click", function () {
        if (status == "webviewSkype") {
            $("#webviewSkype").hide()
            $("#webviewWechat").show()
            status = "webviewWechat"
        } else if (status == "webviewWechat") {
            $("#webviewSkype").show()
            $("#webviewWechat").hide()
            status = "webviewSkype"
        }
    })
    let webWechat = document.getElementById("webviewWechat");
    webWechat.addEventListener("dom-ready", function () { webWechat.openDevTools(); });


    core.WinReplyWeb("webviewWechat",(key, arg)=>{
        console.log("MSG from wechat")
        console.log(key)
        console.log(arg)
        $("#insert").append("<img src='"+arg+"'><\img>")
    })    
})


