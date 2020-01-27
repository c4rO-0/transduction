/**
 * index.js 后台处理的函数大概都在这
 */

const events = require('events')
const fs = require('fs')
const path = require('path')
const Store = require('electron-store');
const store = new Store();

const { tdMessage } = require('tdMessage')
const { tdPage } = require('tdBasic')
const { tdOS } = require('tdSys')
const { tdSimulator} = require('tdSimulator')

/**
 * 用来统一管理List
 * 比如 extList, downloadList等
 * list本质是object
 */
class tdList {

    constructor(pathInStore = undefined) {
        this.list = {}
        this.pathInStore = pathInStore
    }
    addListFromSub(subList) {
        this.list = { ...this.list, ...subList }
    }
    addListFromEle(key, element) {
        this.list[key] = element
    }
    deleteEleByKey(key) {
        delete this.list[key]
    }
    deleteEleByIndex(index) {
        delete this.list[Object.keys(this.list)[index]];
    }
    getLen() {
        return (Object.keys(this.list)).length
    }
    getList() {
        return this.list
    }
    getValueByKey(key) {
        return this.list[key]
    }
    getSubByKeys(...keys) {
        let subList = new tdList()
        keys.forEach(key => {
            subList.addListFromEle(key, this.list[key])
        })
        return subList
    }
    getValueByIndex(index) {
        return this.list[Object.keys(this.list)[index]]
    }
    updateEleValue(key, value) {
        this.list[key] = value
    }
    print(commit = undefined) {
        if (commit) {
            console.log(commit)
        }
        console.log(this.list)
    }
    toJSONList(funToJSON = (obj) => {
        return JSON.stringify(obj)
    }) {
        let pList
        for (let key in this.list) {
            pList[key] = funToJSON(this.list[key])
        }
        return pList
    }
    fromJSONList(pList, funFromJSON = (obj) => {
        return obj
    }) {
        for (let key in pList) {
            this.list[key] = funFromJSON(pList[key])
        }
    }
    getPathInStore() {
        return this.pathInStore
    }
    hasPathInSore() {
        return !(this.pathInStore === undefined
            || this.pathInStore === '')
    }
    setPathInStore(pathInStore) {
        this.pathInStore = pathInStore
        if (!this.hasPathInSore()) {
            throw ('illegal path : ', pathInStore);
        }
    }
    getListInSore(funFromObj = (obj) => {
        return obj
    }) {
        if (store.has(this.pathInStore)) {
            this.fromJSONList(store.get(this.pathInStore), funFromObj)
        } else {
            console.error('no ', this.pathInStore, ' in store.')
        }

    }
    saveListInStore(override = true, funToJSON = (obj) => {
        return JSON.stringify(obj)
    }) {
        if (override) {
            store.set(this.pathInStore, this.toJSONList(funToJSON))
        } else {
            if (!store.has(this.pathInStore)) {
                store.set(this.pathInStore, this.toJSONList(funToJSON))
            }
        }
    }
    saveEleInStore(key, override = true, funToJSON = (obj) => {
        return JSON.stringify(obj)
    }) {
        if (!(key in this.list)) {
            return
        }

        if (override) {
            store.set(this.pathInStore + '.' + key, funToJSON(this.list[key]))
        } else {
            if (!store.has(this.pathInStore + '.' + key)) {
                store.set(this.pathInStore + '.' + key, funToJSON(this.list[key]))
            }
        }
    }
    resetListInStore() {
        if (this.hasPathInSore()) {
            store.reset(this.pathInStore)
        }

    }
    deleteListInStore() {
        if (this.hasPathInSore()) {
            store.delete(this.pathInStore)
        }
    }
    hasListInStore() {
        return (this.hasPathInSore() && store.has(this.pathInStore))
    }
}

class tdAPI {

    /**
     * 函数构想
     * - 获取所有Convo
     * - 获取激活的Convo
     * - 获取激活Convo对应的Bubble列表
     * - 切换激活的Convo
     * - 发送消息?
     * - 获取设置
     * - 更改设置
     * - 下载列表
     */

    // static isDebugOn

    // static fileSendList
    // static donwloadList
    // static convoList
    // static bubbleList
    static extList

    /**
     * event list
     * ready : 初始化完毕
     * 
     * ext-install
     * ext-remove
     * 
     * convo-new : 从webview接收到新的Convo
     * convo-update : convoList有更新
     * convo-active : convo被激活
     * 
     * bubble-new :
     * bubble-update :
     * 
     * 
     */
    static event

