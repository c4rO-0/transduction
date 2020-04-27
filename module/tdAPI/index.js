/**
 * index.js 后台处理的函数大概都在这
 */

const events = require('events')
const fs = require('fs')
const path = require('path')
const Store = require('electron-store');
const request = require('request')

const { tdMessage } = require('tdMessage')
const { tdBasic, tdBasicPage } = require('tdBasic')

const { tdOS } = require('tdSys')
const { tdSimulator } = require('tdSimulator')

const { tdList, tdConvo, tdBubble, 
    tdDownloadItem, tdFileSend, tdSettings, tdInput } = require('tdElement')

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
    // 新消息是否静音
    static mute

    // static fileSendList
    // static donwloadList
    // static convoList
    // static bubbleList
    static extList
    static donwloadList
    static inputList
    static fileList

    static FFSendExt

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
        this.event = new events.EventEmitter();

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
        // listener Main
        tdMessage.WinReply((key, arg) => {
            return tdAPI.respFuncWinReply(key, arg)
        })
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

        tdAPI.FFSendExt = new tdExt(path.resolve(tdOS.tdRootPath(), 'ext/firefoxsend/config.json'))
        tdAPI.FFSendExt.loadExtConfigure().then(() => {
            tdAPI.FFSendExt.installExt()
        })
        

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


        let convoNotification = new Notification('Tr| ' + (notTile == undefined? "": notTile), {
            body: notBody,
            silent: true
        })

        convoNotification.onclick = () => {
            notCallback()
        }
    }

    /**
     * 获取发送内容, 并发送
     * 如果给fromHtml, 那就从fromHtml中抓取消息发送
     * @param {tdInput} input
     * @param {String} fromHtml 
     */    
    static sendInput(input, fromHtml = undefined){
        console.log("start send", input)

        return new Promise((resolve, reject) => {
            console.log(input.userID, input.userID !== undefined
                , input.webTag, input.webTag !== undefined)
            if (input.userID !== undefined
                && input.webTag !== undefined) {

                let arraySend = undefined
                if (fromHtml == undefined) {
                    arraySend = tdInput.getInputFromHtml(tdAPI.fileList, input.getDraftHTML())
                } else {
                    arraySend = tdInput.getInputFromHtml(tdAPI.fileList, fromHtml)
                }

                // console.log('-----send-----')
                if (arraySend.length > 0) {

                    arraySend.unshift(input.userID)
                    // $(webTag2Selector(webTag)).focus()
                    tdMessage.HostSendToWeb(tdBasicPage.webTag2Selector(input.webTag), { 'sendDialog': arraySend }, 500000).then(() => {
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

            if ($(tdBasicPage.webTag2Selector(webTag)).length == 0) {
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


                let bubbleList = new tdList()

                Obj.forEach((value, index) => {
                    if(value.msgID != undefined){
                        let bubble = tdBubble.genFromDialog(value)
                        bubbleList.addListFromEle(bubble.msgID,bubble) 
                    }
                })

                tdAPI.event.emit('Dialog', webTag, userID, bubbleList)


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

                tdAPI.event.emit('Convo-new', webTag, Convo)


                resolve("copy that")
            } else if (key == 'focus') {
                console.log('focusing innnnnnnnnnnn')
                // let activeE = document.activeElement
                $(tdBasicPage.webTag2Selector(webTag)).focus()
                setTimeout(() => {
                    // $(activeE).focus()
                    $(".td-inputbox").focus()
                    console.log(document.activeElement)
                }, 3000);
                resolve("focus done")
            } else if (key == 'blur') {
                console.log('bluring outttttttttttttttttttt')
                $(tdBasicPage.webTag2Selector(webTag)).blur()
                console.log(document.activeElement)
                resolve("blur done")
            } else if (key == 'attachFile') {
                // 上传文件
                /* obj
                    "selector": str 
                    "file" : obj file
                */
                tdSimulator.attachInputFile(
                    tdBasicPage.webTag2Selector(webTag),
                    Obj.selector,
                    (tdAPI.fileList.getValueByKey(Obj.file.fileID)).path)

                resolve("attached")
            } else if (key == 'simulateKey') {
                // 按键模拟

                tdSimulator.keypressSimulator(tdBasicPage.webTag2Selector(webTag), Obj.type, Obj.charCode, Obj.shift, Obj.alt, Obj.ctrl, Obj.cmd)

                resolve("simulated")
            } else if (key == 'simulateMouse') {
                // 按键模拟
                console.log("simulateMouse", Obj)
                tdSimulator.mouseSimulator(tdBasicPage.webTag2Selector(webTag), Obj.type, Obj.x, Obj.y)

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
                            // tdUI.rightBackToDefault()
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
    static respFuncWinReply(key, Obj) {
        return Promise.race([new Promise((resolve, reject) => {
            console.log("debug : ", "----------------------")
            console.log("debug : ", "MSG from Win")
            console.log(Obj)

            if (key == 'mute') {
                tdAPI.mute = Obj.mute
                tdAPI.notifyLocal(false, !tdAPI.mute, '', 'set mute'+(Obj.mute))
                resolve('')
            }else if (key == 'downloadUpdated') {
                // console.log("progress update : ", Obj)
                let downItem = tdDownloadItem.fromObj(Obj)

                tdAPI.event.emit('downloadUpdated', downItem)
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


        if ($(tdBasicPage.webTag2Selector(webTag)).length > 0) {
            console.log("load")
            if (strUserAgent) {
                $(tdBasicPage.webTag2Selector(webTag)).get(0).getWebContents().loadURL(url,
                    {
                        "userAgent":
                            "userAgent : " + strUserAgent,
                        "extraHeaders": "User-Agent:" + strUserAgent + "\n"
                    })
            } else {
                $(tdBasicPage.webTag2Selector(webTag)).get(0).getWebContents().loadURL(url)
            }

            // 静音
            $(tdBasicPage.webTag2Selector(webTag)).get(0).setAudioMuted(true)

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
    loadTool(urlIn = undefined) {

        let url = urlIn == undefined? this.webview.url : urlIn
        // 隐藏其他webview
        $(tdBasicPage.toolboxSelector + " webview").each(function (index, element) {
            $(element).hide();
        });

        let webSelector = tdBasicPage.webTag2Selector(this.webTag, this.type)


        // 已经加载过webview
        if ($(webSelector).length > 0 && $(webSelector).css("display") == "none") {
            console.log("loadTool : display tool")

            // console.log("loadtool : ", strUrl, $(webSelector).attr('src'))
            if ($(webSelector).attr('src') != url) {
                $(webSelector).attr('src', url)
            }

            $(webSelector).show()
        } else {

            if ($(webSelector).length == 0) {

                $(tdBasicPage.toolboxSelector).append("<webview style='width:100%; height:100%' data-tool-name='" + this.webTag + "' src='' style='display:none;'></webview>")

            }

            $(webSelector).attr("data-tool-name", this.webTag)

            $(webSelector).attr('src', url)

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

                $(tdBasicPage.webTag2Selector(element.id.substring(6))).width("800px")
                $(tdBasicPage.webTag2Selector(element.id.substring(6))).height("800px")


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

                tdMessage.WinReplyWeb(tdBasicPage.webTag2Selector(this.webTag), (key, arg) => {
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
                    // tdUI.rightBackToDefault()


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


module.exports = {
    tdAPI, tdExt
}