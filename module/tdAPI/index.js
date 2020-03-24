/**
 * index.js 后台处理的函数大概都在这
 */

const events = require('events')
const fs = require('fs')
const path = require('path')
const Store = require('electron-store');
const { tdMessage } = require('tdMessage')
const { tdBasic, tdPage } = require('tdBasic')
const { tdOS, tdFileSend } = require('tdSys')
const { tdSimulator } = require('tdSimulator')

/**
 * 用来统一管理List
 * 比如 extList, downloadList等
 * list本质是object
 */
class tdList {

    constructor(pathInStore = undefined, storeIn = undefined) {
        this.list = {}
        this.pathInStore = pathInStore
        if (storeIn) {
            this.store = storeIn
        } else {
            this.store = new Store()
        }

        // console.log(this.pathInStore, this.store)
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
    hasEle(key) {
        return this.list.hasOwnProperty(key)
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
        if (this.store.has(this.pathInStore)) {
            this.fromJSONList(this.store.get(this.pathInStore), funFromObj)
        } else {
            console.error('no ', this.pathInStore, ' in store.')
        }

    }
    saveListInStore(override = true, funToJSON = (obj) => {
        return JSON.stringify(obj)
    }) {
        if (override) {
            this.store.set(this.pathInStore, this.toJSONList(funToJSON))
        } else {
            if (!this.store.has(this.pathInStore)) {
                this.store.set(this.pathInStore, this.toJSONList(funToJSON))
            }
        }
    }
    saveEleInStore(key, override = true, funToJSON = (obj) => {
        return JSON.parse(JSON.stringify(obj))
    }) {
        if (!(key in this.list)) {
            return
        }

        if (override) {
            this.store.set(this.pathInStore + '.' + key, funToJSON(this.list[key]))
        } else {
            if (!this.store.has(this.pathInStore + '.' + key)) {
                this.store.set(this.pathInStore + '.' + key, funToJSON(this.list[key]))
            }
        }
    }
    resetListInStore() {
        if (this.hasPathInSore()) {
            this.store.reset(this.pathInStore)
        }

    }
    deleteListInStore() {
        if (this.hasPathInSore()) {
            this.store.delete(this.pathInStore)
        }
    }
    hasListInStore() {
        return (this.hasPathInSore() && this.store.has(this.pathInStore))
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

    static isDebugOn

    // static fileSendList
    // static donwloadList
    // static convoList
    // static bubbleList
    static extList
    static donwloadList
    static inputList
    static fileList

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

        //=================================
        // set debug status
        tdAPI.getDebugStatus().then((status) => {
            // console.log("debug status :", status)
            tdAPI.isDebugOn = status

            if (status) {
                console.log('===You are in debug mod===')
                $("#openDevTools").show()
            } else {
                $("#openDevTools").hide()
            }
        })

        //=================================
        // - settings
        tdSettings.setSettings('swTray', true, false)
        tdUI.setSwTray(tdSettings.getSettings('swTray'))

        tdUI.setPin()


        //=================================
        // initialize bubble valuable
        tdBubble.iniTemplate()

        //=================================
        // - initial extension list
        tdAPI.extList = new tdList(tdExt.rootPathInStore)

        if (!tdAPI.extList.hasListInStore()) {
            // load default extList
            let tdRootPath = tdOS.tdRootPath()
            let defaultOffExtPathArray =
                [
                    path.resolve(tdRootPath, 'ext/firefoxsend/config.json'),
                    path.resolve(tdRootPath, 'ext/wechat/config.json'),
                    path.resolve(tdRootPath, 'ext/skype/config.json'),
                    path.resolve(tdRootPath, 'ext/dingtalk/config.json'),
                    path.resolve(tdRootPath, 'ext/latex2png/config.json'),
                    path.resolve(tdRootPath, 'ext/languagetool/config.json'),
                    path.resolve(tdRootPath, 'ext/whatsapp/config.json')
                ]
            defaultOffExtPathArray.forEach(pathConfig => {
                let ext = new tdExt(pathConfig)
                ext.loadExtConfigure().then(() => {
                    ext.removeExt()
                })
            })

        } else {
            tdAPI.extList.getListInSore(tdExt.fromJSON)
            $.each(tdAPI.extList.getList(), (webTag, ext) => {
                // ext.print()
                if (ext.status) {
                    ext.installExt()
                }
            })
        }

        //=================================
        // - Download List
        tdAPI.donwloadList = new tdList(tdDownloadItem.rootPathInStore, new Store({ 'name': 'downloadList' }))
        // console.log(tdAPI.donwloadList.store)
        tdAPI.donwloadList.getListInSore(tdDownloadItem.fromJSON)

        //=================================
        // - daft list
        tdAPI.inputList = new tdList()

        //=================================
        // - send file list
        tdAPI.fileList = new tdList()

    }


    static getDebugStatus() {
        return new Promise((resolve, reject) => {
            tdMessage.sendToMain({ 'isDebug': '' }).then((res) => {
                // console.log('debug reply:',res)
                resolve(res.isDebug)
            })
        })
    }

    /**
     * 打开webview Devtool
     * @param {string} appTag
     */
    static openDevtool(appTag) {

        if ($("webview[data-app-name='" + appTag + "']").length > 0) {
            let web = $("webview[data-app-name='" + appTag + "']")[0];
            web.openDevTools();
        } else if ($("webview[data-tool-name='" + appTag + "']").length > 0) {
            let web = $("webview[data-tool-name='" + appTag + "']")[0];
            web.openDevTools();
        } else {
            return false
        }

        return true

    }

    static notifyLocal(flash = true, sound = true, notTile = undefined, notBody = undefined, notCallback = undefined) {
        if (flash) {
            tdMessage.sendToMain({ 'flash': '' })
        }

        if (sound) {
            // 因为系统原因, Notification silent在ubuntu失效, 所以需要统一播放声音
            const noise = new Audio(path.resolve(tdOS.tdRootPath(), 'res/mp3/to-the-point.mp3'))
            noise.play()
        }

        if (notTile) {
            let convoNotification = new Notification('Tr| ' + notTile, {
                body: notBody,
                silent: true
            })
        }
        convoNotification.onclick = () => {
            notCallback()
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

            if ($(tdUI.webTag2Selector(webTag)).length == 0) {
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
                        $(dialogSelector).prepend(tdBubble.genFromDialog(value).createBubble())
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

                                    $(dialogSelector).append(tdBubble.genFromDialog(value).createBubble())

                                    arrayExistBubble.push({ 'msgTime': timeWaitInsert, 'msgID': value.msgID })
                                } else {
                                    $(tdBubble.genFromDialog(value).createBubble())
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
                                    .replaceWith(tdBubble.genFromDialog(value).createBubble()
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
                    $(tdUI.webTag2Selector(webTag)).blur()
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

                if (Obj.userID === undefined) {
                    reject("undefined user ID")
                    return
                }

                let Convo = new tdConvo(
                    webTag,
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


                if (!Convo.muted // 非静音
                    && Convo.action != 'r' // 类型是a或者c
                    && Convo.message != undefined && Convo.message != ''
                    && !(document.hasFocus() || $(tdUI.webTag2Selector(webTag)).get(0).getWebContents().isFocused())
                ) {
                    if (Convo.counter > 0) { //未读消息 >0
                        notifyLocal(true, true, webTag, Convo.nickName + '|' + Convo.message, () => {
                            tdMessage.sendToMain({ 'show': '' })
                            tdMessage.sendToMain({ 'focus': '' })
                            $('#td-convo-container [data-app-name=' + webTag + '][data-user-i-d="' + Convo.userID + '"]').click()
                        })
                    } else {
                        // 如果是选中的convo, 那么可能存在对方发消息, counter(未读消息) == 0, 
                        // 但实际并没有读取.
                        // 检查右侧如果不是自己发的, 就要弹提醒
                        if ($('div.td-chat-title[data-user-i-d="' + Convo.userID + '"]').length > 0) {
                            setTimeout(() => {
                                if ($('div.td-chatLog[wintype="chatLog"] > .td-bubble:last-child > div').hasClass('td-them')) {
                                    notifyLocal(true, true, webTag, Convo.nickName + '|' + Convo.message, () => {
                                        tdMessage.sendToMain({ 'show': '' })
                                        tdMessage.sendToMain({ 'focus': '' })
                                        $('#td-convo-container [data-app-name=' + webTag + '][data-user-i-d="' + Convo.userID + '"]').click()
                                    })
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

                    Convo.addToPage(true)

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
                    Convo.addToPage()
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
                $(tdUI.webTag2Selector(webTag)).focus()
                setTimeout(() => {
                    // $(activeE).focus()
                    $(".td-inputbox").focus()
                    console.log(document.activeElement)
                }, 3000);
                resolve("focus done")
            } else if (key == 'blur') {
                console.log('bluring outttttttttttttttttttt')
                $(tdUI.webTag2Selector(webTag)).blur()
                console.log(document.activeElement)
                resolve("blur done")
            } else if (key == 'attachFile') {
                // 上传文件
                /* obj
                    "selector": str 
                    "file" : obj file
                */
                tdSimulator.attachInputFile(
                    tdUI.webTag2Selector(webTag),
                    Obj.selector,
                    (tdAPI.fileList.getValueByKey(Obj.file.fileID)).path)

                resolve("attached")
            } else if (key == 'simulateKey') {
                // 按键模拟

                tdSimulator.keypressSimulator(tdUI.webTag2Selector(webTag), Obj.type, Obj.charCode, Obj.shift, Obj.alt, Obj.ctrl, Obj.cmd)

                resolve("simulated")
            } else if (key == 'simulateMouse') {
                // 按键模拟
                console.log("simulateMouse", Obj)
                tdSimulator.mouseSimulator(tdUI.webTag2Selector(webTag), Obj.type, Obj.x, Obj.y)

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


// class tdConvo {
//     //---------------------
//     action // 最近一次动作
//     userID // convoID, 也是userID
//     nickName // 显示的昵称
//     time // 最新一条消息时间
//     avatar // 头像地址
//     message // 最新一条消息
//     counter // 未读消息数
//     index // 在所属app中的Index
//     muted // 是否静音
//     isActInTd // 在transduction里是否为显示状态
//     appTag // 所属appTag
//     isBundle // 该convo是否捆绑了其他convo, 如果是appTag应该为'td'
//     bundleList // 捆绑的其他app convo列表, bundleList = undefined , if isBundle == false

//     // ----function-----
//     // print()
//     // update({key:value})
//     // clone(old)
//     // active()
//     //---------------------


//     print() {
//         console.log("=====output Convo======")
//         console.log("Name :", this.nickName)
//         console.log("ID : ", this.userID)
//         console.log("avatar : ", this.avatar)
//         console.log("index :", this.index)
//         console.log("message :", this.message)
//         console.log("time :", this.time)
//         console.log("counter :", this.counter)
//         console.log("action :", this.action)
//         console.log("muted :", this.muted)
//     }

// }
class tdConvo {
    constructor(webTag, action, userID, nickName, time, avatar, message, counter, index, muted) {
        this.webTag = webTag
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
            console.log("error : tdConvo :  wrong type of time : ", typeof (time), time)
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
            console.log("error : tdConvo :  unknown counter type : ", typeof (counter), counter)
            this.counter = undefined
        }

        if (index === undefined) {
            this.index = index
        } else if (typeof (index) == "number") {
            this.index = index
        } else if (typeof (index) == "string") {
            this.index = parseInt(index)
        } else {
            console.log("error : tdConvo :  unknown index type : ", typeof (index), index)
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
                console.log("error : tdConvo :  unknown muted value : ", muted)
                this.muted = undefined
            }

        } else {
            console.log("error : tdConvo :  unknown muted type : ", typeof (muted), muted)
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


    toHTML() {
        let displayCounter = "display: none;"
        let visibility = "td-invisible"
        if (this.counter) {
            displayCounter = ""
        }
        if (this.muted) {
            visibility = ""
        }

        let avatar = this.avatar == undefined ? '../res/pic/weird.png' : this.avatar
        // console.log(appName , extList )
        let ext = tdAPI.extList.getValueByKey(this.webTag)

        return '\
        <div class="td-convo theme-transduction td-font" data-user-i-d='+ this.userID + ' data-app-name=' + this.webTag + ' muted=' + this.muted + '>\
            <div class="col-appLogo">\
                <img src="'+ path.join(ext.dir, ext.icon.any) + '">\
            </div>\
            <div class="col-hint">\
                <div class="row-hint" style="background-color:'+ ext.icon.color + ';"></div>\
            </div>\
            <div class="col-avatar d-flex justify-content-center">\
                <div class="td-avatar align-self-center" style="background-image: url('+ avatar + ')"></div>\
                <div class="td-counter" style="'+ displayCounter + '">\
                    <div style="align-self:center;">'+ this.counter + '</div>\
                </div>\
            </div >\
        <div class="col col-text flex-column justify-content-center">\
                <div class="m-0 td-nickname">'+ this.nickName + '</div>\
                <div class="m-0 td-text">'+ tdPage.htmlEntities(this.message) + '</div>\
            </div>\
            <div class="col-auto pl-0 col-timestamp justify-content-around">\
                '+ this.time + '\
                <img class="' + visibility + ' align-self-center" src="../res/pic/mute.svg" height="18px">\
            </div>\
        </div > '
    }


    addToPage(isPretend = false) {
        let objConvo = $('#td-convo-container [data-app-name=' + this.webTag + '][data-user-i-d="' + this.userID + '"]')
        if (objConvo.length == 0 && isPretend) {
            $('#td-convo-container').prepend(this.toHTML())
        } else { // 检测存在
            for (let key in this) {
                if (this[key] != undefined) {
                    switch (key) {
                        case "avatar":
                            $(objConvo).find("div.td-avatar").attr("style", 'background-image: url(' + this.avatar + ')')
                            break;
                        case "counter":
                            $(objConvo).find("div.td-counter div").text(this.counter)
                            if (this.counter) {
                                $(objConvo).find("div.td-counter").css("display", "")
                            } else {
                                $(objConvo).find("div.td-counter").css("display", "none")
                            }
                            break;
                        case "nickName":
                            $(objConvo).find("div.td-nickname").text(this.nickName)
                            break;
                        case "message":
                            $(objConvo).find("div.td-text").text(this.message)
                            break;
                        case "time":
                            $(objConvo).find("div.col-timestamp").contents().filter(function () { return this.nodeType == 3; }).first().replaceWith(this.time);
                            break;
                        case "muted":
                            $(objConvo).attr('muted', this.muted)
                            if (this.muted) {
                                $(objConvo).find('img.align-self-center').removeClass('td-invisible')
                            } else {
                                $(objConvo).find('img.align-self-center').addClass('td-invisible')
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
        }
    }

}

class tdBubble {

    static bTextL
    static bTextR
    static bUrlL
    static bUrlR
    static bUnknownL
    static bUnknownR
    static bFSendL
    static bFSendR
    static bFileL
    static bFileR
    static bImgL
    static bImgR

    constructor(msgID,
        time = undefined,
        status = undefined,
        type = undefined,
        from = undefined,
        avatar = undefined,
        message = undefined,
        fileName = undefined,
        fileSize = undefined) {

        this.msgID = msgID

        // time
        if (time) {
            this.time = time
        } else {
            this.time = new Date()
        }

        this.status = status

        // type  'text' 'img' 'url' 'file' 'unknown' undefined
        this.type = type

        this.from = from

        this.avatar = avatar

        this.fileName = fileName

        this.fileSize = fileSize

        this.message = message

    }


    static iniTemplate() {

        tdBubble.bTextL = $('div[msgid="bTextL"]').clone()
        tdBubble.bTextR = $('div[msgid="bTextR"]').clone()

        tdBubble.bUrlL = $('div[msgid="bUrlL"]').clone()
        tdBubble.bUrlR = $('div[msgid="bUrlR"]').clone()

        tdBubble.bUnknownL = $('div[msgid="bUnknownL"]').clone()
        tdBubble.bUnknownR = $('div[msgid="bUnknownR"]').clone()

        tdBubble.bFSendL = $('div[msgid="bFSendL"]').clone()
        tdBubble.bFSendL = $('div[msgid="bFSendR"]').clone()

        tdBubble.bFileL = $('div[msgid="bFileL"]').clone()
        tdBubble.bFileR = $('div[msgid="bFileR"]').clone()

        tdBubble.bImgL = $('div[msgid="bImgL"]').clone()
        tdBubble.bImgR = $('div[msgid="bImgR"]').clone()
    }


    static genFromDialog(dialog) {

        return new tdBubble(
            dialog['msgID'],
            tdBasic.timeAny2Obj(dialog["time"]),
            dialog["status"],
            dialog['type'],
            dialog["from"],
            dialog["avatar"],
            dialog['message'],
            dialog['fileName'],
            dialog['fileSize'])

    }

    createBubble() {

        let cUser = $('div.td-chat-title').attr('data-user-i-d')
        let cwebTag = $('div.td-chat-title').attr('data-app-name')

        let time = tdBasic.timeObj2Str(this.time)

        let bHTML

        switch (this.type) {
            case 'text':
                if (this.from) {
                    bHTML = $(tdBubble.bTextL).clone()
                } else {
                    bHTML = $(tdBubble.bTextR).clone()
                }

                $(bHTML).find('div.td-chatText').text(this.message)
                break;
            case 'img':
                if (this.from) {
                    bHTML = $(tdBubble.bImgL).clone()
                } else {
                    bHTML = $(tdBubble.bImgR).clone()
                }

                $(bHTML).find('div.td-chatImg img').attr('src', this.message)
                break;
            case 'url':

                if (this.message.search('https://send.firefox.com/download') !== -1) {
                    if (this.from) {
                        bHTML = $(tdBubble.bFSendL).clone()
                    } else {
                        bHTML = $(tdBubble.bFSendR).clone()
                    }
                } else {
                    if (this.from) {
                        bHTML = $(tdBubble.bUrlL).clone()
                    } else {
                        bHTML = $(tdBubble.bUrlR).clone()
                    }
                }

                $(bHTML).find('div.td-chatText a').attr('href', this.message)
                $(bHTML).find('div.td-chatText a').text(this.message)

                break;
            case 'file':
                if (this.from) {
                    bHTML = $(tdBubble.bFileL).clone()
                } else {
                    bHTML = $(tdBubble.bFileR).clone()
                }

                $(bHTML).find('div.td-chatText > div > div > p').text("File Name: " + this.fileName)

                let sizeStr = tdBasic.size2Str(this.fileSize)

                $(bHTML).find('div.td-chatText > div > div > div > p').text("Size: " + sizeStr)
                $(bHTML).find('div.td-chatText button[download]').attr('href', this.message)

                // 查看 是否已经下载
                // console.log("download list", tdAPI.donwloadList.getList())
                for (let key in tdAPI.donwloadList.getList()) {
                    // console.log("key", key)
                    if (tdAPI.donwloadList.getValueByKey(key).isSame(cwebTag, cUser, this.msgID)) {

                        $(bHTML).addClass('td-downloaded')

                        $(bHTML).find('button[open]').attr('path', tdAPI.donwloadList.getValueByKey(key).savePath)

                        break
                    }
                }

                break;
            case 'unknown':
                if (this.from) {
                    bHTML = $(tdBubble.bUnknownL).clone()
                } else {
                    bHTML = $(tdBubble.bUnknownR).clone()
                }
                $(bHTML).find('div.td-chatText > p').text(this.message)
                break;
            default:
                if (this.from) {
                    bHTML = $(tdBubble.bUnknownL).clone()
                } else {
                    bHTML = $(tdBubble.bUnknownR).clone()
                }
                $(bHTML).find('div.td-chatText > p').text(this.message)
                break;
        }


        if (this.from) {
            let userID = $("#td-right div.td-chat-title").attr("data-user-i-d")
            let appName = $("#td-right div.td-chat-title").attr("data-app-name")
            let avatarUrl = this.avatar === undefined ?
                $("#td-left \
            div.td-convo[data-user-i-d='" + userID + "'][data-app-name='" + appName + "'] \
            div.td-avatar").css('background-image').slice(5, -2)
                : this.avatar

            $(bHTML).find("div.td-chatAvatar img").attr('src', avatarUrl)

            $(bHTML).find('> p.m-0').text(this.from)
            $(bHTML).find('div.td-them p.m-0').text(time)

        } else {
            $(bHTML).find('p.m-0').text(time)

            if (this.status == "done") {

            } else if (this.status == "sending") {
                $(bHTML).find('.td-bubbleStatus').removeClass('td-none')
            } else if (this.status == "failed") {
                $(bHTML).find('.td-bubbleStatus').removeClass('td-none')
                $(bHTML).find('.td-bubbleStatus').addClass('bubbleError')
            } else {
                $(bHTML).find('.td-bubbleStatus').removeClass('td-none')
                $(bHTML).find('.td-bubbleStatus').addClass('bubbleError')
            }
        }


        $(bHTML).attr('msgTime', this.time.getTime())
        $(bHTML).attr('msgid', this.msgID)

        // console.log("create bubble from : ", dialog)

        return $(bHTML)[0].outerHTML

    }
}

class tdExt {

    constructor(configPath = undefined) {
        this.configPath = configPath
    }

    static rootPathInStore = 'tdSettings.extList'

    static store = new Store();

    static fromJSON(json) {

        return Object.assign(new tdExt(), json);
    }

    loadWebview() {


        let webTag = this.webTag
        let url = this.webview.url
        let strUserAgent = this.getUserAgent()


        if ($(tdUI.webTag2Selector(webTag)).length > 0) {
            console.log("load")
            if (strUserAgent) {
                $(tdUI.webTag2Selector(webTag)).get(0).getWebContents().loadURL(url,
                    {
                        "userAgent":
                            "userAgent : " + strUserAgent,
                        "extraHeaders": "User-Agent:" + strUserAgent + "\n"
                    })
            } else {
                $(tdUI.webTag2Selector(webTag)).get(0).getWebContents().loadURL(url)
            }

            // 静音
            $(tdUI.webTag2Selector(webTag)).get(0).setAudioMuted(true)

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
                    config.configPath = this.configPath
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

    /**
     * 加载tool的webview
     */
    loadTool() {


        // 隐藏其他webview
        $(tdUI.toolboxSelector + " webview").each(function (index, element) {
            $(element).hide();
        });

        let webSelector = tdUI.webTag2Selector(this.webTag, this.type)


        // 已经加载过webview
        if ($(webSelector).length > 0 && $(webSelector).css("display") == "none") {
            console.log("loadTool : display tool")

            // console.log("loadtool : ", strUrl, $(webSelector).attr('src'))
            if ($(webSelector).attr('src') != this.webview.url) {
                $(webSelector).attr('src', this.webview.url)
            }

            $(webSelector).show()
        } else {

            if ($(webSelector).length == 0) {

                $(tdUI.toolboxSelector).append("<webview style='width:100%; height:100%' data-tool-name='" + this.webTag + "' src='' style='display:none;'></webview>")

            }

            $(webSelector).attr("data-tool-name", this.webTag)

            $(webSelector).attr('src', this.webview.url)

            if (this.webview.script !== undefined || this.webview.script !== '') {
                $(webSelector).attr('preload', this.webview.script)
            }

            $(webSelector).show()

        }

        return true
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

                $(tdUI.webTag2Selector(element.id.substring(6))).width("800px")
                $(tdUI.webTag2Selector(element.id.substring(6))).height("800px")


                this.loadWebview()

                // -o run action
                try {
                    if (!fs.existsSync(path.join(this.dir, this.action_script))) {
                        console.log(this.name, " warning : no action file", this)
                    } else {

                        require(path.join(this.dir, this.action_script)).action()

                    }

                } catch (err) {
                    console.error(this.name, " action error : ", err)

                }

                // -o add message listener
                console.log("add listener")

                tdMessage.WinReplyWeb(tdUI.webTag2Selector(this.webTag), (key, arg) => {
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

            this.status = true

            resolve("done")
        })
    }


    installExt() {

        return new Promise((resolve, reject) => {

            this.loadExtConfigure().then(() => {
                this.enableExtConfigure()
            }).then(() => {
                // save
                this.saveExtInStore()
            }).then(() => {
                tdAPI.extList.addListFromEle(this.webTag, this)

                resolve()
            }).catch(err => {
                reject(err)
            })

        })
    }

    removeExt() {

        return new Promise((resolve, reject) => {
            this.disableExtConfigure().then(() => {
                this.saveExtInStore()
            }).then(() => {
                tdAPI.extList.addListFromEle(this.webTag, this)
                resolve()
            }).catch(err => {
                reject(err)
            })

        })
    }


    disableExtConfigure() {

        return new Promise((resolve, reject) => {

            this.status = false
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

                    // remove convo
                    $('div.td-convo[data-app-name="' + this.webTag + '"]').remove()

                    // empty right
                    tdUI.rightBackToDefault()


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
        return JSON.parse(JSON.stringify(obj))
    }) {

        if (override) {

            tdExt.store.set(tdExt.rootPathInStore + '.' + this.webTag, funToJSON(this))
        } else {
            if (!tdExt.store.has(tdExt.rootPathInStore + '.' + this.webTag)) {
                tdExt.store.set(tdExt.rootPathInStore + '.' + this.webTag, funToJSON(this))
            }
        }
    }
    getUserAgent() {
        let strUserAgent = tdOS.strUserAgentWin
        if (this.webview.useragent == 'windows'
            || this.webview.useragent == ''
            || this.webview.useragent == undefined) {

        } else if (this.webview.useragent == 'linux') {
            strUserAgent = tdOS.strUserAgentLinux
        } else {
            strUserAgent = this.webview.useragent
        }
        return strUserAgent
    }
}

class tdDownloadItem {

    static rootPathInStore = 'donwloadList'

    constructor(msgID, webTag, userID, type = undefined, url = undefined, savePath = undefined) {
        this.url = url
        this.unicode = tdBasic.uniqueStr()
        this.webTag = webTag
        this.userID = userID
        this.msgID = msgID
        this.type = type
        this.savePath = savePath
    }

    static fromObj(obj) {
        let val = new tdDownloadItem(
            obj.msgID,
            obj.webTag,
            obj.userID,
            obj.type,
            obj.url,
            obj.savePath
        )
        if (obj.unicode !== undefined) {
            val.unicode = obj.unicode
        }
        return val
    }

    static fromJSON(json) {
        // console.log("obj from json ", json)
        return tdDownloadItem.fromObj(json)
    }

    toObj() {
        return {
            'url': this.url,
            'unicode': this.unicode,
            'webTag': this.webTag,
            'userID': this.userID,
            'msgID': this.msgID,
            'type': this.type,
            'savePath': this.savePath
        }
    }

    isSame(webTag, userID, msgID) {
        if (this.webTag == webTag &&
            this.userID == userID &&
            this.msgID == msgID
        ) {
            return true
        } else {
            return false
        }
    }
}

/**
 * 相应配套渲染UI的函数在这
 */
class tdUI {

    static toolboxSelector = "#td-right div.td-chatLog[winType='tool']"
    static chatLogSelector = "#td-right div.td-chatLog[winType='chatLog']"
    static inputboxSelector = ".td-inputbox"
    static goBackSelector = "#debug-goBackChat"
    static sendSelector = "#debug-send"
    static imgChooseSelector = "#debug-image"
    static imgSendSelector = '#debug-img-send'
    static imgCancelSelector = '#debug-img-cancel'

    static inputImgHeightLimit = 100
    static inputImgWeightLimit = 600

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



    /**
     * 
     * @param {String} webTag slype, wechat...
     * @param {String} type app/tool
     * @returns {String} webview的selector
     */
    static webTag2Selector(webTag, type = 'app') {

        return "webview[data-" + type + "-name='" + webTag + "']"
    }


    static setSwTray(value) {
        document.getElementById('swTray').checked = value == undefined ? false : value
    }

    static setPin() {
        let target = document.getElementById('td-pin')
        let x = target.getBoundingClientRect().x
        let y = target.getBoundingClientRect().bottom
        let pinCoord = [x, window.innerHeight - y]
        window.scrollTo(0, 0)
        document.getElementById('td-left').style.width = x + 'px'
        document.getElementById('td-input').style.height = window.innerHeight - y + 'px'
        // store.set('tdSettings.pinCoord', pinCoord)
        tdSettings.setSettings('pinCoord', pinCoord, true)
        // console.log('tdSettings.pinCoord changed to: ', pinCoord)
    }


    static getInputHTML() {
        return $(tdUI.inputboxSelector).html()
    }

    static resetInput(html = undefined) {
        $(tdUI.inputboxSelector).empty()
        if (html) {
            $(tdUI.inputboxSelector).append(html)
        }
    }
    static appendInputHTML(html) {
        $(tdUI.inputboxSelector).append(html)
    }

    /**
 * get  image height and width from dataUrl
 * @param {dataUrl} dataUrl 
 * @returns {Promise} { width: , height:  }
 */
    static getImageSizeFromDataurl(dataUrl) {
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
    static autoSizeImg(dataUrl, widthLimit, heightLimit) {
        return new Promise(function (resolved, rejected) {
            // 准备压缩图片
            // let nImg = nativeImage.createFromDataURL(dataUrl)
            // let size = nImg.getSize()
            let size = tdUI.getImageSizeFromDataurl(dataUrl).then((size) => {

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

    /**
     * 在光标处插入代码 
     * @param {String} html 
     * @param {String} selector JQselector 确保插入到正确的位置
     * @returns {boolean} 是否正确储存
     */
    static pasteHtmlAtCaret(html, selector = undefined) {
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


    static itemToHTML(item) {
        return new Promise((resolve, reject) => {

            if (typeof (item) == 'string') {
                // insert string
                tdUI.pasteHtmlAtCaret($($("<div> </div>").text(item)).html(), 'div.td-inputbox')

                resolve("")
            } else if(item.constructor.name == 'tdFileSend'){
                // insert file
                item.addFileID(tdBasic.uniqueStr())

                if(item.isImg()){
                    tdUI.autoSizeImg(item.dataUrl, tdUI.inputImgWeightLimit, tdUI.inputImgHeightLimit).then((newSize) => {

                        item.localSave().then(() => {
                            // console.log("debug : path : ", item.path, "-----------------------------------")
                            tdAPI.fileList.addListFromEle(item.fileID, item)
    
                            $("div.td-dropFile > img").addClass("td-none")
                            $('div.td-dropFile > div > img:nth-child(1)').attr('src', item.path)
                            $('div.td-dropFile > div > img:nth-child(1)').attr('data-file-ID', item.fileID)
                            $('div.td-dropFile > div').removeClass('td-none')
                            $('.td-dropFile').removeClass('hide')
    
    
                            resolve("")
                        }).catch((err) => {
                            console.log("error : itemToHTML : localSave ")
                            console.log(err)
                            reject(err)
                        })
    
                    }).catch((err) => {
                        reject("error : itemToHTML : autoSizeImg")
                    })
                }else{
                    item.localSave().then(() => {
                        // console.log("debug : path : ", item.path, "-----------------------------------")
                        tdAPI.fileList.addListFromEle(item.fileID, item)

                        $("div.td-dropFile > img").addClass("td-none")
                        $('div.td-dropFile > div > img:nth-child(1)').attr('src')
                        $('div.td-dropFile > div > img:nth-child(1)').attr('data-file-ID', item.fileID)
                        $('div.td-dropFile > div').removeClass('td-none')
                        $('.td-dropFile').removeClass('hide')


                        resolve("")
                    }).catch((err) => {
                        console.log("error : itemToHTML : localSave ")
                        console.log(err)
                        reject(err)
                    })
                }

            }
        })
    }


    /**
     * 将拖拽到网页或者粘贴到网页的DataTransfer转化成array
     * bug : 粘贴url时text和url不一致不能合并, 如papercomment.tech网址直接拖拽
     * @param {DataTransfer} data 
     * @returns {Promise} 
     *  arra[{'key':value},{}] 
     *  key : file text url
     */
    static filterDataTransfer(data) {

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
                                let imgSend = new tdFileSend(tdBasic.getFileNameFromUrl(pathFile), pathFile, '', undefined, img.toDataURL())
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
                                        let imgSend = new tdFileSend(tdBasic.getFileNameFromUrl(pathR), '', pathR, undefined, urldata)
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

                        } else if ((items[i].kind == 'file') ) {
                            // Drag data item is an image file
                            let file = items[i].getAsFile()
                            arrayItem.push(new Promise(
                                (resolve, reject) => {
                                    let fileSend = tdFileSend.fromFile(file)
                                    if(fileSend.isImg()){
                                        let reader = new FileReader();
                                        reader.onload = function (e) {
                                            fileSend.addDataUrl(reader.result)
                                            resolve(fileSend)
                                        }
                                        reader.readAsDataURL(file)
                                    }else{
                                        resolve(fileSend)
                                    }
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
                                let fileSend = tdFileSend.fromFile(file)
                                if(fileSend.isImg()){
                                    let reader = new FileReader();
                                    reader.onload = function (e) {
                                        fileSend.addDataUrl(reader.result)
                                        resolve(fileSend)
                                    }
                                    reader.readAsDataURL(file)
                                }else{
                                    resolve(fileSend)
                                }
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
     * 将data数据转化为Html附加到页面上
     * @param {dataTransfer} data 
     */
    static processDataTransfer(data) {

        return new Promise((resolve, reject) => {

            tdUI.filterDataTransfer(data).then((items) => {
                // console.log("start insert")
                items.forEach((item) => {

                    tdUI.itemToHTML(item).then((resolveItemToHTML) => {
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
     * 将input转化成array
     * @param {FileList} data 
     * @returns {Promise} 
     *  arra[{'key':value},{}] 
     *  key : file text url
     */
    static filterFiles(files) {

        return new Promise((resolve, reject) => {
            let arrayItem = new Array();

            console.log("---found files---")
            // Use DataTransfer interface to access the file(s)
            for (var i = 0; i < files.length; i++) {
                // console.log(data.files[i])
                let file = files[i]

                arrayItem.push(new Promise(
                    (resolve, reject) => {
                        let fileSend = tdFileSend.fromFile(file)
                        if(fileSend.isImg()){
                            let reader = new FileReader();
                            reader.onload = function (e) {
                                fileSend.addDataUrl(reader.result)
                                resolve(fileSend)
                            }
                            reader.readAsDataURL(file)
                        }else{
                            resolve(fileSend)
                        }
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
     * 将input传入的data数据转化为Html附加到页面上
     * @param {FileList} fileList 
     */
    static processFileList(fileList) {
        return new Promise((resolve, reject) => {

            tdUI.filterFiles(fileList).then((items) => {
                // console.log("start insert")
                items.forEach((item) => {
                    tdUI.itemToHTML(item).then((resolveItemToHTML) => {
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

}

class tdSettings {

    static rootPathInStore = 'tdSettings'
    static store = new Store()

    /**
     * 获取全部设置
     * @returns 返回全部设置的值
     */
    static getAllSettings() {

        return tdSettings.store.get(tdSettings.rootPathInStore, undefined)
    }

    /**
     * 获取指定项设置
     * @param {string} property 指定的设置项
     * @returns 返回指定设置的值
     */
    static getSettings(property) {

        return tdSettings.store.get(tdSettings.rootPathInStore + '.' + property, undefined)

    }

    /**
     * 重置设置
     * @param {*} value 值
     */
    static resetSettings(value = undefined) {
        tdSettings.store.set(tdSettings.rootPathInStore, value)
    }

    /**
     * 设置指定设置项
     * @param {string} property 指定的设置项
     * @param {*} value 值
     * @param {boolean} reset 如果存在是否覆盖, 默认不覆盖
     */
    static setSettings(property, value, reset = false) {

        let path = tdSettings.rootPathInStore + '.' + property
        if (!tdSettings.store.has(path) || reset) {
            tdSettings.store.set(path, value)
        }
    }


}


/**
 * input草稿
 * 以字典的形式储存字符串
 * ["webtag+ID":"content"]
 */
class tdInput {
    constructor(webTag = undefined, userID = undefined, draftHTML = undefined) {

        this.webTag = webTag
        this.userID = userID

        if (webTag && userID) {
            this.key = tdInput.genKey(webTag, userID)
        } else {
            this.key = undefined
        }
        this.draftHTML = draftHTML
    }
    static genKey(webTag, userID) {
        return webTag + '-' + userID
    }

    getKey() {
        return this.key
    }
    getDraftHTML() {
        return this.draftHTML
    }


    /**
     * 去掉input html中的tag
     * getInput函数调用该函数
     * @param {String} HTML 
     * @returns {Array} 数组只包含string和File, 并按照input中顺序排列
     */
    static simpleInput(HTML) {
        let arrayHTML = jQuery.parseHTML(HTML);

        let sendStr = new Array()

        $.each(arrayHTML, function (i, el) {
            // console.log(el)
            if ($(el)[0].nodeName == '#text') {
                sendStr.push($(el).text())
            } else if ($(el)[0].nodeName == 'IMG') {
                let fileID = $(el).attr('data-file-ID')
                // let dataUrl = $(el).attr('data-file-id')
                sendStr.push(tdAPI.fileID.getValueByKey(fileID))
                // sendStr.push(dataUrl)
            } else {
                sendStr = sendStr.concat(tdInput.simpleInput($(el).html()))
            }
        })

        return sendStr
    }

    /**
     * 从给定的html中直接拿到sending
     * @param {String} innerHTML 
     * @returns {Array} 以数组形式储存, 只含有string和File. 
     */
    static getInputFromHtml(innerHTML) {
        let arrayInput = tdInput.simpleInput(innerHTML)
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
    send(fromHtml = undefined) {
        console.log("start send", this)

        return new Promise((resolve, reject) => {
            console.log(this.userID, this.userID !== undefined
                , this.webTag, this.webTag !== undefined)
            if (this.userID !== undefined
                && this.webTag !== undefined) {

                let arraySend = undefined
                if (fromHtml == undefined) {
                    arraySend = tdInput.getInputFromHtml(this.getDraftHTML())
                } else {
                    arraySend = tdInput.getInputFromHtml(fromHtml)
                }

                // console.log('-----send-----')
                if (arraySend.length > 0) {

                    arraySend.unshift(this.userID)
                    // $(webTag2Selector(webTag)).focus()
                    tdMessage.HostSendToWeb(tdUI.webTag2Selector(this.webTag), { 'sendDialog': arraySend }, 500000).then(() => {
                        resolve("send success")
                    }).catch((err) => {
                        // console.log("send failed", err)
                        reject(err)
                    })
                } else {
                    resolve("no content")
                }
            } else {
                resolve("no user&webTag")
            }
        })
    }


}

module.exports = {
    tdAPI, tdExt, tdList, tdUI, tdSettings, tdInput, tdDownloadItem
}