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


    // ===========================接收消息===========================

    core.WinReplyWeb("webviewWechat", (key, arg) => {
        return new Promise((resolve, reject) => {
            console.log("debug : ", "----------------------")
            console.log("debug : ", "MSG from wechat")
            // console.log(arg)

            if (key == 'MSG-Log') {
                // 获取某个用户聊天记录

                // 检查消息是否已经存在
                if ($("#insert #" + arg.MSGID).length == 0) {
                    console.log("debug : ", "display MSG on index")
                    if (arg.type == 3) {
                        // 是图片
                        $("#insert").append("<p id='" + arg.MSGID + "'> " + arg.time + "<img src='" + arg.content + "'></img></p>")
                    } else {
                        $("#insert").append("<p id='" + arg.MSGID + "'> " + arg.time + arg.content + "</p>")
                    }


                    resolve("copy that")
                } else {
                    resolve("existed")
                }
            } else if (key == 'MSG-new') {
                // 有新消息来了
                
                console.log("debug : ", "new MSG")
                console.log("debug : ", "Name :", arg.nickName)
                console.log("debug : ", "ID : ", arg.userID)
                console.log("debug : ", "index :", arg.index)
                console.log("debug : ", "content :", arg.content)
                console.log("debug : ", "time :", arg.time)
                console.log("debug : ", "counter :", arg.counter)
                console.log("debug : ", "action :", arg.action)
                console.log("debug : ", "muted :", arg.muted)

                resolve("copy that")
            }

            setTimeout(() => {
                reject("time out")
            }, 1000);

        })
    })


    // ===========================发送消息===========================
    $("#wechatGet").click(() => {
        $("#insert").empty()
        if($("#userID").val() != ''){
            core.HostSendToWeb("webviewWechat", { "get": $("#userID").val()}).then((res) => {
                console.log(res)
            }).catch((error) => {
                throw error
            });
        }

    })
})

 
