// =========================全局函数和变量===========================
// *********************************************
// navigator setting
// ---------------------------------------------
Object.defineProperty(navigator, 'language', {
    value: 'en',
    configurable: false,
    writable: false,
})
Object.defineProperty(navigator, 'languages', {
    value: ['en'],
    configurable: false,
    writable: false,
})
// *********************************************

// /**
//  * 开关webview
//  */
// function toggleWebview() {
//     // document.querySelectorAll('webview').forEach((e) => {
//     //     if (e.style.display === 'none') {
//     //         e.style.display = ''
//     //     } else {
//     //         e.style.display = 'none'
//     //     }
//     // })
//     if (document.body.style.overflow === 'hidden') {
//         document.body.style.overflow = ''
//     } else {
//         window.scrollTo(0, 0)
//         document.body.style.overflow = 'hidden'
//     }
// }

/**
 * 指定开关webview
 * @param {String} webTag webview名字 skype, wechat....
 */
function toggleWebview(webTag) {
    $("#modal-" + webTag).modal('toggle')
}

/**
 * 打开webview Devtool
 * @param {string} appName
 */
function openDevtool(appName) {
    let web = $("webview[data-app-name='" + appName + "']")[0];
    web.openDevTools();
}

function openExtensionDevtool(appName) {
    let web = $("webview[data-extension-name='" + appName + "']")[0];
    web.openDevTools();
}

function listWebview() {
    $("webview").toArray().forEach((e, i) => {
        console.log($(e).attr('data-app-name'))
    })
}

function modalImage(event) {
    document.getElementById('modal-image').querySelector('img').src = event.target.src
    $('#modal-image button').attr('href', event.target.src)
    $("#modal-image").modal()
}






