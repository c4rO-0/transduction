
const core = require( process.env.PWD+'/static/js/own/core.js')


$(document).ready(function () {
    $("#goto-skype").on("click", () => {
        $("#webview-wechat").css("visibility", "hidden")
        $("#webview-skype").css("visibility", "visible")
    })
    $("#goto-wechat").on("click", () => {
        $("#webview-wechat").css("visibility", "visible")
        $("#webview-skype").css("visibility", "hidden")
    })

    // =========向main发送消息==============
    let ASobjBtn = document.getElementById('asynchronous-messageBtn')

    let SobjBtn = document.getElementById('synchronous-messageBtn')

    ASobjBtn.addEventListener('click', function () {
        console.log("index : msg 1");
        core.sendToMain({"type":"asynchronous msg from loadWin"}).then((arg)=>{
            console.log("got it")
            console.log(arg)
        })
    })

    SobjBtn.addEventListener('click', function () {
        console.log("index : msg 2");
        let msgReply = core.sendToMainSync({"type":"synchronous msg from loadWin"})
        console.log("main sy reply : ", msgReply)
    })

});

