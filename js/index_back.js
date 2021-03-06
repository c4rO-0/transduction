// =========================全局函数和变量===========================
// *********************************************
// navigator setting
// ---------------------------------------------
const events = require('events');

var eventEmitter = new events.EventEmitter();

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


/**
 * 打开webview Devtool
 * @param {string} appTag
 */
function openDevtool(appTag) {

    if($("webview[data-app-name='" + appTag + "']").length > 0 ){
        let web = $("webview[data-app-name='" + appTag + "']")[0];
        web.openDevTools();
    }else if($("webview[data-tool-name='" + appTag + "']").length > 0 ){
        let web = $("webview[data-tool-name='" + appTag + "']")[0];
        web.openDevTools();
    }else{
        return false
    }

    return true

}


function listWebview() {
    $("webview").toArray().forEach((e, i) => {
        console.log($(e).attr('data-app-name'))
    })
}

function modalImage(event) {
    document.getElementById('modal-image').querySelector('img').src = event.target.src
    $('#modal-image img[download]').attr('href', event.target.src)
    $('#modal-image img[download]').attr('msgid', $(event.target).closest('div.td-bubble').attr("msgid"))
    $("#modal-image").modal()
}

function installExt(pathConfig) {
    eventEmitter.emit('install-ext', pathConfig);
}

function uninstallExt(pathConfig) {
    eventEmitter.emit('uninstall-ext', pathConfig);
}

function editStore() {
    eventEmitter.emit('edit-store');
}

