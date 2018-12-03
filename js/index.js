const core = require("../js/core.js")
console.log(process.versions.electron)
let status = "webviewSkype"

// =========================class===========================
class conversation {
    constructor(action, userID, nickName, time, avatar, message, counter, index, muted) {
        this.action = action
        this.userID = userID
        this.nickName = nickName
        if(typeof(time) == "string"){
            this.time = new Date(time)
        }else if(typeof(time) == "object"){
            this.time = time
        }else{
            console.log("error : conversation :  wrong type of time : ". type(time), time)
            this.time = new Date()
        }
        this.avatar = avatar
        this.message = message
        if(typeof(counter) == "number" ){
            this.counter = counter
        }else if(typeof(counter) == "string"){
            this.counter = parseInt(counter)
        }else{
            console.log("error : conversation :  unknown counter typ : ", type(counter), counter)
            this.counter = undefined
        }
        if(typeof(index) == "number" ){
            this.index = index
        }else if(typeof(index) == "string"){
            this.index = parseInt(index)
        }else{
            console.log("error : conversation :  unknown index type : ", type(index), index)
            this.index = undefined
        }        
        if(typeof(muted) == "boolean" ){
            this.muted = muted
        }else if(typeof(muted) == "string"){
            if(muted.toLowerCase == "false"){
                this.muted = false
            }else if(muted.toLowerCase == "true"){
                this.muted = true
            }else{
                console.log("error : conversation :  unknown muted value : ". muted)
                this.muted = undefined                
            }
            
        }else{
            console.log("error : conversation :  unknown muted type : ", type(muted), muted)
            this.muted = undefined
        }   
        this.muted = muted
    }

    print(){
        console.log("debug : ", "Name :", this.nickName)
        console.log("debug : ", "ID : ", this.userID)
        console.log("debug : ", "avatar : ", this.avatar)
        console.log("debug : ", "index :", this.index)
        console.log("debug : ", "message :", this.message)
        console.log("debug : ", "time :", this.time)
        console.log("debug : ", "counter :", this.counter)
        console.log("debug : ", "action :", this.action)
        console.log("debug : ", "muted :", this.muted)
    }

}

// ============================function===================

//------------------------
// 处理消息
/**
 * core.WinReplyWeb 处理消息的函数
 * @param {String} webTag 区分web
 * @param {String} key MSG的类别 : 
 * MSG-Log : 收到右侧窗口聊天记录
 * MSG-new : 左侧提示有新消息
 * @param {Object} Obj 收到的具体消息
 */
function respFuncWinReplyWeb(webTag, key, Obj) {


    return new Promise((resolve, reject) => {


        console.log("debug : ", "----------------------")
        console.log("debug : ", "Convo from ", webTag)
        // console.log(MSG)

        if (key == 'MSG-Log') {
            // 获取某个用户聊天记录

            // 检查消息是否已经存在
            if ($("#insert #" + Obj.MSGID).length == 0) {
                console.log("debug : ", "display Convo on index")
                if (Obj.type == 3) {
                    // 是图片
                    $("#insert").append("<p id='" + Obj.MSGID + "'> " + Obj.time + "<img src='" + Obj.content + "'></img></p>")
                } else {
                    $("#insert").append("<p id='" + Obj.MSGID + "'> " + Obj.time + Obj.content + "</p>")
                }


                resolve("copy that")
            } else {
                resolve("existed")
            }
        } else if (key == 'Convo-new') {
            // 有新消息来了

            let Convo = new conversation(
                Obj.action, 
                Obj.userID, 
                Obj.nickName, 
                Obj.time, 
                Obj.avatar, 
                Obj.message, 
                Obj.counter, 
                Obj.index, 
                Obj.muted)
            console.log("debug : ", "new Convo")
            Convo.print()

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
        if ($("#userID").val() != '') {
            core.HostSendToWeb("webviewWechat", { "get": $("#userID").val() }).then((res) => {
                console.log(res)
            }).catch((error) => {
                throw error
            });
        }

    })
})


