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


class tdBubbleUI {

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


    static iniTemplate() {

        tdBubbleUI.bTextL = $('div[msgid="bTextL"]').clone()
        tdBubbleUI.bTextR = $('div[msgid="bTextR"]').clone()

        tdBubbleUI.bUrlL = $('div[msgid="bUrlL"]').clone()
        tdBubbleUI.bUrlR = $('div[msgid="bUrlR"]').clone()

        tdBubbleUI.bUnknownL = $('div[msgid="bUnknownL"]').clone()
        tdBubbleUI.bUnknownR = $('div[msgid="bUnknownR"]').clone()

        tdBubbleUI.bFSendL = $('div[msgid="bFSendL"]').clone()
        tdBubbleUI.bFSendR = $('div[msgid="bFSendR"]').clone()

        tdBubbleUI.bFileL = $('div[msgid="bFileL"]').clone()
        tdBubbleUI.bFileR = $('div[msgid="bFileR"]').clone()

        tdBubbleUI.bImgL = $('div[msgid="bImgL"]').clone()
        tdBubbleUI.bImgR = $('div[msgid="bImgR"]').clone()
    }


    static toHTML(bubble) {

        let cUser = $('div.td-chat-title').attr('data-user-i-d')
        let cwebTag = $('div.td-chat-title').attr('data-app-name')

        let time = tdBasic.timeObj2Str(bubble.time)

        let bHTML

        switch (bubble.type) {
            case 'text':
                if (bubble.from) {
                    bHTML = $(tdBubbleUI.bTextL).clone()
                } else {
                    bHTML = $(tdBubbleUI.bTextR).clone()
                }

                $(bHTML).find('div.td-chatText').text(bubble.message)
                break;
            case 'img':
                if (bubble.from) {
                    bHTML = $(tdBubbleUI.bImgL).clone()
                } else {
                    bHTML = $(tdBubbleUI.bImgR).clone()
                }

                $(bHTML).find('div.td-chatImg img').attr('src', bubble.message)
                break;
            case 'url':

                if (bubble.message.search('https://send.firefox.com/download') !== -1) {
                    if (bubble.from) {
                        bHTML = $(tdBubbleUI.bFSendL).clone()
                    } else {
                        bHTML = $(tdBubbleUI.bFSendR).clone()
                    }

                } else {
                    if (bubble.from) {
                        bHTML = $(tdBubbleUI.bUrlL).clone()
                    } else {
                        bHTML = $(tdBubbleUI.bUrlR).clone()
                    }
                }

                $(bHTML).find('div.td-chatText a').attr('href', bubble.message)
                $(bHTML).find('div.td-chatText a').text(bubble.message)

                break;
            case 'file':
                if (bubble.from) {
                    bHTML = $(tdBubbleUI.bFileL).clone()
                } else {
                    bHTML = $(tdBubbleUI.bFileR).clone()
                }

                $(bHTML).find('div.td-chatText > div > div > p').text("File Name: " + bubble.fileName)

                let sizeStr = tdBasic.size2Str(bubble.fileSize)

                $(bHTML).find('div.td-chatText > div > div > div > p').text("Size: " + sizeStr)
                $(bHTML).find('div.td-chatText button[download]').attr('href', bubble.message)

                // 查看 是否已经下载
                // console.log("download list", tdAPI.donwloadList.getList())
                for (let key in tdAPI.donwloadList.getList()) {
                    // console.log("key", key)
                    if (tdAPI.donwloadList.getValueByKey(key).isSame(cwebTag, cUser, bubble.msgID)) {

                        $(bHTML).addClass('td-downloaded')

                        $(bHTML).find('button[open]').attr('path', tdAPI.donwloadList.getValueByKey(key).savePath)

                        break
                    }
                }

                break;
            case 'unknown':
                if (bubble.from) {
                    bHTML = $(tdBubbleUI.bUnknownL).clone()
                } else {
                    bHTML = $(tdBubbleUI.bUnknownR).clone()
                }
                $(bHTML).find('div.td-chatText > p').text(bubble.message)
                break;
            default:
                if (bubble.from) {
                    bHTML = $(tdBubbleUI.bUnknownL).clone()
                } else {
                    bHTML = $(tdBubbleUI.bUnknownR).clone()
                }
                $(bHTML).find('div.td-chatText > p').text(bubble.message)
                break;
        }


        if (bubble.from) {
            let userID = $("#td-right div.td-chat-title").attr("data-user-i-d")
            let appName = $("#td-right div.td-chat-title").attr("data-app-name")
            let avatarUrl = bubble.avatar === undefined ?
                $("#td-left \
            div.td-convo[data-user-i-d='" + userID + "'][data-app-name='" + appName + "'] \
            div.td-avatar").css('background-image').slice(5, -2)
                : bubble.avatar

            $(bHTML).find("div.td-chatAvatar img").attr('src', avatarUrl)

            $(bHTML).find('> p.m-0').text(bubble.from)
            $(bHTML).find('div.td-them p.m-0').text(time)

        } else {
            $(bHTML).find('p.m-0').text(time)

            if (bubble.status == "done") {

            } else if (bubble.status == "sending") {
                $(bHTML).find('.td-bubbleStatus').removeClass('td-none')
            } else if (bubble.status == "failed") {
                $(bHTML).find('.td-bubbleStatus').removeClass('td-none')
                $(bHTML).find('.td-bubbleStatus').addClass('bubbleError')
            } else {
                $(bHTML).find('.td-bubbleStatus').removeClass('td-none')
                $(bHTML).find('.td-bubbleStatus').addClass('bubbleError')
            }
        }


        $(bHTML).attr('msgTime', bubble.time.getTime())
        $(bHTML).attr('msgid', bubble.msgID)

        // console.log("create bubble from : ", bubble, $(bHTML))

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


/**
 * 相应配套渲染UI的函数在这
 */
class tdUI {


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
     * @returns {String} webTag 对应的按钮
     */
    static webTag2ButtonSelector(webTag, type = 'app') {

        return "#" + type + "-" + webTag
    }


    static setSwTray(value) {
        document.getElementById('swTray').checked = value == undefined ? false : value
    }

    static getPinCoordFromPage(){
        let target = document.getElementById('td-pin')
        let x = target.getBoundingClientRect().x
        let y = target.getBoundingClientRect().bottom

        return [x, window.innerHeight - y]
    }

    static setPin(pinCoord=undefined){
        if(pinCoord == undefined){
            return 
        }
        document.getElementById('td-pin').style.left = pinCoord[0] +'px'
        document.getElementById('td-pin').style.bottom = pinCoord[1] +'px'

    }

    static followPin() {

        let pinCoord = tdUI.getPinCoordFromPage()

        window.scrollTo(0, 0)
        document.getElementById('td-left').style.width = pinCoord[0] + 'px'
        document.getElementById('td-input').style.height = pinCoord[1] + 'px'
        tdSettings.setSettings('pinCoord', pinCoord, true)
        // store.set('tdSettings.pinCoord', pinCoord)
        
        // console.log('tdSettings.pinCoord changed to: ', pinCoord)
    }


    static getInputHTML() {
        return $(tdBasicPage.inputboxSelector).html()
    }

    static resetInput(html = undefined) {
        $(tdBasicPage.inputboxSelector).empty()
        if (html) {
            $(tdBasicPage.inputboxSelector).append(html)
        }
    }
    static appendInputHTML(html) {
        $(tdBasicPage.inputboxSelector).append(html)
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
                            // console.log("debug : path : ", newItem.path, "-----------------------------------")
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

            // console.log("filterDataTransfer : data : ", data)

            let objHTML = data.getData('text/html') // 拖拽的是一个含有链接的东西, html, 在线img, 文件
            let strURL = data.getData('URL')
            // console.log('--------objHTML-----------')
            // console.log(objHTML)
            // console.log('--------strURL-----------')
            // console.log(strURL)
            if (objHTML && $(objHTML).get(0) && $(objHTML).get(0).nodeName == 'IMG' && $(objHTML).attr('src')) {
                // console.log("发现图片")
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

                                let imgSend = new tdFileSend(tdBasic.getFileNameFromUrl(pathFile), pathFile, '',                                
                                undefined,  //id
                                'image/', // type
                                undefined, // size 
                                img.toDataURL())

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
                                        let imgSend = new tdFileSend(tdBasic.getFileNameFromUrl(pathR), '', pathR, 
                                        undefined,  //id
                                        'image/', // type
                                        undefined, // size
                                        urldata)
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
                // console.log("发现网址")
                arrayItem.push(Promise.resolve(strURL))
            } else {
                if (data.items) {
                    let items = data.items

                    // console.log("---found items---", items.length)
                    // Use DataTransferItemList interface to access the file(s)
                    for (var i = 0; i < items.length; i++) {
                        // console.log(i, "item", items[i].kind, items[i].type, items[i])
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
                    // console.log("---found files---")
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

                console.log('------\ndrag list : \n', uniqueItem,'\n-----\n')

                resolve(uniqueItem)

            }).catch(error => {
                reject({ 'string': error })
            })

        })
    }


    /**
     * 将drag/paste data数据转化为Html附加到页面上
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
     * 将html <input>转化成array
     * @param {FileList} data 
     * @returns {Promise} 
     *  arra[{'key':value},{}] 
     *  key : file text url
     */
    static filterFiles(files) {

        return new Promise((resolve, reject) => {
            let arrayItem = new Array();

            // console.log("---found files---")
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
     * 将html <input>传入的data数据转化为Html附加到页面上
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



module.exports = {
    tdUI, tdInput, tdBubbleUI, tdConvoUI
}