$(document).ready(function () {

    const core = require("../js/core.js")
    const { nativeImage, dialog, shell } = require('electron').remote
    const Store = require('electron-store');
    const store = new Store();

    // const  = require('electron').shell;
    // const _ = require('../toolkit/lodash-4.17.11.js');
    console.log(process.versions.electron)

    let fileList = {}; //临时储存file object

    let inputImgHeightLimit = 100
    let inputImgWeightLimit = 600


    let status = "webviewSkype"
    let debug_app_link_str = "#debug-app-link"
    let debug_firefox_send_str = "#debug-firefox-send"
    let debug_image_str = "#debug-image"
    let debug_send_str = "#debug-send"
    let debug_latex_str = "#debug-latex2png"
    let debug_goBackChat_str = "#debug-goBackChat"

    let sendingList = {};

    let tdPinCoord = undefined
    let tdSettings = undefined

    tdPinCoord = store.get('tdPinCoord')
    if (tdPinCoord === undefined) {
        tdPinCoord = [0, 0]
    }

    tdSettings = store.get('tdSettings')
    if (tdSettings === undefined) {
        tdSettings = {
            swTray: true
        }
    }
    //console.log('load tdPinCoord : ', tdPinCoord)
    document.getElementById('td-pin').style.left = tdPinCoord[0] + 'px'
    document.getElementById('td-pin').style.bottom = tdPinCoord[1] + 'px'



    // =========================class===========================
    class conversation {
        constructor(action, userID, nickName, time, avatar, message, counter, index, muted) {
            this.action = action
            this.userID = userID
            this.nickName = nickName

            // time为str
            if (time === undefined) {
                this.time = time
            } else if (typeof (time) === 'number') {
                this.time = (new Date(time)).toTimeString().slice(0, 5)
            } else if (typeof (time) == "string") {
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
    /**
     * 
     * @param {String} webTag slype, wechat...
     * @returns {String} webview的selector
     */
    function webTag2Selector(webTag) {
        return "webview[data-app-name='" + webTag + "']"
    }

    /**
     * 添加左侧
     * @param {*} appName 
     * @param {*} convo 
     */
    function AddConvoHtml(appName, convo) {
        let displayCounter = "display: none;"
        let visibility = "td-invisible"
        if (convo.counter) {
            displayCounter = ""
        }
        if(convo.muted) {
            visibility = ""
        }

        let avatar = convo.avatar == undefined ? '../res/pic/weird.png' : convo.avatar

        return '\
        <div class="td-convo theme-transduction td-font" data-user-i-d='+ convo.userID + ' data-app-name=' + appName + ' muted=' + convo.muted + '>\
            <div class="col-appLogo">\
                <img src="../res/pic/'+ appName + '.png">\
            </div>\
            <div class="col-hint">\
                <div class="row-hint theme-'+ appName + '"></div>\
            </div>\
            <div class="col-avatar d-flex justify-content-center">\
                <div class="td-avatar align-self-center" style="background-image: url('+ avatar + ')"></div>\
                <div class="td-counter" style="'+ displayCounter + '">\
                    <div style="align-self:center;">'+ convo.counter + '</div>\
                </div>\
            </div >\
        <div class="col col-text flex-column justify-content-center">\
                <div class="m-0 td-nickname">'+ convo.nickName + '</div>\
                <div class="m-0 td-text">'+ convo.message + '</div>\
            </div>\
            <div class="col-auto pl-0 col-timestamp justify-content-around">\
                '+ convo.time + '\
                <img class="' + visibility + ' align-self-center" src="../res/pic/mute.svg" height="18px">\
            </div>\
        </div > '
    }

    /**
     * 添加右侧
     * @param {*} dialog 
     */
    function AddDialogHtml(dialog) {

        let strHtml = ''

        let timeObj = undefined

        if (typeof (dialog["time"]) === 'number') {
            timeObj = new Date(dialog["time"])
        } else if (typeof (dialog["time"]) == "string") {
            timeObj = new Date(dialog["time"])
        } else if (typeof (dialog["time"]) == "object") {
            timeObj = dialog["time"]
        } else {
            timeObj = new Date()
        }
        let time = timeObj.toTimeString().slice(0, 5)

        let content = ''
        if (dialog['type'] == 'text') {
            content =
                '<div class="td-chatText">'
                + dialog['message'] +
                '</div>'
        } else if (dialog['type'] == 'img') {
            content =
                '<div class="td-chatImg">\
                    <img src="' + dialog['message'] + '" onclick="modalImage(event)"></img>\
                </div>'
        } else if (dialog['type'] == 'url') {
            if (dialog['message'].search('https://send.firefox.com/download') !== -1) {
                content =
                    '<div class="td-chatText">\
                    <span class="badge badge-pill badge-light py-0 mt-1">\
                        <img src="../res/pic/ffsend.logo.svg" height="15px">\
                    </span>\
                    <a href="'+ dialog['message'] + '">' + dialog['message'] + '</a>\
                    <p style="margin:0;"></p>\
                </div>'
            } else {
                content =
                    '<div class="td-chatText">\
                    <a  href="' + dialog['message'] + '">' + dialog['message'] + '</a>\
                    <p style="margin:0;"></p>\
                </div>'
            }
        } else if (dialog['type'] == 'file') {
            content =
                '<div class="td-chatText">\
                    <div style="display: flex; flex-direction: row;">\
                        <img src="../res/pic/document.svg" height="56px">\
                        <div style="display: flex; flex-direction: column;">\
                            <p style="margin:0 0 0 1rem;">' + dialog['fileName'] + '</p>\
                            <div style="display: flex; flex-direction:row; justify-content: space-around;">\
                                <p style="margin:0;">' + dialog['fileSize'] / 1000. + ' KB' + '</p>\
                                <button href="' + dialog['message'] + '" class="btn p-0 btn-link" download>下载</button>\
                            </div>\
                        </div>\
                    </div>\
                    <p style="margin:0;"></p>\
                </div>'
        } else if (dialog['type'] == 'unknown') {
            content =
                '<div class="td-chatText">\
                    <a class="badge badge-pill badge-warning mt-1">Unsupported MSG Type</a>\
                    <p style="margin:0;">'
                + dialog['message'] +
                '</p>\
                </div>'
        } else {
            content =
                '<div class="td-chatText">'
                + dialog['message'] +
                '</div>'
        }


        if (dialog["from"]) {
            let userID = $("#td-right div.td-chat-title").attr("data-user-i-d")
            let appName = $("#td-right div.td-chat-title").attr("data-app-name")
            let avatarUrl = dialog["avatar"] === undefined ?
                $("#td-left \
            div.td-convo[data-user-i-d='" + userID + "'][data-app-name='" + appName + "'] \
            div.td-avatar").css('background-image').slice(5, -2)
                : dialog["avatar"]

            strHtml =
                '<div class="td-bubble" msgID="' + dialog['msgID'] + '"  msgTime="' + timeObj.getTime() + '">\
                    <p class="m-0">'+ dialog["from"] + '</p>\
                    <div class="td-them">\
                        <div class="td-chatAvatar">\
                            <img src="'+ avatarUrl + '">\
                            <p class="m-0">'+ time + '</p>\
                        </div>'
                + content +
                '</div>\
                </div>'
        } else {
            strHtml =
                '<div class="td-bubble" msgID="' + dialog['msgID'] + '"  msgTime="' + timeObj.getTime() + '">\
                    <div class="td-me">'
                + content +
                '<p class="m-0">' + time + '</p>\
                    </div>\
                </div>'
        }
        return strHtml
    }

    function ChangeConvoHtml(appName, convo) {
        let objConvo = $('#td-convo-container [data-app-name=' + appName + '][data-user-i-d="' + convo.userID + '"]').clone()
        if (objConvo.length) { // 检测存在
            $('#td-convo-container [data-app-name=' + appName + '][data-user-i-d="' + convo.userID + '"]').remove()
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
                            $(objConvo).find("div.col-timestamp").text(convo.time)
                            break;
                        case "muted":
                            $(objConvo).attr('muted', convo.muted)
                            break;
                        default:
                            break;
                    }
                }
            }
            $('#td-convo-container').prepend(objConvo)
        }
    }

    function rightBackToDefault() {
        // 右侧恢复到开始状态
        $('.td-chat-title').removeAttr('data-user-i-d')
        $('.td-chat-title').removeAttr('data-app-name')
        $('.td-chat-title > h2').text('')
        $('.td-chat-title > img').attr('src', '../res/pic/nothing.png')

        $('.td-chatLog[wintype="chatLog"]').empty()
        $('.td-chatLog[wintype="chatLog"]').append('\
                         <div class="td-default">\
                             <p>\
                                 商业合作，问题反馈，请联系c4r。\
                             </p>\
                             <p>\
                                 business cooperation, bug report, please contact c4r.\
                             </p>\
                         </div>')
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


        return Promise.race([new Promise((resolve, reject) => {

            if ($(webTag2Selector(webTag)).length == 0) {
                reject("respFuncWinReplyWeb : no " + webTag + "exist")
                return
            }

            console.log("debug : ", "----------------------")
            console.log("debug : ", "Convo from ", webTag)
            console.log(Obj)

            if (key == 'Dialog') {
                // 收到某个用户聊天记录
                console.log("debug : ", "==========Dialog============")
                if (Obj.length == 0) {
                    reject("error : respFuncWinReplyWeb : no Dialog")
                    return
                }
                // console.log(Obj)
                let userID = (Obj[0])["userID"]
                if (!userID) {
                    reject("error : respFuncWinReplyWeb : no userID")
                    return
                }
                if (webTag != $("#td-right div.td-chat-title").attr('data-app-name')) {
                    resolve("nothing change")
                    return
                }
                if (userID != $("#td-right div.td-chat-title").attr('data-user-i-d')) {
                    resolve("nothing change")
                    return
                }


                // 判断当前用户是否在看最后一条
                let atBottom = false

                let dialogSelector = "#td-right div.td-chatLog[wintype='chatLog']"
                // 附加到右边
                if ($(dialogSelector + " div.td-bubble").length == 0) {
                    // 窗口已被清空, 直接附加
                    Obj.forEach((value, index) => {
                        $(dialogSelector).append(AddDialogHtml(value))
                    })

                    // 滑动到最下面
                    $(dialogSelector).scrollTop($(dialogSelector)[0].scrollHeight)
                    atBottom = true
                } else {

                    if ($(dialogSelector).is(":visible") &&
                        Math.abs($(dialogSelector).scrollTop() + $(dialogSelector)[0].clientHeight - $(dialogSelector)[0].scrollHeight) < 64) {
                        atBottom = true
                        console.log("要滚动啊.......")
                    } else {
                        console.log("滑条 : ", $(dialogSelector).scrollTop(), $(dialogSelector)[0].clientHeight, $(dialogSelector)[0].scrollHeight)
                        console.log("不滚动啊.......")
                    }

                    // 拿到已有bubble的时间, 并且按照顺序储存
                    let arrayExistBubble = new Array()
                    $(dialogSelector + " div.td-bubble").each((index, element) => {
                        let msgTimeStr = $(element).attr("msgTime")
                        let msgTime = parseInt(msgTimeStr)
                        let msgId = $(element).attr("msgID")
                        if (msgTimeStr != undefined && msgId != undefined) {

                            arrayExistBubble.push({ 'msgTime': msgTime, 'msgID': msgId })
                        }
                    })

                    Obj.forEach((value, index) => {


                        let timeObj = undefined

                        if (typeof (value["time"]) === 'number') {
                            timeObj = new Date(value["time"])
                        } else if (typeof (value["time"]) == "string") {
                            timeObj = new Date(value["time"])
                        } else if (typeof (value["time"]) == "object") {
                            timeObj = value["time"]
                        } else {
                            timeObj = new Date()
                        }

                        let timeWaitInsert = timeObj.getTime()
                        // console.log("debug : ", value["time"], " timeWaitInsert", timeWaitInsert)

                        // 在index对应的bubble之前插入
                        let currentInsertIndex = 0
                        for (let indexOfExistBubble = 0;
                            indexOfExistBubble < arrayExistBubble.length; indexOfExistBubble++) {
                            if (value.msgID == arrayExistBubble[indexOfExistBubble].msgID) {
                                currentInsertIndex = -(indexOfExistBubble + 1)
                            }
                            if (currentInsertIndex >= 0 && timeWaitInsert > arrayExistBubble[indexOfExistBubble].msgTime) {
                                // console.log("later : ", indexOfExistBubble, arrayExistBubble[indexOfExistBubble].msgTime)
                                currentInsertIndex = indexOfExistBubble
                            }
                        }

                        // console.log('insert before : ', currentInsertIndex, 'in ', arrayExistBubble)

                        if (currentInsertIndex >= 0) {
                            if (currentInsertIndex == arrayExistBubble.length - 1 
                                && timeWaitInsert > arrayExistBubble[arrayExistBubble.length - 1 ].msgTime) {

                                $(dialogSelector).append(AddDialogHtml(value))

                                arrayExistBubble.push({ 'msgTime': timeWaitInsert, 'msgID': value.msgID })
                            } else {
                                $(AddDialogHtml(value))
                                    .insertBefore(
                                        dialogSelector
                                        + " [msgID='" + arrayExistBubble[currentInsertIndex].msgID + "']"
                                    )

                                arrayExistBubble.slice(currentInsertIndex, 0, { 'msgTime': timeWaitInsert, 'msgID': value.msgID })
                            }

                        } else {
                            // 重复的ID, 替换成新的
                            $(dialogSelector
                                + " [msgID='" + arrayExistBubble[-currentInsertIndex - 1].msgID + "']")
                                .replaceWith(AddDialogHtml(value)
                                )
                            // arrayExistBubble[-currentInsertIndex - 1].msgTime
                        }


                    })
                    // 

                }


                // 判断用户当前所在位置, 如果用户在阅读之前的bubble就不应该滚动滑条
                if (atBottom) {
                    // 滑动到最下面
                    $(dialogSelector).scrollTop($(dialogSelector)[0].scrollHeight)

                    // 取消unread
                    console.log('focusing innnnnnnnnnnn')
                    // $(webTag2Selector(webTag)).focus()
                    console.log(document.activeElement)

                    console.log('bluring outttttttttttttttttttt')
                    $(webTag2Selector(webTag)).blur()
                    console.log(document.activeElement)
                } else {

                    console.log("dialog updated. new bubble(s) not display...")
                }




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

                // 判断右侧窗口是否为当前convo

                let DialogUserID = $("#td-right div.td-chat-title").attr("data-user-i-d")
                let DialogWebTag = $("#td-right div.td-chat-title").attr("data-app-name")
                if (DialogUserID && DialogWebTag
                    && DialogUserID == Convo.userID
                    && DialogWebTag == webTag) {
                    // 判断窗口是否显示状态(可能打开的是extension), 并且滑条在最下面
                    let strDialogSelector = "#td-right div.td-chatLog[wintype='chatLog']"
                    if ($(strDialogSelector).is(":visible") &&
                        $(strDialogSelector).scrollTop() + $(strDialogSelector)[0].clientHeight == $(strDialogSelector)[0].scrollHeight) {

                        if (document.hasFocus()) {
                            // 取消新消息未读, 和声音提示
                            Convo.counter = 0
                        }
                        // setTimeout(() => {
                        // console.info("focusssssss")
                        // $(webTag2Selector(webTag)).focus()
                        // }, 10000);

                    }

                    // 刷新dialog
                    core.HostSendToWeb(
                        webTag2Selector(webTag),
                        { "queryDialog": { "userID": Convo.userID } }
                    ).then((res) => {
                        console.log("queryDialog : webReply : ", res)

                    }).catch((error) => {
                        throw error

                    })



                }


                if (!Convo.muted) {
                    core.sendToMain({ 'flash': '' })
                }

                if (Convo.action === 'a') {
                    console.log('going to insert html snippet')
                    // console.log(typeof Convo.time)
                    // console.log(convoHtml('skype', Convo))
                    // 覆盖消息
                    let active =
                        $('#td-convo-container [data-app-name=' + webTag + '][data-user-i-d="' + Convo.userID + '"]')
                            .hasClass('theme-transduction-active')

                    $('#td-convo-container [data-app-name=' + webTag + '][data-user-i-d="' + Convo.userID + '"]').remove()
                    $('#td-convo-container').prepend(AddConvoHtml(webTag, Convo))
                    if (active) {
                        $('#td-convo-container [data-app-name=' + webTag + '][data-user-i-d="' + Convo.userID + '"]')
                            .addClass('theme-transduction-active')
                    }
                } else if (Convo.action === 'c') {
                    console.log('going to change html snippet')
                    ChangeConvoHtml(webTag, Convo)
                } else if (Convo.action === 'r') {
                    console.log('going to remove convo')
                    let active =
                        $('#td-convo-container [data-app-name=' + webTag + '][data-user-i-d="' + Convo.userID + '"]')
                            .hasClass('theme-transduction-active')

                    $('#td-convo-container [data-app-name=' + webTag + '][data-user-i-d="' + Convo.userID + '"]').remove()
                    if (active) {
                        rightBackToDefault()
                    }
                }

                resolve("copy that")
            } else if (key == 'focus') {
                console.log('focusing innnnnnnnnnnn')
                // let activeE = document.activeElement
                $(webTag2Selector(webTag)).focus()
                setTimeout(() => {
                    // $(activeE).focus()
                    $(".td-inputbox").focus()
                    console.log(document.activeElement)
                }, 3000);
                resolve("focus done")
            } else if (key == 'blur') {
                console.log('bluring outttttttttttttttttttt')
                $(webTag2Selector(webTag)).blur()
                console.log(document.activeElement)
                resolve("blur done")
            } else if (key == 'attachFile') {
                // 上传文件
                /* obj
                    "selector": str 
                    "file" : obj file
                */
                attachInputFile(webTag2Selector(webTag), Obj.selector, fileList[Obj.file.fileID].path)

                resolve("attached")
            } else if (key == 'simulateKey') {
                // 按键模拟

                keypressSimulator(webTag2Selector(webTag), Obj.type, Obj.charCode, Obj.shift, Obj.alt, Obj.ctrl, Obj.cmd)

                resolve("simulated")
            } else if (key == 'logStatus') {
                // 登录状态
                // console.log("============================================================")
                if (Obj.status) {
                    // let color = 'red'

                    if (Obj.status == 'offline') {
                        console.log(webTag + " not log yet.")
                        $('#app-' + webTag).removeClass('app-online')
                        $('#app-' + webTag).addClass('app-offline')

                        // 去掉聊天记录
                        $('#td-convo-container > div').each((index, element) => {
                            if ($(element).is('[data-app-name="' + webTag + '"]')) {
                                $(element).remove()
                            }
                        })
                        // 右侧恢复到开始状态
                        rightBackToDefault()

                        // 空白页


                    } else if (Obj.status == 'online') {
                        console.log(webTag + " is logged already.")
                        $('#app-' + webTag).removeClass('app-offline')
                        $('#app-' + webTag).addClass('app-online')
                        // color = 'green'
                    } else if (Obj.status == 'failure') {
                        console.log(webTag + " log failed")
                        $('#app-' + webTag).removeClass('app-online')
                        $('#app-' + webTag).addClass('app-offline')
                    }

                    // 修改登录状态
                    //     let selector = "#test-2 p[data-app-name='" + webTag + "']"
                    //     if ($(selector).length == 0) {
                    //         $("#test-2").append(
                    //             "<p data-app-name='" + webTag + "'>" + webTag + " : " + Obj.status + "</p>")
                    //         $(selector).css("background-color", color);
                    //     } else {
                    //         $(selector).text(webTag + " : " + Obj.status)
                    //         $(selector).css("background-color", color);
                    //     }
                }

            } else if (key == 'queryToggleStatus') {
                // webview查询自己是打开还是关闭的

            } else if (key == 'show') {
                // 显示对应webview
                // Obj里应该储存要定位的位置
                console.log(webTag + "说 : 我要显摆我自己~")
                // $('#modal-' + webTag).modal('show')
                // $("#test-" + webTag + "-toggle").text("快打开" + webTag)
                // $("#test-" + webTag + "-toggle").css("background-color", '#ffc107')
            } else if (key == 'hide') {
                // 隐藏webview
                console.log(webTag + "说 : 快把我关掉!")
                $('#modal-' + webTag).modal('hide')
                // $("#test-" + webTag + "-toggle").text("快关上" + webTag)
                // $("#test-" + webTag + "-toggle").css("background-color", '#866606')
            }

        }),
        new Promise((resolve, reject) => {
            let erTime = setTimeout(() => {
                clearTimeout(erTime)
                reject("respFuncWinReplyWeb : " + key + " time out")
            }, 5000);
        })])

    }

    /**
     * 
     * @param {String} sectionSelector 要插入的webview 的父节点
     * @param {String} extensionName 插件名称
     * @param {String} strUrl 插件地址
     * @param {String} strPathJS JS地址
     * @returns {Boolean} 加载成功或失败
     */
    function loadExtension(sectionSelector, extensionName, strUrl, strPathJS) {

        // 检测selector
        if ($(sectionSelector).length == 0) {
            console.log("loadExtension : cannot find section by " + sectionSelector)
            return false
        } else if ($(sectionSelector).length > 1) {
            console.log("loadExtension : multiple sections found by " + sectionSelector)
            return false
        }

        // 检查文件路径
        if (strPathJS.length > 0) {
            let JSexist = false
            fs.stat(strPathJS, function (err, stat) {
                if (stat && stat.isFile()) {
                    JSexist = true
                }
            });
            if (!JSexist) {
                console.log("loadExtension : cannot find JS file")
                return false
            }


        }



        let webSelector = sectionSelector + " webview[data-extension-name='" + extensionName + "']"
        if ($(webSelector).length == 0) {
            console.log("loadExtension : create extension")
            // 隐藏所有webview
            $(sectionSelector + " webview").each(function (index) {
                $(this).hide();
            });
            $(sectionSelector).append("<webview style='width:100%; height:100%' data-extension-name='" + extensionName + "' src='' preload='' style='display:none;'></webview>")

            $(webSelector).attr("data-extension-name", extensionName)

            $(webSelector).attr('src', strUrl)

            $(webSelector).attr('preload', strPathJS)

            $(webSelector).show()

        } else {
            if ($(webSelector).css("display") == "none") {
                console.log("loadExtension : display extension")
                $(sectionSelector + " webview").each(function (index) {
                    $(this).hide();
                });

                // console.log("loadextension : ", strUrl, $(webSelector).attr('src'))
                if ($(webSelector).attr('src') != strUrl) {
                    $(webSelector).attr('src', strUrl)
                }

                $(webSelector).show()



            } else {
                // 隐藏所有webview
                $(sectionSelector + " webview").each(function (index) {
                    $(this).hide();
                });
                console.log("loadExtension : reload extension")

                $(webSelector).attr("data-extension-name", extensionName)


                $(webSelector).attr('src', strUrl)
                // console.log("loadextension : ", strUrl, $(webSelector).attr('src'))

                $(webSelector).attr('preload', strPathJS)

                $(webSelector).show()
            }
        }

        return true
    }

    function getFileNameFromUrl(url) {
        return url.split('/').pop().split('#')[0].split('?')[0];
    }

    /**
     * 将拖拽到网页或者粘贴到网页的DataTransfer转化成array
     * bug : 粘贴url时text和url不一致不能合并, 如papercomment.tech网址直接拖拽
     * @param {DataTransfer} data 
     * @returns {Promise} 
     *  arra[{'key':value},{}] 
     *  key : file text url
     */
    function filterDataTransfer(data) {

        return new Promise((resolve, reject) => {
            let arrayItem = new Array();

            let uniqueItem = new Array();

            let arrayString = new Array()

            let objHTML = data.getData('text/html') // 拖拽的是一个含有链接的东西, html, 在线img, 文件
            let strURL = data.getData('URL')
            console.log('--------objHTML-----------')
            console.log(objHTML)
            console.log('--------strURL-----------')
            console.log(strURL)
            if (objHTML && $(objHTML).get(0).nodeName == 'IMG' && $(objHTML).attr('src')) {
                console.log("发现图片")
                let pathR = $(objHTML).attr('src')
                let pathFile = undefined

                if (pathR.length >= 8 && pathR.substring(0, 7) == 'file://') {

                    pathFile = pathR.substring(7)
                    // console.log("本地文件", pathFile)
                    let img = nativeImage.createFromPath(pathFile)
                    arrayItem.push(new Promise(
                        (resolve, reject) => {

                            if (img.isEmpty()) {
                                reject('filterDataTransfer : img not access')
                            } else {
                                let imgSend = new core.fileSend(getFileNameFromUrl(pathFile), pathFile, '', undefined, img.toDataURL())
                                resolve(imgSend)
                            }
                        }))
                } else if ((pathR.length > 9 && pathR.substring(0, 8) == 'https://') || (pathR.length > 8 && pathR.substring(0, 7) == 'http://')) {
                    arrayItem.push(new Promise(
                        (resolve, reject) => {
                            var request = require('request').defaults({ encoding: null });

                            request.get(pathR, function (error, response, body) {
                                if (!error && response.statusCode == 200) {
                                    let strRequest = new Buffer(body).toString('base64')
                                    let urldata = "data:" + response.headers["content-type"] + ";base64," + strRequest;
                                    // console.log("------request-----")
                                    // console.log(strRequest)
                                    if (strRequest) {
                                        let imgSend = new core.fileSend(getFileNameFromUrl(pathR), '', pathR, undefined, urldata)
                                        resolve(imgSend)
                                    } else {
                                        reject('filterDataTransfer : img not access')
                                    }


                                }

                            });


                        }))
                }

                // console.log(img.getSize())

            } else if (strURL) {
                console.log("发现网址")
                arrayItem.push(Promise.resolve(strURL))
            } else {
                if (data.items) {
                    let items = data.items

                    console.log("---found items---", items.length)
                    // Use DataTransferItemList interface to access the file(s)
                    for (var i = 0; i < items.length; i++) {
                        console.log(i, "item", items[i].kind, items[i].type, items[i])
                        // If dropped items aren't files, reject them
                        if ((items[i].kind == 'string') &&
                            (items[i].type.match('^text/plain'))) {
                            // This item is the target node

                            arrayItem.push(new Promise(
                                (resolve, reject) => {
                                    items[i].getAsString(function (s) {
                                        // console.log("... Drop: text ", typeof (s), s)
                                        // ev.target.appendChild(document.getElementById(s));
                                        resolve(s)
                                    });
                                }))

                        } else if ((items[i].kind == 'string') &&
                            (items[i].type.match('^text/html'))) {
                            // Drag data item is HTML
                            items[i].getAsString(function (s) {
                                // console.log("... Drop: HTML", s)
                                // ev.target.appendChild(document.getElementById(s));
                            });
                        } else if ((items[i].kind == 'string') &&
                            (items[i].type.match('^text/uri-list'))) {
                            // Drag data item is URI
                            // arrayItem.push(new Promise(
                            //     (resolve, reject) => {

                            //         items[i].getAsString(function (s) {
                            //             // console.log("... Drop: URI ", typeof (s), s)
                            //             // ev.target.appendChild(document.getElementById(s));
                            //             arrayString.push(s)
                            //             resolve(s)
                            //         });
                            //     }))

                        } else if ((items[i].kind == 'file') &&
                            (items[i].type.match('^image/'))) {
                            // Drag data item is an image file
                            arrayItem.push(new Promise(
                                (resolve, reject) => {

                                    // console.log("file")
                                    let file = items[i].getAsFile()
                                    let imgSend = new core.fileSend(file.name, file.path, '')
                                    let reader = new FileReader();
                                    reader.onload = function (e) {
                                        imgSend.addDataUrl(reader.result)
                                        resolve(imgSend)
                                    }
                                    reader.readAsDataURL(file)

                                }))
                            // console.log('... name = ' + file.name + ' path = ' + file.path);
                        }
                    }

                } else {
                    console.log("---found files---")
                    // Use DataTransfer interface to access the file(s)
                    for (var i = 0; i < data.files.length; i++) {
                        // console.log(data.files[i])
                        let file = data.files[i]

                        arrayItem.push(new Promise(
                            (resolve, reject) => {
                                let imgSend = new core.fileSend(file.name, file.path, '')
                                let reader = new FileReader();
                                reader.onload = function (e) {
                                    imgSend.addDataUrl(reader.result)
                                    resolve(imgSend)
                                }
                                reader.readAsDataURL(file)
                            }))


                    }
                }
            }



            // arrayString = uniqueString

            Promise.all(arrayItem).then((valueItems) => {
                // console.log("finish array")
                // console.log(arrayString.length)

                uniqueItem = uniqueItem.concat(arrayString)

                // console.log(uniqueItem)

                valueItems.forEach((item, index) => {
                    if (typeof (item) == "string") {
                        // arrayString.push(item)
                        let contains = false
                        arrayString.forEach(iStr => {
                            contains = (contains || iStr.includes(item))
                        })
                        if (!contains) {
                            uniqueItem.push(item)
                        }

                    } else {
                        uniqueItem.push(item)
                    }
                })

                console.log('-----uniqueItem-------')
                console.log(uniqueItem)

                resolve(uniqueItem)

            }).catch(error => {
                reject({ 'string': error })
            })

        })
    }


    /**
     * 将input转化成array
     * @param {FileList} data 
     * @returns {Promise} 
     *  arra[{'key':value},{}] 
     *  key : file text url
     */
    function filterFiles(files) {

        return new Promise((resolve, reject) => {
            let arrayItem = new Array();

            console.log("---found files---")
            // Use DataTransfer interface to access the file(s)
            for (var i = 0; i < files.length; i++) {
                // console.log(data.files[i])
                let file = files[i]

                arrayItem.push(new Promise(
                    (resolve, reject) => {
                        let imgSend = new core.fileSend(file.name, file.path, '')
                        let reader = new FileReader();
                        reader.onload = function (e) {
                            imgSend.addDataUrl(reader.result)
                            resolve(imgSend)
                        }
                        reader.readAsDataURL(file)
                    }))


            }


            Promise.all(arrayItem).then((valueItems) => {

                resolve(valueItems)

            }).catch(error => {
                reject({ 'string': error })
            })

        })
    }


    /**
     * get  image height and width from dataUrl
     * @param {dataUrl} dataUrl 
     * @returns {Promise} { width: , height:  }
     */
    function getImageSizeFromDataurl(dataUrl) {
        return new Promise(function (resolved, rejected) {
            var i = new Image()
            i.onload = function () {
                resolved({ width: i.width, height: i.height })
            };
            i.src = dataUrl
        })
    }

    /**
     * 图片根据最大宽度和高度, 按比例调整后的高宽. 该程序不对图片本身改变
     * @param {dataUrl} dataUrl 
     * @param {int} widthLimit 最大宽度
     * @param {int} heightLimit 最大高度
     * @returns {Promise} { "height":  , "width":  }
     */
    function autoSizeImg(dataUrl, widthLimit, heightLimit) {
        return new Promise(function (resolved, rejected) {
            // 准备压缩图片
            // let nImg = nativeImage.createFromDataURL(dataUrl)
            // let size = nImg.getSize()
            let size = getImageSizeFromDataurl(dataUrl).then((size) => {

                let scaleFactorHeight = 1.0
                let scaleFactorWidth = 1.0

                if (heightLimit > 0) {
                    scaleFactorHeight = heightLimit / size.height
                }

                if (widthLimit > 0) {
                    scaleFactorWidth = widthLimit / size.width
                }

                let scaleFactor = scaleFactorHeight > scaleFactorWidth ? scaleFactorWidth : scaleFactorHeight

                // let nPng = nativeImage.createFromBuffer(nImg.toPNG(),
                // {"width":Math.round(size.width*scaleFactor),
                // 'height':Math.round(size.height*scaleFactor) }) 

                // console.log("autoSizeImg : ", size.height, size.width, scaleFactor)

                resolved({ "height": size.height * scaleFactor, "width": size.width * scaleFactor })
            }).catch((err) => {
                rejected(err)
            })

        })

    }


    function itemToHTML(item) {
        return new Promise((resolve, reject) => {

            if (typeof (item) == 'string') {
                // insert string
                pasteHtmlAtCaret($($("<div> </div>").text(item)).html(), 'div.td-inputbox')

                resolve("")
            } else {
                // insert file
                item.addFileID(core.UniqueStr())
                //插入html
                // pasteHtmlAtCaret("&nbsp;<a data-file-ID='" + fileID + "' contenteditable=false>" + item.name + "</a>&nbsp;", 'div.td-inputbox')

                autoSizeImg(item.dataUrl, inputImgWeightLimit, inputImgHeightLimit).then((newSize) => {

                    item.localSave().then(() => {
                        console.log("debug : path : ", item.path, "-----------------------------------")
                        fileList[item.fileID] = item
                        if (pasteHtmlAtCaret(
                            "<img data-file-ID='"
                            + item.fileID
                            + "' contenteditable=false src='"
                            + item.path
                            + "' height='" + newSize.height + "' width='" + newSize.width + "' >", 'div.td-inputbox')) {
                            resolve("")
                        } else {
                            reject("error : itemToHTML : pasteHtmlAtCaret")
                        }
                    }).catch((err) => {
                        console.log("error : itemToHTML : localSave ")
                        console.log(err)
                        reject(err)
                    })

                }).catch((err) => {
                    reject("error : itemToHTML : autoSizeImg")
                })

            }
        })
    }

    /**
     * 将data数据转化为Html附加到页面上
     * @param {dataTransfer} data 
     */
    function processDataTransfer(data) {

        return new Promise((resolve, reject) => {

            filterDataTransfer(data).then((items) => {
                // console.log("start insert")
                items.forEach((item) => {

                    itemToHTML(item).then((resolveItemToHTML) => {
                        resolve(resolveItemToHTML)
                    }).catch(errorItemToHTML => {
                        reject(errorItemToHTML)
                    })
                })

            }).catch(error => {
                reject(error)
            })
        })
    }


    /**
     * 将input传入的data数据转化为Html附加到页面上
     * @param {FileList} fileList 
     */
    function processFileList(fileList) {
        return new Promise((resolve, reject) => {

            filterFiles(fileList).then((items) => {
                // console.log("start insert")
                items.forEach((item) => {
                    itemToHTML(item).then((resolveItemToHTML) => {
                        resolve(resolveItemToHTML)
                    }).catch(errorItemToHTML => {
                        reject(errorItemToHTML)
                    })
                })
            }).catch(error => {
                reject(error)
            })
        })

    }
    /**
     * 在光标处插入代码 
     * @param {String} html 
     * @param {String} selector JQselector 确保插入到正确的位置
     * @returns {boolean} 是否正确储存
     */
    function pasteHtmlAtCaret(html, selector = undefined) {
        var sel, range;
        if (window.getSelection) {
            // IE9 and non-IE
            sel = window.getSelection();
            if (sel.getRangeAt && sel.rangeCount) {
                range = sel.getRangeAt(0);
                range.deleteContents();

                var el = document.createElement("div");
                el.innerHTML = html;
                var frag = document.createDocumentFragment(), node, lastNode;
                while ((node = el.firstChild)) {
                    lastNode = frag.appendChild(node);
                }

                if (selector === undefined || $(range.startContainer).closest(selector).length > 0) {
                    range.insertNode(frag);

                    // Preserve the selection
                    if (lastNode) {
                        range = range.cloneRange();
                        range.setStartAfter(lastNode);
                        range.collapse(true);
                        sel.removeAllRanges();
                        sel.addRange(range);
                    }
                    return true
                }

            }
        }
        //  else if (document.selection && document.selection.type != "Control") {
        //     // IE < 9
        //     document.selection.createRange().pasteHTML(html);
        // }

        if (selector != undefined && $(selector).length > 0) {
            $(selector).append(html)
            return true
        }

        return false

    }

    /**
     * 去掉input html中的tag
     * getInput函数调用该函数
     * @param {String} HTML 
     * @returns {Array} 数组只包含string和File, 并按照input中顺序排列
     */
    function simpleInput(HTML) {
        let arrayHTML = jQuery.parseHTML(HTML);

        let sendStr = new Array()

        $.each(arrayHTML, function (i, el) {
            // console.log(el)
            if ($(el)[0].nodeName == '#text') {
                sendStr.push($(el).text())
            } else if ($(el)[0].nodeName == 'IMG') {
                let fileID = $(el).attr('data-file-ID')
                // let dataUrl = $(el).attr('data-file-id')
                sendStr.push(fileList[fileID])
                // sendStr.push(dataUrl)
            } else {
                sendStr = sendStr.concat(simpleInput($(el).html()))
            }
        })

        return sendStr
    }

    /**
     * 获取input中的内容
     * @param {String} selector 
     * @returns {Array} 以数组形式储存, 只含有string和File. 
     */
    function getInput(selector) {
        let arrayInput = simpleInput($(selector).get(0).innerHTML)
        let arraySimpleInput = new Array()


        let fileIndex = -1
        let strInput = ''
        arrayInput.forEach((value, index) => {
            // console.log(index, typeof (value), '----')
            // console.log(value)
            if (typeof (value) != 'string') {
                strInput = arrayInput.slice(fileIndex + 1, index).join('')
                if (strInput.length > 0) arraySimpleInput.push(strInput)

                arraySimpleInput.push(value)
                fileIndex = index
            }
        })

        strInput = arrayInput.slice(fileIndex + 1).join('')
        if (strInput.length > 0) arraySimpleInput.push(strInput)

        return arraySimpleInput
    }


    /**
     * chrome debugger for key : https://chromedevtools.github.io/devtools-protocol/1-2/Input 
     * e.g. : keypressSimulator('webview[data-app-name="skype"]','keypress',0x41)
     * @param {string} webSelector 'webview[data-app-name="skype"]'
     * @param {string} type keyup, keydown, keypress
     * @param {int} charCode windowsVirtualKeyCode(目前只对字母好使) code列表 https://docs.microsoft.com/en-us/windows/desktop/inputdev/virtual-key-codes
     * @param {boolean} [shift=false] 
     * @param {boolean} [alt=false] 
     * @param {boolean} [ctrl=false]  
     * @param {boolean} [cmd=false]  
     */
    function keypressSimulator(webSelector, type, charCode, shift = false, alt = false, ctrl = false, cmd = false) {


        let wc = $(webSelector).get(0).getWebContents();

        // console.log("---attachInputFile----")
        try {
            if (!wc.debugger.isAttached()) {
                wc.debugger.attach("1.1");
            }
        } catch (err) {
            console.error("Debugger attach failed : ", err);
        };
        var text = "";

        switch (type) {
            case 'keyup':
                type = 'keyUp';
                break;
            case 'keydown':
                type = 'rawKeyDown';
                break;
            case 'keypress':
                type = 'char';
                text = String.fromCharCode(charCode);
                break;
            default:
                throw new Error("Unknown type of event.");
                break;
        }

        var modifiers = 0;
        if (shift) {
            modifiers += 8;
        }
        if (alt) {
            modifiers += 1;
        }
        if (ctrl) {
            modifiers += 2;
        }
        if (cmd) {
            modifiers += 4;
        }

        return wc.debugger
            .sendCommand("Input.dispatchKeyEvent", {
                type: type,
                windowsVirtualKeyCode: charCode,
                modifiers: modifiers,
                text: text
            });

    }

    function attachInputFile(webSelector, inputSelector, filePath) {



        let wc = $(webSelector).get(0).getWebContents();

        console.log("---attachInputFile----")
        try {
            if (!wc.debugger.isAttached()) {
                wc.debugger.attach("1.1");
            }
        } catch (err) {
            console.error("Debugger attach failed : ", err);
        };



        wc.debugger.sendCommand("DOM.getDocument", {}, function (err, res) {
            wc.debugger.sendCommand("DOM.querySelector", {
                nodeId: res.root.nodeId,
                selector: inputSelector  // CSS selector of input[type=file] element                                        
            }, function (err, res) {
                if (res) { // 防止不存在inputSelector
                    wc.debugger.sendCommand("DOM.setFileInputFiles", {
                        nodeId: res.nodeId,
                        files: [filePath]  // Actual list of paths                                                        
                    }, function (err, res) {

                        wc.debugger.detach();
                    });
                } else {
                    console.log("error : attachInputFile : inputSelector : '", inputSelector, "' not exist.")
                }
            });

        });

    }




    function loadWebview(webTag, url, strUserAgent) {
        // console.log(strUserAgent)
        if ($(webTag2Selector(webTag)).length > 0) {
            console.log("load")
            $(webTag2Selector(webTag)).get(0).getWebContents().loadURL(url,
                {
                    "userAgent":
                        "userAgent : " + strUserAgent,
                    "extraHeaders": "User-Agent:" + strUserAgent + "\n"
                })
        }
    }




    // =============================程序主体=============================


    loadWebview("skype", "https://web.skype.com/", core.strUserAgentWin)
    loadWebview("wechat", "https://web.wechat.com/", core.strUserAgentWin)
    loadWebview("dingtalk", "https://im.dingtalk.com/", core.strUserAgentWin)

    // openDevtool("skype")
    // openDevtool("wechat")
    // openDevtool("dingtalk")


    //==============================UI==============================
    /**
     * 注释.....图钉跟随?
     */
    function followPin() {
        let target = document.getElementById('td-pin')
        let x = target.getBoundingClientRect().x
        let y = target.getBoundingClientRect().bottom
        tdPinCoord = [x, window.innerHeight - y]
        window.scrollTo(0, 0)
        document.getElementById('td-left').style.width = x + 'px'
        document.getElementById('td-input').style.height = window.innerHeight - y + 'px'
        store.set('tdPinCoord', tdPinCoord)
        // console.log('tdPinCoord changed to: ', tdPinCoord)
    }

    $('#td-pin').draggable({
        grid: [10, 10],
        containment: "#td-pin-area",
        drag: followPin,
        stop: function (event, ui) {
            followPin()
            let target = document.getElementById('td-pin')
            let y = target.getBoundingClientRect().bottom
            target.style.bottom = window.innerHeight - y + 'px'
            target.style.top = ''
        },
    })
    followPin()
    $('.modal').on('show.bs.modal', function (e) {
        document.getElementById('modal-skype').querySelector('webview').insertCSS('::-webkit-scrollbar{display:none;}')
        document.getElementById('modal-wechat').querySelector('webview').insertCSS('.login.ng-scope{min-width: unset;}')
        $(this).css('left', '')
    })

    document.getElementById('modal-wechat').querySelector('webview').addEventListener('load-commit', function () {
        this.insertCSS('.login.ng-scope{min-width: unset;}')
    })
    document.getElementById('modal-wechat').querySelector('webview').addEventListener('dom-ready', function () {
        this.insertCSS('.login.ng-scope{min-width: unset;}')
    })

    /**
     * webview隐藏
     */
    $('.modal:hidden').each((index, element) => {
        $('>div.modal-dialog', element).removeClass('modal-xl')
        // $('#modal-wechat > div.modal-dialog').css('left', '')
        $(element).css('left', '100000px')
        $(element).show()

        $(webTag2Selector(element.id.substring(6))).width("800px")
        $(webTag2Selector(element.id.substring(6))).height("800px")
    })
    $('.modal').on('hidden.bs.modal', function (e) {
        $('>div.modal-dialog', this).removeClass('modal-xl')
        // $('#modal-wechat > div.modal-dialog').css('left', '')
        $(this).css('left', '100000px')
        $(this).show()

        $(webTag2Selector(this.id.substring(6))).width("800px")
        $(webTag2Selector(this.id.substring(6))).height("800px")
    })

    /**
     * webview出现
     */
    $('.td-app-status img[class]').on('click', function () {
        let webTag = this.id.substring(4)

        let sendingUserID = undefined
        // 正在发消息不能打开后台
        for (let key in sendingList) {
            if (key.startsWith(webTag + ':') && sendingList[key] > 0) {
                sendingUserID = key.substr((webTag + ':').length)
            }
        }


        if (sendingUserID === undefined) {
            let webTagSelector = '#modal-' + webTag
            $(webTag2Selector(this.id.substring(4))).width("-webkit-fill-available")
            $(webTag2Selector(this.id.substring(4))).height("-webkit-fill-available")

            if (this.matches('.app-offline')) {
                $(webTagSelector).modal('show')
            }
            if (this.matches('.app-online')) {
                $(webTagSelector + '>div.modal-dialog').addClass('modal-xl')
                $(webTagSelector).modal('show')
            }
        } else {
            console.log('warning ..... ', sendingUserID, $('div[data-user-i-d="' + sendingUserID + '"] div.td-nickname').text())
            $("div.td-chatLog[wintype='chatLog']").append('<div id="td-warning">sending to' +
                $('div[data-user-i-d="' + sendingUserID + '"] div.td-nickname').text() + '...</div>')

            setTimeout(() => {
                $("#td-warning").remove()
            }, 5000);
            setTimeout(() => {
                let webTagSelector = '#modal-' + webTag
                $(webTag2Selector(this.id.substring(4))).width("-webkit-fill-available")
                $(webTag2Selector(this.id.substring(4))).height("-webkit-fill-available")

                if (this.matches('.app-offline')) {
                    $(webTagSelector).modal('show')
                }
                if (this.matches('.app-online')) {
                    $(webTagSelector + '>div.modal-dialog').addClass('modal-xl')
                    $(webTagSelector).modal('show')
                }
            }, 2000);
        }

    })

    //==========================UI_settingsPage=====================
    function loadSettings() {
        let tdSettings = store.get('tdSettings')
        document.getElementById('swTray').checked = tdSettings == undefined ? false : tdSettings.swTray
    }
    loadSettings()

    function applySettings() {
        let tdSettings = store.get('tdSettings')
        if (tdSettings.swTray) {

        }
    }

    document.getElementById('swTray').addEventListener('click', function () {
        // console.warn('UIsettings:', this.checked)
        let tdSettings = store.get('tdSettings')
        if (tdSettings == undefined) {
            tdSettings = new Object()
        }
        tdSettings.swTray = this.checked
        store.set('tdSettings', tdSettings)
        applySettings()
    })

    // ===========================接收消息===========================

    // wechat
    core.WinReplyWeb(webTag2Selector("wechat"), (key, arg) => {
        return respFuncWinReplyWeb("wechat", key, arg)
    })

    // skype
    core.WinReplyWeb(webTag2Selector("skype"), (key, arg) => {
        return respFuncWinReplyWeb("skype", key, arg)
    })
    // dingtalk
    core.WinReplyWeb(webTag2Selector("dingtalk"), (key, arg) => {
        return respFuncWinReplyWeb("dingtalk", key, arg)
    })

    // 点击convo
    $('#td-convo-container').on('click', 'div.td-convo', function () {


        // 识别webtag
        // console.log($(this).find("div.td-nickname").text())        
        let webTag = $(this).attr("data-app-name")
        let userID = $(this).attr("data-user-i-d")
        let nickName = $(this).find("div.td-nickname").text()

        let sendingUserID = undefined
        // 该webtag下, 有个不是当前点击的userID在发送文件, 则不允许点击
        // 比如微信正在给a发送消息, 那么可以点击skype下任意用户, 但是微信只允许点击a用户.
        // 点击其他用户会把后台正在等待发消息的函数给停掉.
        for (let key in sendingList) {
            if (key.startsWith(webTag + ':') && key != webTag + ':' + userID && sendingList[key] > 0) {
                sendingUserID = key.substr((webTag + ':').length)
            }
        }

        if (sendingUserID === undefined) {
            $('#td-convo-container div.td-convo').removeClass('theme-transduction-active')
            $(this).addClass('theme-transduction-active')


            if (webTag == undefined || userID == undefined) {
                console.log("error : click obj error.")
                console.log("obj : ", this)
                console.log("userID : ", userID)
                return
            }

            // 加载dialog(当前可能显示的是extension)
            $(debug_goBackChat_str).click()
            // 滑动条拖到最后
            let dialogSelector = "#td-right div.td-chatLog[wintype='chatLog']"
            $(dialogSelector).scrollTop($(dialogSelector)[0].scrollHeight)


            // $(webTag2Selector(webTag)).focus()
            if (
                $("#td-right div.td-chat-title").attr("data-user-i-d") == userID
                && $("#td-right div.td-chat-title").attr("data-app-name") == webTag
                && $("#td-right div.td-chat-title h2").text() == nickName
            ) {
                // 当前聊天内容不需要清空, 只需要补充
                core.HostSendToWeb(
                    webTag2Selector(webTag),
                    { "queryDialog": { "userID": userID } }
                ).then((res) => {
                    console.log("queryDialog : webReply : ", res)

                }).catch((error) => {
                    throw error
                })

            } else {
                // ---------右侧标题-----------
                $("#td-right div.td-chat-title").attr("data-user-i-d", userID)
                $("#td-right div.td-chat-title").attr("data-app-name", webTag)
                $("#td-right div.td-chat-title h2").text(nickName)
                $("#td-right div.td-chat-title img").attr('src', "../res/pic/" + webTag + ".png")
                $("#td-right div.td-chatLog[wintype='chatLog']").empty()


                // $(webTag2Selector(webTag)).focus()
                core.HostSendToWeb(
                    webTag2Selector(webTag),
                    { "queryDialog": { "userID": userID } }
                ).then((res) => {
                    console.log("queryDialog : webReply : ", res)

                    // setTimeout(() => {
                    //     console.log('bluring outtttttttttttttttttttttttt')
                    //     $(webTag2Selector(webTag)).blur()
                    // }, 1300)
                    // console.log('focusing innnnnnnnnnnn')
                    // $(webTag2Selector(webTag)).focus()


                }).catch((error) => {
                    throw error
                })
            }
            // $(webTag2Selector(webTag)).focus()
            // 判断sending条
            if (sendingList[webTag + ':' + userID] && sendingList[webTag + ':' + userID] > 0) {
                $("div.td-chatLog[wintype='chatLog']").append('<div id="td-sending">Sending...</div>')
            }
        } else {
            console.log('warning ..... ', sendingUserID, $('div[data-user-i-d="' + sendingUserID + '"] div.td-nickname').text())
            $("div.td-chatLog[wintype='chatLog']").append('<div id="td-warning">sending to' +
                $('div[data-user-i-d="' + sendingUserID + '"] div.td-nickname').text() + '...</div>')
            setTimeout(() => {
                $("#td-warning").remove()
            }, 5000);
        }

    });


    // console.log("toggle")
    // toggleWebview()
    // openDevtool('skype')
    window.onresize = () => {
        // console.log("===window resize====")
        document.getElementById('td-pin').style.left = window.getComputedStyle(document.getElementById('td-left')).getPropertyValue('width')
        document.getElementById('td-pin').style.bottom = window.getComputedStyle(document.getElementById('td-input')).getPropertyValue('height')
        // console.log(window.getComputedStyle(document.getElementById('td-left')).getPropertyValue('width'))
    }
    // $(window).resize(function () {
    //     document.getElementById('td-pin').style.left = tdPinCoord[0] + 'px'
    //     document.getElementById('td-pin').style.bottom = tdPinCoord[1] + 'px'
    // })


    // =================extension click==================
    // extension click
    $(debug_firefox_send_str).on('click', (e) => {
        $('.td-toolbox > img').removeClass('theme-transduction-active')
        $(e.target).addClass('theme-transduction-active')
        let extensionName = "firefox-send"
        $("#td-right div.td-chatLog[winType='chatLog']").hide()
        $("#td-right div.td-chatLog[winType='extension']").show()
        loadExtension("#td-right div.td-chatLog[winType='extension']", extensionName, "https://send.firefox.com/", '')
    })

    $(debug_latex_str).on('click', (e) => {
        $('.td-toolbox > img').removeClass('theme-transduction-active')
        $(e.target).addClass('theme-transduction-active')

        let extensionName = "latex2png"
        $("#td-right div.td-chatLog[winType='chatLog']").hide()
        $("#td-right div.td-chatLog[winType='extension']").show()
        loadExtension("#td-right div.td-chatLog[winType='extension']", extensionName, "http://latex2png.com/", '')
    })

    // 隐藏extension
    $(debug_goBackChat_str).on('click', () => {
        $('.td-toolbox > img').removeClass('theme-transduction-active')

        $("#td-right div.td-chatLog[winType='chatLog']").show()
        // webview隐藏, 防止再次点击刷新页面
        $("#td-right div.td-chatLog[winType='extension'] webview").each(function (index) {
            $(this).hide();
        });
        $("#td-right div.td-chatLog[winType='extension']").hide()

    })

    // ======================拖入东西==========================
    // 检测到拖入到东西
    // 当extension打开的时候, 只接受输入框位置拖入
    // $("#td-right").on("dragenter", (event) => {
    //     if ($("#td-right div.td-chatLog[winType='chatLog']").css("display") == "none") {

    //     } else {
    //         $("#td-right").hide()
    //         $("div[winType='dropFile']").show()
    //     }
    // })
    $('#td-right').on('dragenter', (event) => {
        // $('.td-dropFile').show()
        $('.td-dropFile').removeClass('hide')
    })
    // $("div.td-inputbox").on("dragenter", (event) => {
    //     if ($("#td-right div.td-chatLog[winType='chatLog']").css("display") == "none") {
    //         $("#td-right").hide()
    //         $("div[winType='dropFile']").show()
    //     } else {

    //     }
    // })
    $('div.td-inputbox').on('dragenter', (event) => {
        $('.td-dropFile').removeClass('hide')
    })

    // 拖出右侧还原
    // $("div[winType='dropFile']").on("dragleave", (event) => {
    //     $("div[winType='dropFile']").hide()
    //     $("#td-right").show()
    // })
    $('.td-dropFile').on('dragleave', (event) => {
        $('.td-dropFile').addClass('hide')
    })


    //识别到放下东西
    // $("div[winType='dropFile']").on("drop", (event) => {
    //     console.log("drop")
    //     $("div[winType='dropFile']").hide()
    //     $("#td-right").show()
    //     // Prevent default behavior (Prevent file from being opened)
    //     event.preventDefault();
    //     processDataTransfer(event.originalEvent.dataTransfer).then(
    //         console.log("insert input done")
    //     )
    // })
    $('.td-dropFile').on('drop', (event) => {
        console.log('drop')
        $('.td-dropFile').addClass('hide')
        event.preventDefault();
        processDataTransfer(event.originalEvent.dataTransfer).then(() => {
            $(".td-inputbox").focus()
            console.log("insert input done")
        })
    })


    // ===========paste================
    $("div.td-inputbox").on("paste", function (event) {
        event.preventDefault();
        // event.stopPropagation();

        let clipData = event.originalEvent.clipboardData || window.clipboardData;
        processDataTransfer(clipData).then(() => {
            $(".td-inputbox").focus()
            console.log("paste insert input done")
        })

    });

    // ===========================图片按钮===========================
    $(debug_image_str).on('click', event => {
        $('.td-toolbox > input[type="file"]').get(0).click()
    })

    $('.td-toolbox > input[type="file"]').on("change", function (event) {
        processFileList(event.target.files).then(() => {
            $(".td-inputbox").focus()
            console.log("insert input done")
        })
    });

    // ===========================发送消息===========================
    $(debug_send_str).on('click', event => {

        // 获取appname
        let userID = $("#td-right div.td-chat-title").attr("data-user-i-d")
        let webTag = $("#td-right div.td-chat-title").attr("data-app-name")


        if (userID && webTag) {
            let arraySend = getInput('div.td-inputbox')
            // 清理消息
            $("div.td-inputbox").empty()
            // console.log('-----send-----')
            if (arraySend.length > 0) {

                if (sendingList[webTag + ':' + userID]) {

                    sendingList[webTag + ':' + userID] = sendingList[webTag + ':' + userID] + 1
                } else {
                    sendingList[webTag + ':' + userID] = 1
                }
                // console.log("sending num : ", sendingList[webTag+':'+userID])

                // 添加send
                if ($("#td-sending").length == 0) {
                    console.log("attach sending-----")
                    $("div.td-chatLog[wintype='chatLog']").append('<div id="td-sending">Sending...</div>')
                }

                arraySend.unshift(userID)
                // $(webTag2Selector(webTag)).focus()
                core.HostSendToWeb(webTag2Selector(webTag), { 'sendDialog': arraySend }, 500000).then(() => {

                    console.log("send finished. ", sendingList[webTag + ':' + userID], ' messages sending')
                    sendingList[webTag + ':' + userID] = sendingList[webTag + ':' + userID] - 1
                    if (sendingList[webTag + ':' + userID] <= 0) {
                        $("#td-sending").remove()
                    }
                    // 索取新的dialog
                    core.HostSendToWeb(
                        webTag2Selector(webTag),
                        { "queryDialog": { "userID": userID } }
                    ).then((res) => {
                        console.log("queryDialog : webReply : ", res)

                    }).catch((error) => {
                        throw error
                    })

                    //删除File list
                    arraySend.forEach((value, index) => {
                        console.log(index, typeof (value))
                        if (typeof (value) != 'string') {
                            console.log("file : ", value.fileID)
                            fileList[value.fileID].clear()
                            delete fileList[value.fileID]
                        }
                    })

                }).catch((err) => {
                    console.log("send failed", err)

                    // $("#td-sending").remove()                    
                })
            }
        }


        // attachInputFile(webTag2Selector("skype"), "input.fileInput", "")
        // console.log(fileList)
    })

    // ===查询后台登录情况===
    // $("#test-1").on("click", () => {
    //     console.log("====query logStatus=====")
    //     $("webview[data-app-name]").each((index, el) => {
    //         let webTag = $(el).attr("data-app-name")
    //         // console.log()
    //         core.HostSendToWeb(webTag2Selector(webTag), { 'queryLogStatus': '' }).then((obj) => {
    //             let color = 'red'
    //             // console.log((obj['queryLogStatus'+":"+""]))
    //             let logStatus = (obj['queryLogStatus' + ":" + ""])
    //             if (logStatus.status == 'offline') {
    //                 console.log(webTag + " not log yet.")
    //             } else if (logStatus.status == 'online') {
    //                 console.log(webTag + " is logged already.")
    //                 color = 'green'
    //             } else if (logStatus.status == 'failure') {
    //                 console.log(webTag + " log failed")
    //             }

    //             // 修改登录状态
    //             let selector = "#test-2 p[data-app-name='" + webTag + "']"
    //             if ($(selector).length == 0) {
    //                 $("#test-2").append(
    //                     "<p data-app-name='" + webTag + "'>" + webTag + " : " + logStatus.status + "</p>")
    //                 $(selector).css("background-color", color);
    //             } else {
    //                 $(selector).text(webTag + " : " + logStatus.status)
    //                 $(selector).css("background-color", color);
    //             }
    //         }).catch((err) => {
    //             console.log(webTag, "no response", err)
    //         })
    //     })

    // })

    // ===查询后台登录情况===
    $("#td-request-status").on("click", () => {
        console.log("log off click")
        // $("webview[data-app-name]").each((index, el) => {
        //     let webTag = $(el).attr("data-app-name")
        //     // console.log()
        //     core.HostSendToWeb(webTag2Selector(webTag), { 'queryLogStatus': '' }).then((obj) => {
        //         // let color = 'red'
        //         // console.log((obj['queryLogStatus'+":"+""]))
        //         let logStatus = (obj['queryLogStatus' + ":" + ""])
        //         if (logStatus.status == 'offline') {
        //             console.log(webTag + " not log yet.")
        //             $('#app-' + webTag).removeClass('app-online')
        //             $('#app-' + webTag).addClass('app-offline')

        //         } else if (logStatus.status == 'online') {
        //             console.log(webTag + " is logged already.")
        //             $('#app-' + webTag).removeClass('app-offline')
        //             $('#app-' + webTag).addClass('app-online')
        //             // color = 'green'
        //         } else if (logStatus.status == 'failure') {
        //             console.log(webTag + " log failed")
        //             $('#app-' + webTag).removeClass('app-online')
        //             $('#app-' + webTag).addClass('app-offline')
        //         }
        //     }).catch((err) => {
        //         console.log(webTag, "no response", err)
        //     })
        // })

        core.HostSendToWeb(webTag2Selector("wechat"), { 'logoff': '' }).then((obj) => {

        })

        // $(webTag2Selector("skype")).focus()
        core.HostSendToWeb(webTag2Selector("skype"), { 'logoff': '' }).then((obj) => {

        })

    })

    // 阻拦全部链接点击
    $(document).on('click', 'a[href]', function (event) {

        event.preventDefault();
        event.stopPropagation();
        // console.log(this.href.substring(0,4))
        if (this.href.substring(0, 4) == 'http') {

            if (this.href.search('https://send.firefox.com/download') !== -1) {
                // 在extension打开
                // console.log("click : ", this.href)

                $(debug_firefox_send_str).click()

                loadExtension("#td-right div.td-chatLog[winType='extension']", "firefox-send", this.href, '')
            } else {
                shell.openExternal(this.href);
                // let options = {
                //     type: 'info',
                //     buttons: ['OK'],
                //     defaultId: 2,
                //     title: 'Question',
                //     message: 'The link is opened in the default browser.',
                //     // detail: 'It does not really matter',
                //     // checkboxLabel: 'Remember my answer',
                //     // checkboxChecked: true,
                //   };
                //   dialog.showMessageBox(null, options, (response, checkboxChecked) => {
                //     console.log(response);
                //     // console.log(checkboxChecked);
                //   });
                console.log(this)
                let objBubble = $(this).closest("div.td-bubble")
                if ($(objBubble).length > 0) {
                    $(objBubble).find("div.td-chatText p").text("opened in default browser.")
                }
            }

        }

    });

    $(document).on('click', 'a.badge.badge-pill.badge-warning', function (event) {

        event.preventDefault();
        event.stopPropagation();
        // console.log(this.href.substring(0,4))
        let webTag = $('#td-right > div.td-chat-title').attr('data-app-name')
        $('#app-' + webTag).click()

    });

    // 阻拦全部链接点击
    $(document).on('click', 'button[download]', function (event) {
        console.log('download : ', this)
        core.sendToMain({ 'download': { 'url': $(this).attr('href'), 'path': '/temp/' } })

    });

    $(document).on('click', 'button[reload]', function (event) {
        console.log('reload : ', $(this), $(this).closest('modal-content').find('webview'))
        // core.sendToMain({'download':{'url': $(this).attr('href'), 'path':'/temp/'}})
        let webview = $(this).closest('.modal-content').find('webview')
        if (webview) {
            $(webview).get(0).reload()
        }

    });


    $(document).on('keypress', function (event) {
        // console.log("focus text")
        // if(document.activeElement == $(".td-inputbox").get(0)){

        // }else{

        // }
        console.log('focus : ',$(document.activeElement).is(".td-inputbox"), ' key press : ', event.which, event.ctrlKey)
        // $(".td-inputbox").focus()

        if ($(document.activeElement).is(".td-inputbox")) {

            if (event.which == 13) {
                // enter pressed
                $(debug_send_str).click()
                return false
            }
            if (event.ctrlKey && event.which == 10) {
                arrayIn = jQuery.parseHTML($('div.td-inputbox').get(0).innerHTML)
                if(($(arrayIn)[arrayIn.length-1].nodeName != 'BR')) {
                    $('div.td-inputbox').append('<br>')
                }
                pasteHtmlAtCaret("<br>", 'div.td-inputbox')
            }
        } else {
            // 闪烁
        }


    })



})
