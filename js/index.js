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


    core.WinReplyWeb("webviewWechat", (key, arg) => {
        return new Promise((resolve, reject) => {
            console.log("debug : ", "MSG from wechat")
            // console.log(arg)

            if ($("#insert #" + arg.MSGID).length == 0) {
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


            setTimeout(() => {
                reject("time out")
            }, 1000);

        })
    })

    $("#wechatGet").click(() => {
        core.HostSendToWeb("webviewWechat", { "get": "filehelper" }).then((res) => {
            console.log(res)
        }).catch((error) => {
            throw error
        });
    })
})


