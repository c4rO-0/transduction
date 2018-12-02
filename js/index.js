const core = require("../js/core.js")
console.log(process.versions.electron)
let status = "webviewSkype"

// ============================function===================

//------------------------
// 处理消息
/**
 * core.WinReplyWeb 处理消息的函数
 * @param {String} webTag 区分web
 * @param {String} key MSG的类别 : 
 * MSG-Log : 收到右侧窗口聊天记录
 * MSG-new : 左侧提示有新消息
 * @param {Object} Convo 收到的具体消息
 */
function respFuncWinReplyWeb(webTag, key, Convo){


    return new Promise((resolve, reject) => {


        console.log("debug : ", "----------------------")
        console.log("debug : ", "Convo from ", webTag)
        // console.log(MSG)

        if (key == 'MSG-Log') {
            // 获取某个用户聊天记录

            // 检查消息是否已经存在
            if ($("#insert #" + Convo.MSGID).length == 0) {
                console.log("debug : ", "display Convo on index")
                if (Convo.type == 3) {
                    // 是图片
                    $("#insert").append("<p id='" + Convo.MSGID + "'> " + Convo.time + "<img src='" + Convo.content + "'></img></p>")
                } else {
                    $("#insert").append("<p id='" + Convo.MSGID + "'> " + Convo.time + Convo.content + "</p>")
                }


                resolve("copy that")
            } else {
                resolve("existed")
            }
        } else if (key == 'Convo-new') {
            // 有新消息来了
            
            console.log("debug : ", "new Convo")
            console.log("debug : ", "Name :", Convo.nickName)
            console.log("debug : ", "ID : ", Convo.userID)
            console.log("debug : ", "avatar : ", Convo.avatar)
            console.log("debug : ", "index :", Convo.index)
            console.log("debug : ", "message :", Convo.message)
            console.log("debug : ", "time :", Convo.time)
            console.log("debug : ", "counter :", Convo.counter)
            console.log("debug : ", "action :", Convo.action)
            console.log("debug : ", "muted :", Convo.muted)

            resolve("copy that")
        }

        setTimeout(() => {
            reject("time out")
        }, 1000);

    })

}


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
    webviewSkype.addEventListener("dom-ready", function () { webviewSkype.openDevTools(); });


    // ===========================接收消息===========================

    // wechat
    core.WinReplyWeb("webviewWechat", (key, arg) => {
        return respFuncWinReplyWeb("wechat", key, arg)
    })

    // skype
    core.WinReplyWeb("webviewSkype", (key, arg) => {
        return respFuncWinReplyWeb("skype", key, arg)
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

 
