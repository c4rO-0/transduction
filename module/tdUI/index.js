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


class tdConvoUI {

    static toHTML(valTdConvo) {
        let displayCounter = "display: none;"
        let visibility = "td-invisible"
        if (valTdConvo.counter) {
            displayCounter = ""
        }
        if (valTdConvo.muted) {
            visibility = ""
        }

        let avatar = valTdConvo.avatar == undefined ? '../res/pic/weird.png' : valTdConvo.avatar
        // console.log(appName , extList )
        let ext = tdAPI.extList.getValueByKey(valTdConvo.webTag)

        return '\
            <div class="td-convo theme-transduction td-font" data-user-i-d='+ valTdConvo.userID + ' data-app-name=' + valTdConvo.webTag + ' muted=' + valTdConvo.muted + '>\
                <div class="col-appLogo">\
                    <img src="'+ path.join(ext.dir, ext.icon.any) + '">\
                </div>\
                <div class="col-hint">\
                    <div class="row-hint" style="background-color:'+ ext.icon.color + ';"></div>\
                </div>\
                <div class="col-avatar d-flex justify-content-center">\
                    <div class="td-avatar align-self-center" style="background-image: url('+ avatar + ')"></div>\
                    <div class="td-counter" style="'+ displayCounter + '">\
                        <div style="align-self:center;">'+ valTdConvo.counter + '</div>\
                    </div>\
                </div >\
            <div class="col col-text flex-column justify-content-center">\
                    <div class="m-0 td-nickname">'+ valTdConvo.nickName + '</div>\
                    <div class="m-0 td-text">'+ tdPage.htmlEntities(valTdConvo.message) + '</div>\
                </div>\
                <div class="col-auto pl-0 col-timestamp justify-content-around">\
                    '+ valTdConvo.time + '\
                    <img class="' + visibility + ' align-self-center" src="../res/pic/mute.svg" height="18px">\
                </div>\
            </div > '
    }


    static addToPage(valTdConvo, isPretend = false) {
        let objConvo = $('#td-convo-container [data-app-name=' + valTdConvo.webTag + '][data-user-i-d="' + valTdConvo.userID + '"]')
        if (objConvo.length == 0 && isPretend) {
            $('#td-convo-container').prepend(tdConvoUI.toHTML(valTdConvo))
        } else { // 检测存在
            for (let key in valTdConvo) {
                if (valTdConvo[key] != undefined) {
                    switch (key) {
                        case "avatar":
                            $(objConvo).find("div.td-avatar").attr("style", 'background-image: url(' + valTdConvo.avatar + ')')
                            break;
                        case "counter":
                            $(objConvo).find("div.td-counter div").text(valTdConvo.counter)
                            if (valTdConvo.counter) {
                                $(objConvo).find("div.td-counter").css("display", "")
                            } else {
                                $(objConvo).find("div.td-counter").css("display", "none")
                            }
                            break;
                        case "nickName":
                            $(objConvo).find("div.td-nickname").text(valTdConvo.nickName)
                            break;
                        case "message":
                            $(objConvo).find("div.td-text").text(valTdConvo.message)
                            break;
                        case "time":
                            $(objConvo).find("div.col-timestamp").contents().filter(function () { return valTdConvo.nodeType == 3; }).first().replaceWith(valTdConvo.time);
                            break;
                        case "muted":
                            $(objConvo).attr('muted', valTdConvo.muted)
                            if (valTdConvo.muted) {
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


/**
 * 相应配套渲染UI的函数在这
 */
class tdUI {


    static inputImgHeightLimit = 100
    static inputImgWeightLimit = 600

    static initialize(){
        //=================================
        // - settings
        tdSettings.setSettings('swTray', true, false)
        tdUI.setSwTray(tdSettings.getSettings('swTray'))

    
        tdUI.setPin(tdSettings.getSettings('pinCoord'))
        tdUI.followPin()


        //=================================
        // initialize bubble valuable
        tdBubbleUI.iniTemplate()
    }

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

    static getPinCoordFromPage() {
        let target = document.getElementById('td-pin')
        let x = target.getBoundingClientRect().x
        let y = target.getBoundingClientRect().bottom

        return [x, window.innerHeight - y]
    }

    static setPin(pinCoord = undefined) {
        if (pinCoord == undefined) {
            return
        }
        document.getElementById('td-pin').style.left = pinCoord[0] + 'px'
        document.getElementById('td-pin').style.bottom = pinCoord[1] + 'px'

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
            } else if (item.constructor.name == 'tdFileSend') {
                // insert file
                item.addFileID(tdBasic.uniqueStr())

                if (item.isImg()) {
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
                } else {
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

                        } else if ((items[i].kind == 'file')) {
                            // Drag data item is an image file
                            let file = items[i].getAsFile()
                            arrayItem.push(new Promise(
                                (resolve, reject) => {
                                    let fileSend = tdFileSend.fromFile(file)
                                    if (fileSend.isImg()) {
                                        let reader = new FileReader();
                                        reader.onload = function (e) {
                                            fileSend.addDataUrl(reader.result)
                                            resolve(fileSend)
                                        }
                                        reader.readAsDataURL(file)
                                    } else {
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
                                if (fileSend.isImg()) {
                                    let reader = new FileReader();
                                    reader.onload = function (e) {
                                        fileSend.addDataUrl(reader.result)
                                        resolve(fileSend)
                                    }
                                    reader.readAsDataURL(file)
                                } else {
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

                console.log('------\ndrag list : \n', uniqueItem, '\n-----\n')

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
                        if (fileSend.isImg()) {
                            let reader = new FileReader();
                            reader.onload = function (e) {
                                fileSend.addDataUrl(reader.result)
                                resolve(fileSend)
                            }
                            reader.readAsDataURL(file)
                        } else {
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
    tdUI, tdBubbleUI, tdConvoUI
}