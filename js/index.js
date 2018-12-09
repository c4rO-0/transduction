// =========================全局函数和变量===========================
/**
 * 开关webview
 */
function toggleWebview() {
    document.querySelectorAll('webview').forEach((e) => {
        if (e.style.display === 'none') {
            e.style.display = ''
        } else {
            e.style.display = 'none'
        }
    })
}
/**
 * 打开webview Devtool
 * @param {string} strID 
 */
function openDevtool(strID) {
    let web = document.getElementById(strID);
    web.openDevTools();
}

function listWebviewID(){
    $("webview").toArray().forEach((e,i) =>{
        console.log($(e).attr('id'))
    })
}

$(document).ready(function () {

    const core = require("../js/core.js")
    console.log(process.versions.electron)
    let status = "webviewSkype"

    // =========================class===========================
    class conversation {
        constructor(action, userID, nickName, time, avatar, message, counter, index, muted) {
            this.action = action
            this.userID = userID
            this.nickName = nickName

            if (time === undefined) {
                this.time = time
            } else if (typeof (time) === 'number') {
                this.time = new Date(time)
            } else if (typeof (time) == "string") {
                this.time = new Date(time)
            } else if (typeof (time) == "object") {
                this.time = time
            } else {
                console.log("error : conversation :  wrong type of time : ", typeof (time), time)
                this.time = new Date()
            }

            this.avatar = avatar
            this.message = message

            if (counter === undefined) {
                this.counter = counter
            } else if (typeof (counter) == "number") {
                this.counter = counter
            } else if (typeof (counter) == "string") {
                this.counter = parseInt(counter)
            } else {
                console.log("error : conversation :  unknown counter type : ", typeof (counter), counter)
                this.counter = undefined
            }

            if (index === undefined) {
                this.index = index
            } else if (typeof (index) == "number") {
                this.index = index
            } else if (typeof (index) == "string") {
                this.index = parseInt(index)
            } else {
                console.log("error : conversation :  unknown index type : ", typeof (index), index)
                this.index = undefined
            }

            if (muted === undefined) {
                this.muted = muted
            } else if (typeof (muted) == "boolean") {
                this.muted = muted
            } else if (typeof (muted) == "string") {
                if (muted.toLowerCase == "false") {
                    this.muted = false
                } else if (muted.toLowerCase == "true") {
                    this.muted = true
                } else {
                    console.log("error : conversation :  unknown muted value : ", muted)
                    this.muted = undefined
                }

            } else {
                console.log("error : conversation :  unknown muted type : ", typeof (muted), muted)
                this.muted = undefined
            }

        }

        print() {
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
    function AddConvoHtml(appName, convo) {
        let displayCounter = "display: none;"
        if (convo.counter) {
            displayCounter = ""
        }

        return '\
        <div class="td-convo theme-transduction td-font" data-user-i-d='+ convo.userID + ' app-name=' + appName + '>\
            <div class="col-hint">\
                <div class="row-hint theme-'+ appName + '"></div>\
            </div>\
            <div class="col-avatar d-flex justify-content-center">\
                <div class="td-avatar align-self-center" style="background-image: url('+ convo.avatar + ')"></div>\
                <div class="td-counter" style="'+ displayCounter + '">\
                    <div style="align-self:center;">'+ convo.counter + '</div>\
                </div>\
            </div >\
        <div class="col col-text flex-column justify-content-center">\
                <div class="m-0 td-nickname">'+ convo.nickName + '</div>\
                <div class="m-0 td-text">'+ convo.message + '</div>\
            </div>\
        <div class="col-auto pl-0 col-timestamp justify-content-end">\
            '+ convo.time.toTimeString().slice(0, 5) + '\
            </div>\
        </div > '
    }

    function ChangeConvoHtml(appName, convo) {
        let objConvo = $('#td-left [app-name=' + appName + '][data-user-i-d="' + convo.userID + '"]').clone()
        if (objConvo.length) { // 检测存在
            $('#td-left [app-name=' + appName + '][data-user-i-d="' + convo.userID + '"]').remove()
            for (let key in convo) {
                if (convo[key] != undefined) {
                    switch (key) {
                        case "avatar":
                            $(objConvo).find("div.td-avatar").attr("style", 'background-image: url(' + convo.avatar + ')')
                            break;
                        case "counter":
                            $(objConvo).find("div.td-counter div").text(convo.counter)
                            if (convo.counter) {
                                $(objConvo).find("div.td-counter").css("display", "")
                            } else {
                                $(objConvo).find("div.td-counter").css("display", "none")
                            }
                            break;
                        case "nickName":
                            $(objConvo).find("div.td-nickname").text(convo.nickName)
                            break;
                        case "message":
                            $(objConvo).find("div.td-text").text(convo.message)
                            break;
                        case "time":
                            $(objConvo).find("div.col-timestamp").text(convo.time.toTimeString().slice(0, 5))
                            break;
                        default:
                            break;
                    }
                }
            }
            $('#td-left').prepend(objConvo)
        }
    }

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

            if (key == 'Dialog') {
                // 收到某个用户聊天记录
                console.log("debug : ", "==========Dialog============")
                console.log(Obj)

                resolve("copy that.")
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

                if (Convo.action === 'a') {
                    console.log('going to insert html snippet')
                    // console.log(typeof Convo.time)
                    // console.log(convoHtml('skype', Convo))
                    // 覆盖消息
                    $('#td-left [app-name=' + webTag + '][data-user-i-d="' + Convo.userID + '"]').remove()
                    $('#td-left').prepend(AddConvoHtml(webTag, Convo))
                } else if (Convo.action === 'c') {
                    console.log('going to change html snippet')
                    ChangeConvoHtml(webTag, Convo)
                }

                resolve("copy that")
            }

            setTimeout(() => {
                reject("time out")
            }, 1000);

        })

    }

    // =============================程序主体=============================


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
    // $("#wechatGet").click(() => {
    //     $("#insert").empty()
    //     if ($("#userID").val() != '') {
    //         core.HostSendToWeb("webviewWechat", { "get": $("#userID").val() }).then((res) => {
    //             console.log(""res)
    //         }).catch((error) => {
    //             throw error
    //         });
    //     }

    // })

    // 点击convo
    $('#td-left').on('click', 'div.td-convo', function() {
        // 识别webtag
        let webTag =  $(this).attr("app-name")
        let userID = $(this).attr("data-user-i-d")

        if(webTag == undefined || userID == undefined){
            console.log("error : click obj error.")
            console.log("obj : ", this) 
            console.log("userID : ", userID) 
        }else{
            webTag = "webview" + (webTag[0]).toUpperCase() + webTag.substr(1)
            // console.log("debug : " + webTag + " click.")
            core.HostSendToWeb(webTag, {"queryDialog":{"userID":userID}}).then((res) => {
                console.log("queryDialog : webReply : ", res)
            }).catch((error) => {
                throw error
            })
        }
    }); 

    console.log("toggle")
    toggleWebview()
})