$(document).ready(function () {

    const td = require('td')
    const { nativeImage, dialog, shell, session } = require('electron').remote
    const Store = require('electron-store');
    const store = new Store();
    const request = require('request')
    const fs = require('fs')
    const path = require('path')

    let debug = false
    td.tdMessage.sendToMain({'isDebug':''}).then((res)=>{
        debug = res.isDebug
        if(debug){
            console.log('===You are in debug mod===')
            $("#openDevTools").show()
        }else{
            $("#openDevTools").hide()
        }
    })

    /** 储存要发送的file object
     *  为了能够保证文件能够顺利的发送, fileList不会清除
     */
    let fileList = {};

    /**
     * 下载列表
     */
    let donwloadList = updateDonwloadList()

    // 插件列表
    let extList = {};

    let inputImgHeightLimit = 100
    let inputImgWeightLimit = 600


    let debug_firefox_send_str = "#tool-firefox-send-KTA0YJF8GR"
    let debug_image_str = "#debug-image"
    let debug_send_str = "#debug-send"
    let debug_goBackChat_str = "#debug-goBackChat"
    let classTactive = 'theme-transduction-active-tran'

    let angle = 0
    let aspectRatio = 1


    /**===============
     * 加载settings
     */

    eventEmitter.on('edit-store', () => {
        store.openInEditor()
    });

    function initializeSettings() {

        console.log("debug : tdSettings--------")
        let tdSettings = store.get('tdSettings')

        console.log(tdSettings)

        if (!store.has('tdSettings.swTray')) {
            store.set('tdSettings.swTray', true)
        }

        if (!store.has('tdSettings.pinCoord')) {
            store.set('tdSettings.pinCoord', [0, 0])
        }

    }
    initializeSettings()


    eventEmitter.on('install-ext', (pathConfig) => {

        console.log("install ", pathConfig)
        td.tdExt.loadExtConfigure(pathConfig).then((config) => {
            td.tdExt.enableExtConfigure(config).then((resAble) => {
                // openDevtool(config.name)
            }).catch((errAble) => {

            })
        })

    })

    eventEmitter.on('uninstall-ext', (pathConfig) => {

        console.log("uninstall ", pathConfig)
        td.tdExt.loadExtConfigure(pathConfig).then((config) => {
            td.tdExt.disableExtConfigure(config).then((resAble) => {

            }).catch((errAble) => {

            })
        })

    })

    function loadSettings() {

        // -o check swTray : Close to status bar
        let swTray = store.get('tdSettings.swTray')
        document.getElementById('swTray').checked = swTray == undefined ? false : swTray

        // -o set pin position
        let pinCoord = store.get('tdSettings.pinCoord', [0, 0])
        console.log("pinCoord")
        document.getElementById('td-pin').style.left = pinCoord[0] + 'px'
        document.getElementById('td-pin').style.bottom = pinCoord[1] + 'px'



        // -o install default extensions : firefox-send
        console.log('install...')
        if (!store.has('tdSettings.extList')) {
            let defaultOffExtPathArray =
                [
                    path.resolve('ext/wechat/config.json'),
                    path.resolve('ext/skype/config.json'),
                    path.resolve('ext/dingtalk/config.json'),
                    path.resolve('ext/latex2png/config.json'),
                    path.resolve('ext/languagetool/config.json'),
                    path.resolve('ext/whatsapp/config.json')
                ]
            defaultOffExtPathArray.forEach(pathConfig => {
                uninstallExt(pathConfig)
            })
        }

        let defaultOnExtPathArray =
            [
                path.resolve('ext/firefoxsend/config.json')
            ]
        defaultOnExtPathArray.forEach(pathConfig => {
            installExt(pathConfig)
        })

        // -o load extList : app/tool
        /**
         *  extList:{
         *   webTag:{ 
         *      status, configPath}
         *  }
         */
        if (store.has('tdSettings.extList')) {
            let extListStore = store.get('tdSettings.extList')
            console.log('loading extList', extListStore)
            $.each(extListStore, (webTag, details) => {
                // console.log('load ', webTag)
                if (details.status === true && extList[webTag] === undefined) {
                    td.tdExt.loadExtConfigure(details.configPath).then((config) => {

                        // -o check unicode is same with store
                        if (webTag !== config.webTag) {
                            console.error(config.name, ' unicode check failed')
                        } else {
                            // -o load
                            td.tdExt.enableExtConfigure(config)
                        }

                    }).catch((loadError) => {
                        console.error(loadError)
                    })
                }
            })
        }

    }

    loadSettings()


    //-------------------------------

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

    class Bubble {
        constructor() {
            this.bTextL = ''
            this.bTextR = ''
            this.bUrlL = ''
            this.bUrlR = ''
            this.bUnknownL = ''
            this.bUnknownR = ''
            this.bFSendL = ''
            this.bFSendR = ''
            this.bFileL = ''
            this.bFileR = ''
            this.bImgL = ''
            this.bImgR = ''
        }

        initialize() {

            this.bTextL = $('div[msgid="bTextL"]').clone()
            this.bTextR = $('div[msgid="bTextR"]').clone()

            this.bUrlL = $('div[msgid="bUrlL"]').clone()
            this.bUrlR = $('div[msgid="bUrlR"]').clone()

            this.bUnknownL = $('div[msgid="bUnknownL"]').clone()
            this.bUnknownR = $('div[msgid="bUnknownR"]').clone()

            this.bFSendL = $('div[msgid="bFSendL"]').clone()
            this.bFSendL = $('div[msgid="bFSendR"]').clone()

            this.bFileL = $('div[msgid="bFileL"]').clone()
            this.bFileR = $('div[msgid="bFileR"]').clone()

            this.bImgL = $('div[msgid="bImgL"]').clone()
            this.bImgR = $('div[msgid="bImgR"]').clone()
        }

        createBubble(dialog) {

            let cUser = $('div.td-chat-title').attr('data-user-i-d')
            let cwebTag = $('div.td-chat-title').attr('data-app-name')

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

            let bubble
            if (dialog['type'] == 'text') {

                if (dialog["from"]) {
                    bubble = $(this.bTextL).clone()
                } else {
                    bubble = $(this.bTextR).clone()
                }

                $(bubble).find('div.td-chatText').text(dialog['message'])

            } else if (dialog['type'] == 'img') {

                if (dialog["from"]) {
                    bubble = $(this.bImgL).clone()
                } else {
                    bubble = $(this.bImgR).clone()
                }

                $(bubble).find('div.td-chatImg img').attr('src', dialog['message'])

            } else if (dialog['type'] == 'url') {


                if (dialog['message'].search('https://send.firefox.com/download') !== -1) {
                    if (dialog["from"]) {
                        bubble = $(this.bFSendL).clone()
                    } else {
                        bubble = $(this.bFSendR).clone()
                    }
                } else {
                    if (dialog["from"]) {
                        bubble = $(this.bUrlL).clone()
                    } else {
                        bubble = $(this.bUrlR).clone()
                    }
                }

                $(bubble).find('div.td-chatText a').attr('href', dialog['message'])
                $(bubble).find('div.td-chatText a').text(dialog['message'])

            } else if (dialog['type'] == 'file') {
                if (dialog["from"]) {
                    bubble = $(this.bFileL).clone()
                } else {
                    bubble = $(this.bFileR).clone()
                }
                $(bubble).find('div.td-chatText > div > div > p').text("File Name: " + dialog['fileName'])
                let sizeStr
                if (dialog['fileSize'] < 1024.) {
                    sizeStr = dialog['fileSize'].toFixed().toString() + ' B'
                } else if (dialog['fileSize'] < 1024. ** 2) {
                    sizeStr = (dialog['fileSize'] / 1024.).toFixed(1).toString() + ' KB'
                } else if (dialog['fileSize'] < 1024. ** 3) {
                    sizeStr = (dialog['fileSize'] / 1024. ** 2).toFixed(1).toString() + ' MB'
                } else if (dialog['fileSize'] < 1024. ** 4) {
                    sizeStr = (dialog['fileSize'] / 1024. ** 3).toFixed(1).toString() + ' GB'
                } else {
                    sizeStr = (dialog['fileSize'] / 1024. ** 4).toFixed(1).toString() + ' TB'
                }

                $(bubble).find('div.td-chatText > div > div > div > p').text("Size: " + sizeStr)
                $(bubble).find('div.td-chatText button[download]').attr('href', dialog['message'])

                // 查看 是否已经下载
                // console.log('cwebTag:',cwebTag, 'cUser:',cUser)
                for (let index = 0; index < donwloadList.length; index++) {
                    // console.log('index:',donwloadList[index])
                    if (donwloadList[index].webTag == cwebTag
                        && donwloadList[index].userID == cUser
                        && donwloadList[index].msgID == dialog.msgID) {

                        $(bubble).addClass('td-downloaded')

                        $(bubble).find('button[open]').attr('path', donwloadList[index].savePath)

                        break
                    }
                }



            } else if (dialog['type'] == 'unknown') {
                if (dialog["from"]) {
                    bubble = $(this.bUnknownL).clone()
                } else {
                    bubble = $(this.bUnknownR).clone()
                }
                $(bubble).find('div.td-chatText > p').text(dialog['message'])

            } else {
                if (dialog["from"]) {
                    bubble = $(this.bUnknownL).clone()
                } else {
                    bubble = $(this.bUnknownR).clone()
                }
                $(bubble).find('div.td-chatText > p').text(dialog['message'])
            }

            if (dialog["from"]) {
                let userID = $("#td-right div.td-chat-title").attr("data-user-i-d")
                let appName = $("#td-right div.td-chat-title").attr("data-app-name")
                let avatarUrl = dialog["avatar"] === undefined ?
                    $("#td-left \
                div.td-convo[data-user-i-d='" + userID + "'][data-app-name='" + appName + "'] \
                div.td-avatar").css('background-image').slice(5, -2)
                    : dialog["avatar"]

                $(bubble).find("div.td-chatAvatar img").attr('src', avatarUrl)

                $(bubble).find('> p.m-0').text(dialog["from"])
                $(bubble).find('div.td-them p.m-0').text(time)

            } else {
                $(bubble).find('p.m-0').text(time)

                if (dialog["status"] == "done") {

                } else if (dialog["status"] == "sending") {
                    $(bubble).find('.td-bubbleStatus').removeClass('td-none')
                } else if (dialog["status"] == "failed") {
                    $(bubble).find('.td-bubbleStatus').removeClass('td-none')
                    $(bubble).find('.td-bubbleStatus').addClass('bubbleError')
                }
            }


            $(bubble).attr('msgTime', timeObj.getTime())
            $(bubble).attr('msgid', dialog['msgID'])

            // console.log("create bubble from : ", dialog)

            return $(bubble)[0].outerHTML

        }
    }

    let bubble = new Bubble
    bubble.initialize()


    /**
     * input草稿
     * 以字典的形式储存字符串
     * ["webtag+ID":"content"]
     */
    class InputDraft {
        constructor() {
            this.list = []
        }

        query(webTag, userID) {
            return this.list[webTag + userID]
        }

        /**
         * 储存草稿, 如果webTag+userID重复, 将会覆盖内容
         * @param {*} webTag 
         * @param {*} userID 
         * @param {*} content 
         */
        add(webTag, userID, content) {
            this.list[webTag + userID] = content
        }
        /**
         * 删除草稿
         * @param {*} webTag 
         * @param {*} userID 
         */
        pop(webTag, userID) {
            delete this.list[webTag + userID]
        }
    }
    let inputDraft = new InputDraft()


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
        if (convo.muted) {
            visibility = ""
        }

        let avatar = convo.avatar == undefined ? '../res/pic/weird.png' : convo.avatar
        // console.log(appName , extList )
        let config = extList[appName]

        return '\
        <div class="td-convo theme-transduction td-font" data-user-i-d='+ convo.userID + ' data-app-name=' + appName + ' muted=' + convo.muted + '>\
            <div class="col-appLogo">\
                <img src="'+ path.join(config.dir, config.icon.any) + '">\
            </div>\
            <div class="col-hint">\
                <div class="row-hint" style="background-color:'+ config.icon.color + ';"></div>\
            </div>\
            <div class="col-avatar d-flex justify-content-center">\
                <div class="td-avatar align-self-center" style="background-image: url('+ avatar + ')"></div>\
                <div class="td-counter" style="'+ displayCounter + '">\
                    <div style="align-self:center;">'+ convo.counter + '</div>\
                </div>\
            </div >\
        <div class="col col-text flex-column justify-content-center">\
                <div class="m-0 td-nickname">'+ convo.nickName + '</div>\
                <div class="m-0 td-text">'+ td.tdBasicPage.htmlEntities(convo.message) + '</div>\
            </div>\
            <div class="col-auto pl-0 col-timestamp justify-content-around">\
                '+ convo.time + '\
                <img class="' + visibility + ' align-self-center" src="../res/pic/mute.svg" height="18px">\
            </div>\
        </div > '
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
                            $(objConvo).find("div.col-timestamp").contents().filter(function(){ return this.nodeType == 3; }).first().replaceWith(convo.time);
                            break;
                        case "muted":
                            $(objConvo).attr('muted', convo.muted)
                            if(convo.muted){
                                $(objConvo).find('img.align-self-center').removeClass('td-invisible')
                            }else{
                                $(objConvo).find('img.align-self-center').addClass('td-invisible') 
                            }
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
                        <img id="debug-history" class="hide" src="../res/pic/history.png">\
                        <div class="td-default">\
                            <p>\
                                问题反馈，请联系c4r。\
                            </p>\
                            <p>\
                                bug report, please contact c4r.\
                            </p>\
                        </div>')
    }

    //------------------------
    // 处理消息
    /**
     * td.tdMessage.WinReplyWeb 处理消息的函数
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
                    Obj.reverse().forEach((value, index) => {
                        $(dialogSelector).prepend(bubble.createBubble(value))
                    })

                    // 滑动到最下面
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

                    // 首先检查有没有msgID变更
                    Obj.forEach((value, index) => {
                        if (value.oldMsgID != undefined && $(dialogSelector + " [msgID='" + value['oldMsgID'] + "']").length > 0) {
                            $(dialogSelector + " [msgID='" + value['oldMsgID'] + "']").attr('msgID', value.msgID)
                        }
                    })

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

                        if (value.oldMsgID != undefined && $(dialogSelector + " [msgID='" + value['msgID'] + "']").length == 0) {
                            // 可能后台传上来一个oldMsgIDv不存在的消息
                        } else {

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
                                    && timeWaitInsert > arrayExistBubble[arrayExistBubble.length - 1].msgTime) {

                                    $(dialogSelector).append(bubble.createBubble(value))

                                    arrayExistBubble.push({ 'msgTime': timeWaitInsert, 'msgID': value.msgID })
                                } else {
                                    $(bubble.createBubble(value))
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
                                    .replaceWith(bubble.createBubble(value)
                                    )
                                // arrayExistBubble[-currentInsertIndex - 1].msgTime
                            }
                        }

                    })
                    // 

                }


                // 判断用户当前所在位置, 如果用户在阅读之前的bubble就不应该滚动滑条
                if (atBottom) {

                    $(dialogSelector).scrollTop($(dialogSelector)[0].scrollHeight)


                    // fixme : -----------------------
                    // 目前程序已经去除对webview focus, 理论上来说不需要blur
                    console.log('bluring outttttttttttttttttttt')
                    $(webTag2Selector(webTag)).blur()
                    //--------------------------------

                    $(dialogSelector + " div.td-bubble").each((index, element) => {
                        if ($(element).find('.td-chatImg').length > 0) {
                            ($(element).find('.td-chatImg > img').get(0)).onload = function () {
                                $(dialogSelector).scrollTop($(dialogSelector)[0].scrollHeight)
                            }
                        }
                    })
                } else {

                    // 该处不需要blur, 因为不滚动, 要保持未读消息数
                    console.log("dialog updated. new bubble(s) not display...")
                }



                resolve("copy that.")
            } else if (key == 'Convo-new') {
                // 有新消息来了

                if(Obj.userID === undefined){
                    reject("undefined user ID")
                    return
                }

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
                    // 判断窗口是否显示状态(tool), 并且滑条在最下面
                    let strDialogSelector = "#td-right div.td-chatLog[wintype='chatLog']"
                    if ($(strDialogSelector).is(":visible") &&
                        $(strDialogSelector).scrollTop() + $(strDialogSelector)[0].clientHeight == $(strDialogSelector)[0].scrollHeight) {

                        if (document.hasFocus()) {
                            // 取消新消息未读, 和声音提示
                            Convo.counter = 0
                        }

                    }

                }


                // 前台闪烁图标, 发送notification, 并响铃
                function notifyLocal() {
                    td.tdMessage.sendToMain({ 'flash': Convo.nickName + ':' + Convo.message })
                    let convoNotification = new Notification('Tr| ' + webTag, {
                        body: Convo.nickName + '|' + Convo.message,
                        silent: true
                    })
                    // 因为系统原因, Notification silent在ubuntu失效, 所以需要统一播放声音
                    const noise = new Audio('../res/mp3/to-the-point.mp3')
                    noise.play()

                    convoNotification.onclick = () => {
                        // 弹出transduction, 并点击对应convo
                        td.tdMessage.sendToMain({ 'show': '' })
                        td.tdMessage.sendToMain({ 'focus': '' })
                        $('#td-convo-container [data-app-name=' + webTag + '][data-user-i-d="' + Convo.userID + '"]').click()
                    }
                }

                if (!Convo.muted // 非静音
                    && Convo.action != 'r' // 类型是a或者c
                    && Convo.message != undefined && Convo.message != ''
                    && !(document.hasFocus() || $(webTag2Selector(webTag)).get(0).getWebContents().isFocused())
                ) {
                    if (Convo.counter > 0) { //未读消息 >0
                        notifyLocal()
                    } else {
                        // 如果是选中的convo, 那么可能存在对方发消息, counter(未读消息) == 0, 
                        // 但实际并没有读取.
                        // 检查右侧如果不是自己发的, 就要弹提醒
                        if ($('div.td-chat-title[data-user-i-d="' + Convo.userID + '"]').length > 0) {
                            setTimeout(() => {
                                if ($('div.td-chatLog[wintype="chatLog"] > .td-bubble:last-child > div').hasClass('td-them')) {
                                    notifyLocal()
                                }
                            }, 300);
                        }
                    }
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

                    // webTag
                    let webTagSelector = '#modal-' + webTag
                    if ($(webTagSelector).hasClass('show') && Convo.counter == 0) {
                        $('#td-convo-container [data-app-name=' + webTag + '][data-user-i-d="' + Convo.userID + '"]').click()
                        $(webTagSelector).modal('hide')
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
                td.tdSimulator.attachInputFile(webTag2Selector(webTag), Obj.selector, fileList[Obj.file.fileID].path)

                resolve("attached")
            } else if (key == 'simulateKey') {
                // 按键模拟

                td.tdSimulator.keypressSimulator(webTag2Selector(webTag), Obj.type, Obj.charCode, Obj.shift, Obj.alt, Obj.ctrl, Obj.cmd)

                resolve("simulated")
            } else if (key == 'simulateMouse') {
                // 按键模拟
                console.log("simulateMouse", Obj)
                td.tdSimulator.mouseSimulator(webTag2Selector(webTag), Obj.type, Obj.x, Obj.y)

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
                        if ($('.app-online').length == 0) {
                            // 空白页
                            rightBackToDefault()
                        }



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

    // 处理消息
    /**
     * td.tdMessage.WinReply 处理消息的函数
     * @param {String} key MSG的类别 : 
     * MSG-Log : 收到右侧窗口聊天记录
     * MSG-new : 左侧提示有新消息
     * @param {Object} Obj 收到的具体消息
     */
    function respFuncWinReply(key, Obj) {
        return Promise.race([new Promise((resolve, reject) => {
            console.log("debug : ", "----------------------")
            console.log("debug : ", "MSG from Win")
            console.log(Obj)

            if (key == 'downloadUpdated') {
                // console.log("progress update : ", Obj)

                $('div.td-bubble[msgid="' + Obj.msgID + '"] div.progress-bar').css('width', (Obj.progress * 100.).toString() + '%')

                let timeStr = 'time left: '
                if (Obj.leftTime < 0) {
                    timeStr += '--'
                } else if (Obj.leftTime < 60) {
                    timeStr += Obj.leftTime.toFixed().toString() + 's'
                } else if (Obj.leftTime < 3600) {
                    let min = Math.floor(Obj.leftTime / 60.)
                    timeStr += min.toString() + 'm'
                        + (Obj.leftTime - min * 60.).toFixed().toString() + 's'
                } else if (Obj.leftTime < 3600 * 24) {
                    let hour = Math.floor(Obj.leftTime / 3600.)
                    let min = Math.floor((Obj.leftTime - hour * 3600) / 60.)
                    timeStr += hour.toString() + 'h'
                        + min.toString() + 'm'
                } else {
                    let day = Math.floor(Obj.leftTime / (3600. * 24.))
                    if (day < 10) {
                        let hour = Math.floor((Obj.leftTime - day * 3600. * 24) / 3600.)
                        timeStr += day.toString() + 'd'
                            + hour.toString() + 'h'
                    } else {
                        timeStr += day.toString() + 'd'
                    }
                }
                $('div.td-bubble[msgid="' + Obj.msgID + '"] div[time-left]').text(timeStr)

                resolve("got the progress")
            }

        }),
        new Promise((resolve, reject) => {
            let erTime = setTimeout(() => {
                clearTimeout(erTime)
                reject("respFuncWinReply : " + key + " time out")
            }, 5000);
        })])
    }

    /**
     * 
     * @param {String} sectionSelector 要插入的webview 的父节点
     * @param {String} toolName 插件名称
     * @param {String} strUrl 插件地址
     * @param {String} strPathJS JS地址
     * @returns {Boolean} 加载成功或失败
     */
    function loadTool(sectionSelector, toolName, strUrl, strPathJS = undefined) {

        // 检测selector
        if ($(sectionSelector).length == 0) {
            console.log("loadTool : cannot find section by " + sectionSelector)
            return false
        } else if ($(sectionSelector).length > 1) {
            console.log("loadTool : multiple sections found by " + sectionSelector)
            return false
        }

        // 检查文件路径
        if (strPathJS) {
            let JSexist = false
            fs.stat(strPathJS, function (err, stat) {
                if (stat && stat.isFile()) {
                    JSexist = true
                }
            });
            if (!JSexist) {
                console.log("loadTool : cannot find JS file")
                return false
            }
        }

        // 隐藏其他webview
        $(sectionSelector + " webview").each(function (index) {
            $(this).hide();
        });

        let webSelector = sectionSelector + " webview[data-tool-name='" + toolName + "']"


        // 已经加载过webview
        if ($(webSelector).length > 0 && $(webSelector).css("display") == "none") {
            console.log("loadTool : display tool")

            // console.log("loadtool : ", strUrl, $(webSelector).attr('src'))
            if ($(webSelector).attr('src') != strUrl) {
                $(webSelector).attr('src', strUrl)
            }

            $(webSelector).show()
        } else {

            if ($(webSelector).length == 0) {
                $(sectionSelector).append("<webview style='width:100%; height:100%' data-tool-name='" + toolName + "' src='' style='display:none;'></webview>")
            }

            $(webSelector).attr("data-tool-name", toolName)

            $(webSelector).attr('src', strUrl)

            if (strPathJS) {
                $(webSelector).attr('preload', strPathJS)
            }

            $(webSelector).show()

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

            console.log("filterDataTransfer : data : ", data)

            let objHTML = data.getData('text/html') // 拖拽的是一个含有链接的东西, html, 在线img, 文件
            let strURL = data.getData('URL')
            console.log('--------objHTML-----------')
            console.log(objHTML)
            console.log('--------strURL-----------')
            console.log(strURL)
            if (objHTML && $(objHTML).get(0) && $(objHTML).get(0).nodeName == 'IMG' && $(objHTML).attr('src')) {
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
                                let imgSend = new td.tdFileSend(getFileNameFromUrl(pathFile), pathFile, '', undefined, img.toDataURL())
                                resolve(imgSend)
                            }
                        }))
                } else if ((pathR.length > 9 && pathR.substring(0, 8) == 'https://') || (pathR.length > 8 && pathR.substring(0, 7) == 'http://')) {
                    arrayItem.push(new Promise(
                        (resolve, reject) => {
                            var valRequest = request.defaults({ encoding: null });

                            valRequest.get(pathR, function (error, response, body) {
                                if (!error && response.statusCode == 200) {
                                    let strRequest = new Buffer(body).toString('base64')
                                    let urldata = "data:" + response.headers["content-type"] + ";base64," + strRequest;
                                    // console.log("------request-----")
                                    // console.log(strRequest)
                                    if (strRequest) {
                                        let imgSend = new td.tdFileSend(getFileNameFromUrl(pathR), '', pathR, undefined, urldata)
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
                                    let imgSend = new td.tdFileSend(file.name, file.path, '')
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
                                let imgSend = new td.tdFileSend(file.name, file.path, '')
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
                        let imgSend = new td.tdFileSend(file.name, file.path, '')
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
                item.addFileID(td.tdBasic.uniqueStr())
                //插入html
                // pasteHtmlAtCaret("&nbsp;<a data-file-ID='" + fileID + "' contenteditable=false>" + item.name + "</a>&nbsp;", 'div.td-inputbox')

                autoSizeImg(item.dataUrl, inputImgWeightLimit, inputImgHeightLimit).then((newSize) => {

                    item.localSave().then(() => {
                        // console.log("debug : path : ", item.path, "-----------------------------------")
                        fileList[item.fileID] = item


                        $("div.td-dropFile > img").addClass("td-none")
                        $('div.td-dropFile > div > img:nth-child(1)').attr('src', item.path)
                        $('div.td-dropFile > div > img:nth-child(1)').attr('data-file-ID', item.fileID)
                        $('div.td-dropFile > div').removeClass('td-none')
                        $('.td-dropFile').removeClass('hide')

                        // sendInput("<img data-file-ID='"
                        //     + item.fileID
                        //     + "' contenteditable=false src='"
                        //     + item.path
                        //     + "' height='" + newSize.height + "' width='" + newSize.width + "' >")

                        // if (pasteHtmlAtCaret(
                        //     "<img data-file-ID='"
                        //     + item.fileID
                        //     + "' contenteditable=false src='"
                        //     + item.path
                        //     + "' height='" + newSize.height + "' width='" + newSize.width + "' >", 'div.td-inputbox')) {
                        //     resolve("")
                        // } else {
                        //     reject("error : itemToHTML : pasteHtmlAtCaret")
                        // }

                        resolve("")
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
     * 光标移动到最后
     * https://stackoverflow.com/questions/1125292/how-to-move-cursor-to-end-of-contenteditable-entity/3866442#3866442
     * @param {*} contentEditableElement 
     */
    function setEndOfContenteditable(contentEditableElement) {
        var range, selection;
        if (document.createRange)//Firefox, Chrome, Opera, Safari, IE 9+
        {
            range = document.createRange();//Create a range (a range is a like the selection but invisible)
            range.selectNodeContents(contentEditableElement);//Select the entire contents of the element with the range
            range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
            selection = window.getSelection();//get the selection object (allows you to change selection)
            selection.removeAllRanges();//remove any selections already made
            selection.addRange(range);//make the range you have just created the visible selection
        }
        else if (document.selection)//IE 8 and lower
        {
            range = document.body.createTextRange();//Create a range (a range is a like the selection but invisible)
            range.moveToElementText(contentEditableElement);//Select the entire contents of the element with the range
            range.collapse(false);//collapse the range to the end point. false means collapse to end rather than the start
            range.select();//Select the range (make it the visible selection
        }
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
                strInput = arrayInput.slice(fileIndex + 1, index).join('\n')
                if (strInput.length > 0) arraySimpleInput.push(strInput)

                arraySimpleInput.push(value)
                fileIndex = index
            }
        })

        strInput = arrayInput.slice(fileIndex + 1).join('\n')
        if (strInput.length > 0) arraySimpleInput.push(strInput)

        return arraySimpleInput
    }

    /**
     * 从给定的html中直接拿到sending
     * @param {String} innerHTML 
     * @returns {Array} 以数组形式储存, 只含有string和File. 
     */
    function getInputFromHtml(innerHTML) {
        let arrayInput = simpleInput(innerHTML)
        let arraySimpleInput = new Array()


        let fileIndex = -1
        let strInput = ''
        arrayInput.forEach((value, index) => {
            // console.log(index, typeof (value), '----')
            // console.log(value)
            if (typeof (value) != 'string') {
                strInput = arrayInput.slice(fileIndex + 1, index).join('\n')
                if (strInput.length > 0) arraySimpleInput.push(strInput)

                arraySimpleInput.push(value)
                fileIndex = index
            }
        })

        strInput = arrayInput.slice(fileIndex + 1).join('\n')
        if (strInput.length > 0) arraySimpleInput.push(strInput)

        return arraySimpleInput
    }

    /**
     * 获取发送内容, 并发送
     * 如果给fromHtml, 那就从fromHtml中抓取消息发送
     * @param {String} fromHtml 
     */
    function sendInput(fromHtml = undefined) {


        // 获取appname
        let userID = $("#td-right div.td-chat-title").attr("data-user-i-d")
        let webTag = $("#td-right div.td-chat-title").attr("data-app-name")


        if (userID && webTag) {
            let arraySend = undefined
            if (fromHtml == undefined) {
                arraySend = getInput('div.td-inputbox')

                // 清理消息
                $("div.td-inputbox").empty()
            } else {
                arraySend = getInputFromHtml(fromHtml)
            }

            // console.log('-----send-----')
            if (arraySend.length > 0) {

                arraySend.unshift(userID)
                // $(webTag2Selector(webTag)).focus()
                td.tdMessage.HostSendToWeb(webTag2Selector(webTag), { 'sendDialog': arraySend }, 500000).then(() => {

                    //删除File list
                    // arraySend.forEach((value, index) => {
                    //     console.log(index, typeof (value))
                    //     if (typeof (value) != 'string') {
                    //         console.log("file : ", value.fileID)
                    //         fileList[value.fileID].clear()
                    //         delete fileList[value.fileID]
                    //     }
                    // })

                }).catch((err) => {
                    console.log("send failed", err)
         
                })
            }
        }


    }

    function resetDownloadList() {
        dlList = []

        store.set('donwloadList', dlList)

        return dlList
    }


    function updateDonwloadList(...dlItems) {

        dlList = store.get('donwloadList')

        console.log("===download list dlitemse====")
        console.log(dlItems)

        if (dlList) {
            dlList.unshift(...dlItems)
        } else {
            dlList = []
        }


        store.set('donwloadList', dlList)

        console.log("===download list update====")
        console.log(dlList)

        return dlList

    }

    // =============================程序主体=============================



    //==============================UI==============================
    /**
     * 注释.....图钉跟随?
     */
    function followPin() {
        let target = document.getElementById('td-pin')
        let x = target.getBoundingClientRect().x
        let y = target.getBoundingClientRect().bottom
        let pinCoord = [x, window.innerHeight - y]
        window.scrollTo(0, 0)
        document.getElementById('td-left').style.width = x + 'px'
        document.getElementById('td-input').style.height = window.innerHeight - y + 'px'
        store.set('tdSettings.pinCoord', pinCoord)
        // console.log('tdSettings.pinCoord changed to: ', pinCoord)
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

    document.getElementById('swTray').addEventListener('click', function () {

        store.set('tdSettings.swTray', this.checked)

    })

    // ==== waiting to move ext
    $(document).on('show.bs.modal', '.modal', function (e) {
        $(this).css('left', '')
    })

    // ==============

    document.getElementById('debug-img-rotate').addEventListener('click', function (e) {
        console.warn($(e.target).siblings('div').first().children().first())
        angle += 90
        let target = $(e.target).siblings('div').first().children().first()
        aspectRatio = target.height() / target.width()
        if (angle % 180 == 0) {
            console.warn("")
            target.css({ "transform": "rotate(" + angle + "deg)" })
        } else {
            target.css({ "transform": "rotate(" + angle + "deg) scale(" + aspectRatio + ", " + aspectRatio + ")" })
        }
    })

    /**
     * webview隐藏
     */
    $('.modal:hidden').each((index, element) => {
        if (!element.matches('#modal-image') && !element.matches('#modal-settings')) {
            $('>div.modal-dialog', element).removeClass('modal-xl')
        }
        // $('#modal-wechat > div.modal-dialog').css('left', '')
        $(element).css('left', '100000px')
        $(element).show()

        $(webTag2Selector(element.id.substring(6))).width("800px")
        $(webTag2Selector(element.id.substring(6))).height("800px")
    })
    $(document).on('hidden.bs.modal', '.modal', function (e) {
        if (!this.matches('#modal-image') && !this.matches('#modal-settings')) {
            $('>div.modal-dialog', this).removeClass('modal-xl')
            // 关闭webview app重新静音
            $(webTag2Selector(this.id.substring(6))).get(0).setAudioMuted(true)
        }
        // $('#modal-wechat > div.modal-dialog').css('left', '')
        $(this).css('left', '100000px')
        $(this).show()

        $(webTag2Selector(this.id.substring(6))).width("800px")
        $(webTag2Selector(this.id.substring(6))).height("800px")
    })
    $('#modal-image').on('hidden.bs.modal', function (e) {
        angle = 0
        $(".modal-body > img", this).css({ "transform": "rotate(0deg)" })
    })

    $('#modal-settings').on('show.bs.modal', function (e) {


        // 加载 ext
        $('div[extTag]').remove()

        // load extList
        if (store.has('tdSettings.extList')) {
            let extListStore = store.get('tdSettings.extList')
            $.each(extListStore, (webTag, details) => {
                // console.log(' ', webTag,' | ', details.status , debug, (debug && details.status) )
                $("#modal-settings .modal-body").append(
                    '<div extTag="' + webTag + '">\
<input type="checkbox" ' + (details.status ? 'checked="checked"' : '') + '>\
<label >'+ details.name + '</label>'+ ( (debug && details.status) ? ' <button devTool>devTool</button>' : '' )
+'</div>')
            })
        }
    })

    // ext被点击
    $('#modal-settings').on('click', 'div[extTag] input', function (e) {

        let webTag = $(e.target).parent('div[extTag]').attr('extTag')
        let configPath = store.get("tdSettings.extList." + webTag).configPath
        if (e.target.checked) {
            installExt(configPath)
        } else {
            uninstallExt(configPath)
        }
    })

    /**
     * webview出现
     */
    $(document).on('click', '.td-app-status img[class]', function () {
        let webTag = this.id.substring(4)

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

        // 打开webview app, 取消静音
        $(webTag2Selector(webTag)).get(0).setAudioMuted(false)


    })



    // ===========================接收消息===========================

    td.tdMessage.WinReply((key, arg) => {
        return respFuncWinReply(key, arg)
    })


    // 点击convo
    $('#td-convo-container').on('click', 'div.td-convo', function () {

        // 识别webtag
        let cWebTag = $("div.td-chat-title").attr("data-app-name")
        let cUserID = $("div.td-chat-title").attr("data-user-i-d")
        let webTag = $(this).attr("data-app-name")
        let userID = $(this).attr("data-user-i-d")
        let nickName = $(this).find("div.td-nickname").text()

        if (webTag == undefined || userID == undefined) {
            console.log("error : click obj error.")
            console.log("obj : ", this)
            console.log("userID : ", userID)
            return
        }

        $('#td-convo-container div.td-convo').removeClass('theme-transduction-active')
        $(this).addClass('theme-transduction-active')

        // 读取和临时储存草稿
        //去掉focus, focus在向后台发送查询后再添加
        $(".td-inputbox").blur()
        let inputHtml = $(".td-inputbox").html()
        if (cWebTag != undefined && cUserID != undefined) {
            inputDraft.add(cWebTag, cUserID, inputHtml)
        }

        if (inputDraft.query(webTag, userID) != undefined) {
            inputHtml = inputDraft.query(webTag, userID)
        } else {
            inputHtml = ''
        }
        $(".td-inputbox").empty()
        $(".td-inputbox").append(inputHtml)


        // 加载dialog(当前可能显示的是tool)
        $(debug_goBackChat_str).click()
        // 滑动条拖到最后
        let dialogSelector = "#td-right div.td-chatLog[wintype='chatLog']"
        $(dialogSelector).scrollTop($(dialogSelector)[0].scrollHeight)

        if (
            $("#td-right div.td-chat-title").attr("data-user-i-d") == userID
            && $("#td-right div.td-chat-title").attr("data-app-name") == webTag
            && $("#td-right div.td-chat-title h2").text() == nickName
        ) {
            // 当前聊天内容不需要清空, 只需要补充
            td.tdMessage.HostSendToWeb(
                webTag2Selector(webTag),
                { "queryDialog": { "userID": userID } }
            ).then((res) => {
                console.log("queryDialog : webReply : ", res)
                $(".td-inputbox").focus()
                setEndOfContenteditable($(".td-inputbox").get(0))
            }).catch((error) => {
                $(".td-inputbox").focus()
                setEndOfContenteditable($(".td-inputbox").get(0))
                throw error
            })

        } else {
            // ---------右侧标题-----------
            $("#td-right div.td-chat-title").attr("data-user-i-d", userID)
            $("#td-right div.td-chat-title").attr("data-app-name", webTag)
            $("#td-right div.td-chat-title h2").text(nickName)
            $("#td-right div.td-chat-title img").attr('src', path.join(extList[webTag].dir, extList[webTag].icon.any))
            $("#td-right div.td-chatLog[wintype='chatLog']").empty()

            td.tdMessage.HostSendToWeb(
                webTag2Selector(webTag),
                { "queryDialog": { "userID": userID } }
            ).then((res) => {
                console.log("queryDialog : webReply : ", res)

                $(".td-inputbox").focus()
                setEndOfContenteditable($(".td-inputbox").get(0))

            }).catch((error) => {
                $(".td-inputbox").focus()
                $(".td-inputbox").get(0).setSelectionRange($(".td-inputbox").html().length, $(".td-inputbox").html().length)
                setEndOfContenteditable($(".td-inputbox").get(0))

                throw error

            })
        }
    });



    window.onresize = () => {
        // console.log("===window resize====")
        document.getElementById('td-pin').style.left = window.getComputedStyle(document.getElementById('td-left')).getPropertyValue('width')
        document.getElementById('td-pin').style.bottom = window.getComputedStyle(document.getElementById('td-input')).getPropertyValue('height')
        // console.log(window.getComputedStyle(document.getElementById('td-left')).getPropertyValue('width'))
    }



    // =================tool click==================
    // tool click
    $('div.td-toolbox').on('click', '.theme-transduction', (e) => {

        if (e.target.id === 'tool-goBackChat') {
            // 返回聊天窗口
            $('.td-toolbox > img').removeClass('theme-transduction-active')

            $("#td-right div.td-chatLog[winType='chatLog']").show()
            // webview隐藏, 防止再次点击刷新页面
            $("#td-right div.td-chatLog[winType='tool'] webview").each(function (index) {
                $(this).hide();
            });
            $("#td-right div.td-chatLog[winType='tool']").hide()
        } else {
            $('.td-toolbox > img').removeClass('theme-transduction-active')
            $(e.target).addClass('theme-transduction-active')
            let toolTagName = e.target.id.substring(5)
            $("#td-right div.td-chatLog[winType='chatLog']").hide()
            $("#td-right div.td-chatLog[winType='tool']").show()

            loadTool("#td-right div.td-chatLog[winType='tool']", toolTagName, extList[toolTagName].webview.url, extList[toolTagName].webview.script)
        }
    })

    $('#openDevTools').on('click', ()=>{
        td.tdMessage.sendToMain({ "openDevTools": "" })
    })

    $(document).on('click', '[devtool]', (e)=>{
        let webTag = $(e.target).closest('div[exttag]').attr('exttag')
        if(! openDevtool( webTag )){
            console.error('open Devtool failed, because no webview with tag : ', webTag)
        }
    })
    // ======================拖入东西==========================
    // 检测到拖入到东西
    // 当tool打开的时候, 只接受输入框位置拖入
    $('#td-right').on('dragenter', (event) => {
        // $('.td-dropFile').show()
        $('.td-dropFile').removeClass('hide')
    })

    $('div.td-inputbox').on('dragenter', (event) => {
        $('.td-dropFile').removeClass('hide')
    })

    // 拖出右侧还原
    $('.td-dropFile').on('dragleave', (event) => {
        $('.td-dropFile').addClass('hide')
    })


    //识别到放下东西
    $('.td-dropFile').on('drop', (event) => {
        // console.log('drop')
        $('.td-dropFile').addClass('hide')
        event.preventDefault();

        processDataTransfer(event.originalEvent.dataTransfer).then(() => {

            $(".td-inputbox").focus()

            td.tdMessage.sendToMain({ "focus": "" })

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

        sendInput()
    })

    // 发送图片
    $('#debug-img-send').on('click', function () {
        // console.log("send clicked------>")


        sendInput($('div.td-dropFile > div > img:nth-child(1)').get(0).outerHTML)

        $("div.td-dropFile > img").removeClass("td-none")
        $('div.td-dropFile > div > img:nth-child(1)').attr('src', '../res/pic/nothing.png')
        $('div.td-dropFile > div > img:nth-child(1)').attr('data-file-ID', '')
        $('div.td-dropFile > div').addClass('td-none')
        $('.td-dropFile').addClass('hide')

    })

    //取消发送图片
    $('#debug-img-cancel').on('click', function () {
        $("div.td-dropFile > img").removeClass("td-none")
        $('div.td-dropFile > div > img:nth-child(1)').attr('src', '../res/pic/nothing.png')
        $('div.td-dropFile > div > img:nth-child(1)').attr('data-file-ID', '')
        $('div.td-dropFile > div').addClass('td-none')
        $('.td-dropFile').addClass('hide')
    })

    // ===查询后台登录情况===
    $("#td-request-status").on("click", () => {
        console.log("log off click")
        // $("webview[data-app-name]").each((index, el) => {
        //     let webTag = $(el).attr("data-app-name")
        //     // console.log()
        //     td.tdMessage.HostSendToWeb(webTag2Selector(webTag), { 'queryLogStatus': '' }).then((obj) => {
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

        td.tdMessage.HostSendToWeb(webTag2Selector("wechat"), { 'logoff': '' }).then((obj) => {

        })

        // $(webTag2Selector("skype")).focus()
        td.tdMessage.HostSendToWeb(webTag2Selector("skype"), { 'logoff': '' }).then((obj) => {

        })

    })

    // 阻拦全部链接点击
    $(document).on('click', 'a[href]', function (event) {

        event.preventDefault();
        event.stopPropagation();
        // console.log(this.href.substring(0,4))
        if (this.href.substring(0, 4) == 'http') {

            if (this.href.search('https://send.firefox.com/download') !== -1) {
                // 在tool打开
                // console.log("click : ", this.href)

                $(debug_firefox_send_str).click()

                loadTool("#td-right div.td-chatLog[winType='tool']", "firefox-send", this.href, '')
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

    // 下载
    $(document).on('click', '[download]', function (event) {
        // console.log('download : ', this)
        let type = undefined
        let msgID = undefined
        if (event.target.nodeName == 'IMG') {
            type = 'img'
            msgID = event.target.msgId
        } else {
            type = 'file'
            msgID = $(this).closest('div.td-bubble').attr('msgid')

            $(this).closest('div.td-bubble').addClass('td-downloading')
        }

        td.tdMessage.sendToMain({
            'download': {
                'url': $(this).attr('href'),
                'unicode': td.tdBasic.uniqueStr(),
                'webTag': $("div.td-chat-title").attr('data-app-name'),
                'userID': $("div.td-chat-title").attr('data-user-i-d'),
                'msgID': msgID,
                'type': type
            }
        })
            .then((saveInfo) => {
                console.log("download complete , info : ", saveInfo.download)
                if (type == 'img') {

                } else {
                    $(this).closest('div.td-bubble').removeClass('td-downloading')

                    $(this).closest('div.td-bubble').addClass('td-downloaded')

                    $(this).closest('div.td-bubble').find('button[open]').attr('path', saveInfo.download.savePath)

                }
                // 储存 donloadList
                donwloadList = updateDonwloadList(saveInfo.download)

            })

    });

    $(document).on('click', 'img[reload]', function (event) {
        console.log('reload : ', $(this), $(this).closest('modal-content').find('webview'))
        // td.tdMessage.sendToMain({'download':{'url': $(this).attr('href'), 'path':'/temp/'}})
        let webview = $(this).closest('.modal-content').find('webview')
        if (webview) {
            $(webview).get(0).reload()
        }

    });

    $(document).on('click', '[open]', function (event) {
        console.log("show item : ", $(this).closest('div.td-bubble button[open]').attr('path'),
            shell.showItemInFolder($(this).closest('div.td-bubble button[open]').attr('path')))
    })

    // 右侧对话框, 滑条有变化
    $(".td-chatLog[wintype='chatLog']").scroll(function () {
        console.log("scroll !!!")

        let dialogSelector = "#td-right div.td-chatLog[wintype='chatLog']"

        // 在dialog能看见的情况(不是在tool)
        if ($(dialogSelector).is(":visible")) {

            // 滑条没有在最后, 添加一键回到最后
            if (Math.abs($(dialogSelector).scrollTop() + $(dialogSelector)[0].clientHeight - $(dialogSelector)[0].scrollHeight) >= 64) {

            } else { // 滑条在最后, 去掉一键滚动

            }
        }

    });


    $(document).on('keypress', function (event) {
        // console.log("keypress",event.which )
        // if(document.activeElement == $(".td-inputbox").get(0)){

        // }else{

        // }
        // console.log('focus : ',$(document.activeElement).is(".td-inputbox"), ' key press : ', event.which, event.ctrlKey)
        // $(".td-inputbox").focus()

        if ($(document.activeElement).is(".td-inputbox")) {

            if (event.which == 13) {
                // enter pressed
                $(debug_send_str).click()
                return false
            }
            // ctr+enter : newline
            if (event.ctrlKey && event.which == 10) {
                arrayIn = jQuery.parseHTML($('div.td-inputbox').get(0).innerHTML)
                if (($(arrayIn)[arrayIn.length - 1].nodeName != 'BR')) {
                    $('div.td-inputbox').append('<br>')
                }
                pasteHtmlAtCaret("<br>", 'div.td-inputbox')
            }


        } else {
            // 闪烁
        }

    })

    $(document).keydown(function (event) {

        // console.log("keydown",event.which )
        if ($(document.activeElement).is(".td-inputbox")) {

            // tab 只能激活keydown, 不能激活keypress
            if (!event.ctrlKey && event.which == 9) {
                // console.log("tab down")
                // $('div.td-inputbox').append('&nbsp;')
                event.preventDefault();
                event.stopPropagation();
                pasteHtmlAtCaret("\t", 'div.td-inputbox')
            }

        }


        // ctrl+up/down 切换convo
        if (event.ctrlKey && (event.which == 38 || event.which == 40)) {
            // console.log("tab down")
            event.preventDefault();
            event.stopPropagation();
            // 
            // console.log("切换联系人")
            let lengthConvo = $('.td-convo:visible').length
            let classTactive = 'theme-transduction-active-tran'
            let cStrSelector = '.' + classTactive

            let convoSelector = '.td-convo:visible'

            if (lengthConvo > 0) {

                let activePos = $(convoSelector).index($('.theme-transduction-active'))

                let TactivePos = $(convoSelector).index($(cStrSelector))

                $(convoSelector).removeClass(classTactive)

                if ((activePos == -1 && TactivePos == -1)) {
                    // 既没有active也没有临时(Tactive), Tactive放在第一位 
                    // console.log("add tactive at 0")
                    $(convoSelector).eq(0).addClass(classTactive)
                } else if (lengthConvo > 1 && activePos > -1 && TactivePos == -1) {
                    // 有active, 没有Tactive : 根据方向键选择active的邻近一个
                    if (event.which == 38) {
                        // up
                        let nextP = td.tdMath.periodicPos(activePos - 1, lengthConvo)
                        $(convoSelector).eq(nextP).addClass(classTactive)

                    } else if (event.which == 40) {
                        // down
                        let nextP = td.tdMath.periodicPos(activePos + 1, lengthConvo)
                        $(convoSelector).eq(nextP).addClass(classTactive)
                    }
                } else if (lengthConvo > 1 && TactivePos > -1) {
                    if (event.which == 38) {
                        // up
                        let nextP = td.tdMath.periodicPos(TactivePos - 1, lengthConvo)
                        if (nextP == activePos) {

                        } else {
                            $(convoSelector).eq(nextP).addClass(classTactive)
                        }

                    } else if (event.which == 40) {
                        // down
                        let nextP = td.tdMath.periodicPos(TactivePos + 1, lengthConvo)
                        if (nextP == activePos) {

                        } else {
                            $(convoSelector).eq(nextP).addClass(classTactive)
                        }
                    }
                }
            }

        }

        // esc按下
        if (event.which == 27) {
            // console.log('esc pressed')
            // 图片确认界面
            if (!$("div.td-dropFile > img").is(':visible') && $("div.td-dropFile > div").is(':visible')) {
                $('#debug-img-cancel').click()
            }

        }
    })


    $(document).keyup(function (event) {
        // console.log("keyup",event.which )

        if (event.which == 17) {
            // control 抬起

            let cStrSelector = '.' + classTactive
            let convoSelector = '.td-convo:visible'

            if ($(cStrSelector).length > 0) {
                // tacitve存在, 切换联系人
                event.preventDefault();
                event.stopPropagation();

                let TactivePos = $(convoSelector).index($(cStrSelector))
                $(convoSelector).removeClass(classTactive)
                $(convoSelector).eq(TactivePos).get(0).click()
            }
        }

    })

    $(document).on('contextmenu', (evt) => {
        let target = $(evt.target).closest('div.td-convo')
        let yOffset = 0
        if (target.length) {
            /**
             * 画线，删线
             */
            if (target.hasClass('selected')) {
                target.toggleClass('selected')
                target.data('line').remove()
            } else {
                $('#td-mix').css('opacity', '1')
                target.toggleClass('selected')
                target.data('line', new LeaderLine(target[0], document.getElementById('td-mix'), { dropShadow: true, startPlug: 'disc', endPlug: 'disc', path: 'fluid' }))
            }
            /**
             * 算convo高度的平均值，作为按钮的位置
             */
            $('div.td-convo.selected').each(function (index, element) {
                yOffset -= yOffset / (index + 1)
                yOffset += $(element).position().top / (index + 1)
            })
            /**
             * 如果没有选中，按钮消失
             */
            $('#td-mix').css('transform', 'translateY(' + yOffset + 'px)')
            if($('div.td-convo.selected').length === 0){
                $('#td-mix').css('opacity', '0')
            }
        }
    })

    /**
     * 更新线位置
     */
    $('#td-mix').on('transitionend', ()=>{
        $('div.td-convo.selected').each(function(){
            $(this).data('line').position()
        })
    })

})