    static initialize() {

        // set event
        // this.event = new events.EventEmitter();
        // tdUI.rightBackToDefault()

        // - initial extension list
        this.extList = new tdList(tdExt.rootPathInStore)
        if (this.extList.hasListInStore()) {
            this.extList.getListInSore(tdExt.fromJSON)
            // this.extList.print('----extension list-----')

            $.each(this.extList.getList(), (webTag, ext) => {
                // console.log(webTag, ext)
                if (ext.status) {
                    ext.loadExtConfigure().then(() => {
                        // -o load
                        // ext.print('---ext---')
                        ext.enableExtConfigure()
                    }).then(() => {
                        // save
                        // ext.saveExtInStore()
                    })

                }
            })
        }

    }


    
    //------------------------
    // 处理消息
    /**
     * tdMessage.WinReplyWeb 处理消息的函数
     * @param {String} webTag 区分web
     * @param {String} key MSG的类别 : 
     * MSG-Log : 收到右侧窗口聊天记录
     * MSG-new : 左侧提示有新消息
     * @param {Object} Obj 收到的具体消息
     */
    static respFuncWinReplyWeb(webTag, key, Obj) {


        return Promise.race([new Promise((resolve, reject) => {

            if ($(tdPage.webTag2Selector(webTag)).length == 0) {
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
                    $(tdPage.webTag2Selector(webTag)).blur()
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
                    tdMessage.sendToMain({ 'flash': Convo.nickName + ':' + Convo.message })
                    let convoNotification = new Notification('Tr| ' + webTag, {
                        body: Convo.nickName + '|' + Convo.message,
                        silent: true
                    })
                    // 因为系统原因, Notification silent在ubuntu失效, 所以需要统一播放声音
                    const noise = new Audio('../res/mp3/to-the-point.mp3')
                    noise.play()

                    convoNotification.onclick = () => {
                        // 弹出transduction, 并点击对应convo
                        tdMessage.sendToMain({ 'show': '' })
                        tdMessage.sendToMain({ 'focus': '' })
                        $('#td-convo-container [data-app-name=' + webTag + '][data-user-i-d="' + Convo.userID + '"]').click()
                    }
                }

                if (!Convo.muted // 非静音
                    && Convo.action != 'r' // 类型是a或者c
                    && Convo.message != undefined && Convo.message != ''
                    && !(document.hasFocus() || $(tdPage.webTag2Selector(webTag)).get(0).getWebContents().isFocused())
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
                        tdUI.rightBackToDefault()
                    }
                }

                resolve("copy that")
            } else if (key == 'focus') {
                console.log('focusing innnnnnnnnnnn')
                // let activeE = document.activeElement
                $(tdPage.webTag2Selector(webTag)).focus()
                setTimeout(() => {
                    // $(activeE).focus()
                    $(".td-inputbox").focus()
                    console.log(document.activeElement)
                }, 3000);
                resolve("focus done")
            } else if (key == 'blur') {
                console.log('bluring outttttttttttttttttttt')
                $(tdPage.webTag2Selector(webTag)).blur()
                console.log(document.activeElement)
                resolve("blur done")
            } else if (key == 'attachFile') {
                // 上传文件
                /* obj
                    "selector": str 
                    "file" : obj file
                */
                tdSimulator.attachInputFile(tdPage.webTag2Selector(webTag), Obj.selector, fileList[Obj.file.fileID].path)

                resolve("attached")
            } else if (key == 'simulateKey') {
                // 按键模拟

                tdSimulator.keypressSimulator(tdPage.webTag2Selector(webTag), Obj.type, Obj.charCode, Obj.shift, Obj.alt, Obj.ctrl, Obj.cmd)

                resolve("simulated")
            } else if (key == 'simulateMouse') {
                // 按键模拟
                console.log("simulateMouse", Obj)
                tdSimulator.mouseSimulator(tdPage.webTag2Selector(webTag), Obj.type, Obj.x, Obj.y)

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
                            tdUI.rightBackToDefault()
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

}


class tdConvo {
    //---------------------
    action // 最近一次动作
    userID // convoID, 也是userID
    nickName // 显示的昵称
    time // 最新一条消息时间
    avatar // 头像地址
    message // 最新一条消息
    counter // 未读消息数
    index // 在所属app中的Index
    muted // 是否静音
    isActInTd // 在transduction里是否为显示状态
    appTag // 所属appTag
    isBundle // 该convo是否捆绑了其他convo, 如果是appTag应该为'td'
    bundleList // 捆绑的其他app convo列表, bundleList = undefined , if isBundle == false

    // ----function-----
    // print()
    // update({key:value})
    // clone(old)
    // active()
    //---------------------


    print() {
        console.log("=====output Convo======")
        console.log("Name :", this.nickName)
        console.log("ID : ", this.userID)
        console.log("avatar : ", this.avatar)
        console.log("index :", this.index)
        console.log("message :", this.message)
        console.log("time :", this.time)
        console.log("counter :", this.counter)
        console.log("action :", this.action)
        console.log("muted :", this.muted)
    }

}

class tdBubble {
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

class tdExt {

    static rootPathInStore = 'tdSettings.extList'

    static fromJSON(json) {

        return Object.assign(new tdExt(), json);
    }

    loadWebview() {
        

        let webTag = this.webTag
        let url = this.webview.url
        let strUserAgent = this.getUserAgent()


        if ($(tdPage.webTag2Selector(webTag)).length > 0) {
            console.log("load")
            if (strUserAgent) {
                $(tdPage.webTag2Selector(webTag)).get(0).getWebContents().loadURL(url,
                    {
                        "userAgent":
                            "userAgent : " + strUserAgent,
                        "extraHeaders": "User-Agent:" + strUserAgent + "\n"
                    })
            } else {
                $(tdPage.webTag2Selector(webTag)).get(0).getWebContents().loadURL(url)
            }

            // 静音
            $(tdPage.webTag2Selector(webTag)).get(0).setAudioMuted(true)

        }
    }


    loadExtConfigure() {

        console.log("load extension config ...")

        return new Promise((resolve, reject) => {

            fs.readFile(this.configPath, (err, rawConfig) => {

                if (err) {
                    // 文件不存在, 或者 
                    if (err.code === 'ENOENT') {
                        console.error('no configure found in ', this.configPath)
                    } else if (err.code === 'EISDIR') {
                        console.error('configure path \' ', this.configPath, '\' is a directory')
                    } else {
                        console.error('configure read failed', this.configPath)
                    }

                    reject(err)
                    return
                } else {
                    let config = JSON.parse(rawConfig)
                    config.dir = path.dirname(this.configPath)
                    config.pathConfig = this.configPath
                    config.webTag = config.name + "-" + config.unicode

                    // 必须含有name
                    // 不能含有. - 
                    if (config.name === undefined
                        || config.name === "") {
                        reject("load extension error , no name found in ", this.configPath)
                        return
                    }

                    // 必须含有type
                    if (config.type !== 'app' && config.type !== 'tool') {
                        reject("load extension error , unknown type in ", this.configPath)
                        return
                    }

                    // 必须含有unicode
                    if (config.unicode === undefined && config.unicode === "") {
                        reject("load extension error , no unicode in ", this.configPath)
                        return
                    }

                    try {
                        // icon是必需的
                        if (!fs.existsSync(path.join(config.dir, config.icon.any))) {
                            reject("load extension error , no logo found in ", config.icon.any)
                            return
                        }
                    } catch (err) {
                        console.error(err)
                        reject("load extension error , no logo found in ", config.icon.any)
                        return
                    }


                    Object.assign(this, tdExt.fromJSON(config));
                    resolve('done')

                }

            });

        })
    }

    enableExtConfigure() {

        console.log("act ", this.name, " config ...")

        return new Promise((resolve, reject) => {

            // -o 判断extension是否已安装
            if (this.isExtLoaded()) {
                console.log(this.name, " already enabled")
                resolve('done')
                return
            }

            if (this.type === 'app') {
                // -o insert logo
                $("div.td-app-status").append('\
<img id="app-'+ this.webTag + '" class="app-offline" src="' + path.join(this.dir, this.icon.any) + '">')

                // -o insert webview
                $(".td-stealth").append('\
<div id="modal-'+ this.webTag + '" class="modal fade" tabindex="-1" role="dialog">\
<div class="modal-dialog modal-dialog-centered" role="document">\
    <div class="modal-content">\
        <div class="modal-body">\
            <webview data-app-name="'+ this.webTag + '" preload="' + path.join(this.dir, this.webview.script) + '" style="width:800px; height:800px">\
            </webview>\
        </div>\
        <img reload style="position: absolute; bottom: 0; right: 0; width: 42px; height: 42px;" src="../res/pic/reload.png">\
        <!-- <button reload>reload</button> -->\
    </div>\
</div>\
</div>')

                // -o replace hide
                let element = $('#modal-' + this.webTag).get(0)
                if (!element.matches('#modal-image') && !element.matches('#modal-settings')) {
                    $('>div.modal-dialog', element).removeClass('modal-xl')
                }
                $(element).css('left', '100000px')
                $(element).show()

                $(tdPage.webTag2Selector(element.id.substring(6))).width("800px")
                $(tdPage.webTag2Selector(element.id.substring(6))).height("800px")


                this.loadWebview()

                // -o run action
                try {
                    if (!fs.existsSync(path.join(this.dir, this.action_script))) {
                        console.log(this.name, " warning : no action file", this)
                    } else {

                        require(path.join(this.dir, this.action_script)).action()

                    }

                } catch (err) {
                    console.log(this.name, " action error : ", err)
                }

                // -o add message listener
                console.log("add listener")

                tdMessage.WinReplyWeb(tdPage.webTag2Selector(this.webTag), (key, arg) => {
                    return tdAPI.respFuncWinReplyWeb(this.webTag, key, arg)
                })
            } else if (this.type === 'tool') {
                // -o insert logo
                $('div.td-chat div.td-toolbox').append(
                    '<img id="tool-'
                    + this.webTag + '" class="theme-transduction" src="'
                    + path.join(this.dir, this.icon.any) + '">')

            } else {
                reject("unknown type")
                return
            }

            // -o store config 
            // store.set("tdSettings.extList." + this.webTag,
            //     {
            //         'name': this.name,
            //         'status': true,
            //         'configPath': this.path
            //     })

            // // -o update global extList
            // extList[this.webTag] = this

            resolve("done")
        })
    }


    static disableExtConfigure() {

        return new Promise((resolve, reject) => {


            if (this.type == 'app') {
                // check modal is on
                if ($('#modal-' + this.webTag).hasClass('show')) {
                    $('#modal-' + this.webTag).modal('hide')
                }

                // waiting modal is hiden
                setTimeout(() => {
                    // remove logo
                    $('#app-' + this.webTag).off('click')

                    $('#app-' + this.webTag).remove()

                    // remove webview
                    $('#modal-' + this.webTag + ' webview').off('load-commit')

                    $('#modal-' + this.webTag + ' webview').off('dom-ready')

                    $('#modal-' + this.webTag).off('show.bs.modal')

                    $('#modal-' + this.webTag).remove()

                    // flag turn off
                    store.set("tdSettings.extList." + this.webTag,
                        {
                            'name': this.name,
                            'status': false,
                            'configPath': this.path
                        })

                    // remove convo
                    $('div.td-convo[data-app-name="' + this.webTag + '"]').remove()

                    // empty right
                    tdUI.rightBackToDefault()

                    // remove from extList
                    delete extList[this.webTag];

                    resolve()
                }, 1000);


            } else if (this.type == 'tool') {
                // -o is shown
                if ($('#td-right div.td-chatLog[winType="tool"] webview[data-tool-name="' + this.webTag + '"]').is(":visible")) {
                    $('tool-goBackChat').click()
                }

                // -o delete icon
                $('#tool-' + this.webTag).remove()

                // -o delete webview
                $('webview[data-tool-name="' + this.webTag + '"]').remove()

                // flag turn off
                store.set("tdSettings.extList." + this.webTag,
                    {
                        'name': this.name,
                        'status': false,
                        'configPath': this.path
                    })

                // remove from extList
                delete extList[this.webTag];
                resolve()
            }

        })

    }

    isExtLoaded() {

        return ($('[id*="' + this.webTag + '"]').length > 0)

    }

    print(commit = undefined) {
        if (commit) {
            console.log(commit)
        }
        console.log(this)
    }

    saveExtInStore(override = true, funToJSON = (obj) => {
        return JSON.stringify(obj)
    }) {

        if (override) {
            store.set(this.rootPathInStore + '.' + this.webTag, funToJSON(this))
        } else {
            if (!store.has(this.rootPathInStore + '.' + this.webTag)) {
                store.set(this.rootPathInStore + '.' + this.webTag, funToJSON(this))
            }
        }
    }
    getUserAgent(){
        let strUserAgent = tdOS.strUserAgentWin
        if (this.webview.useragent == 'windows'
            || this.webview.useragent == ''
            || this.webview.useragent == undefined) {

        } else if (this.webview.useragent == 'linux') {
            strUserAgent = tdOS.strUserAgentLinux
        }else{
            strUserAgent = this.webview.useragent
        }
        return strUserAgent
    }
}

/**
 * 相应配套渲染UI的函数在这
 */
class tdUI {
    static rightBackToDefault() {
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

}

module.exports = { tdAPI, tdExt, tdList, tdUI }