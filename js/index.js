const core = require("../js/core.js")
console.log(process.versions.electron)
let status = "webviewSkype"

// ============================function===================
//注意：24行，由于传来的time不是date类型，两个方法都不能调用
function convoHtml(appName, convo) {
    return '\
    <div class="td-convo theme-transduction td-font data-user-i-d='+ convo.userID + '">\
        <div class="col-hint">\
            <div class="row-hint theme-'+ appName + '"></div>\
        </div>\
        <div class="col-avatar d-flex justify-content-center">\
            <div class="td-avatar align-self-center" style="background-image: url('+ convo.avatar + ')"></div>\
            <div class="td-counter">\
                <div style="align-self:center">'+ convo.counter + '</div>\
            </div>\
        </div>\
        <div class="col p-0 col-text flex-column justify-content-center">\
            <div class="m-0 td-nickname">'+ convo.nickName + '</div>\
            <div class="m-0 td-text">'+ convo.message + '</div>\
        </div>\
        <div class="col-auto pl-0 col-timestamp justify-content-end">\
            '+ convo.time.getHours() + ':' + convo.time.getMinutes() + '\
        </div>\
    </div>'
}

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
function respFuncWinReplyWeb(webTag, key, Convo) {


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
            if(Convo.action==='a'){
                console.log('going to insert html snippet')
                console.log(typeof Convo.time)
                console.log(convoHtml('skype', Convo))
                // $('#td-left').prepend(convoHtml('skype', Convo))
            }
            resolve("copy that")
        }

        setTimeout(() => {
            reject("time out")
        }, 1000);

    })

}

function toggleWebview() {
    document.querySelectorAll('webview').forEach((e) => {
        if (e.style.display === 'none') {
            e.style.display = ''
        } else {
            e.style.display = 'none'
        }
    })
}

$(document).ready(function () {
    // let webWechat = document.getElementById("webviewWechat");
    // webWechat.addEventListener("dom-ready", function () { webWechat.openDevTools(); });
    // webviewSkype.addEventListener("dom-ready", function () { webviewSkype.openDevTools(); });



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
        if ($("#userID").val() != '') {
            core.HostSendToWeb("webviewWechat", { "get": $("#userID").val() }).then((res) => {
                console.log(res)
            }).catch((error) => {
                throw error
            });
        }

    })

    toggleWebview()
})


