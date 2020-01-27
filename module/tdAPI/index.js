/**
 * index.js 后台处理的函数大概都在这
 */

const events = require('events')
const fs = require('fs')
const path = require('path')
const Store = require('electron-store');
const store = new Store();

const { tdMessage } = require('tdMessage')

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

        // - initial extension list
        this.extList = new tdList(tdExt.rootPathInStore)
        if (this.extList.hasListInStore()) {
            this.extList.getListInSore(td.tdExt.fromJSON)
            // this.extList.print('----extension list-----')

            $.each(this.extList.getList(), (webTag, ext) => {
                console.log(webTag, ext)
                if (ext.status) {
                    ext.loadExtConfigure().then(() => {
                        // -o load
                        ext.print('---ext---')
                        // ext.enableExtConfigure()
                    }).then(() => {
                        // save
                        // ext.saveExtInStore()
                    })

                }
            })
        }

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

    static loadWebview(webTag, url, strUserAgent = undefined) {
        // console.log(strUserAgent)
        if ($(tdPage.webTag2Selector(webTag)).length > 0) {
            console.log("load")

            // $(tdPage.webTag2Selector(webTag)).attr('partition',webTag)

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

                // -o load webview url
                let strUserAgent = tdOS.strUserAgentWin
                if (this.webview.useragent == 'windows'
                    || this.webview.useragent == ''
                    || this.webview.useragent == undefined) {

                } else if (this.webview.useragent == 'linux') {
                    strUserAgent = tdOS.strUserAgentLinux
                }

                this.loadWebview(this.webTag, this.webview.url, strUserAgent)

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
                    return respFuncWinReplyWeb(this.webTag, key, arg)
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
                    rightBackToDefault()

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
}

/**
 * 相应配套渲染UI的函数在这
 */
class tdUI {


}

module.exports = { tdAPI, tdExt, tdList }