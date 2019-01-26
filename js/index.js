// =========================全局函数和变量===========================
/**
 * 开关webview
 */
function toggleWebview() {
    // document.querySelectorAll('webview').forEach((e) => {
    //     if (e.style.display === 'none') {
    //         e.style.display = ''
    //     } else {
    //         e.style.display = 'none'
    //     }
    // })
    if (document.body.style.overflow === 'hidden') {
        document.body.style.overflow = ''
    } else {
        window.scrollTo(0, 0)
        document.body.style.overflow = 'hidden'
    }
}
/**
 * 打开webview Devtool
 * @param {string} appName
 */
function openDevtool(appName) {
    let web = $("webview[data-app-name='" + appName + "']")[0];
    web.openDevTools();
}

function listWebview() {
    $("webview").toArray().forEach((e, i) => {
        console.log($(e).attr('data-app-name'))
    })
}



$(document).ready(function () {

    const core = require("../js/core.js")
    const { nativeImage } = require('electron').remote
    // const _ = require('../toolkit/lodash-4.17.11.js');
    console.log(process.versions.electron)

    let fileList = {}; //临时储存file object


    let status = "webviewSkype"
    let debug_app_link_str = "#debug-app-link"
    let debug_firefox_send_str = "#debug-firefox-send"
    let debug_image_str = "#debug-image"
    let debug_send_str = "#debug-send"
    let debug_latex_str = "#debug-latex2png"
    let debug_goBackChat_str = "#debug-goBackChat"


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
    /**
     * 
     * @param {String} webTag slype, wechat...
     * @returns {String} webview的selector
     */
    function webTag2Selector(webTag) {
        return "webview[data-app-name='" + webTag + "']"
    }

    function AddConvoHtml(appName, convo) {
        let displayCounter = "display: none;"
        if (convo.counter) {
            displayCounter = ""
        }

        return '\
        <div class="td-convo theme-transduction td-font" data-user-i-d='+ convo.userID + ' data-app-name=' + appName + '>\
            <div class="col-appLogo">\
                <img src="../res/pic/'+ appName + '.png">\
            </div>\
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
        let objConvo = $('#td-left [data-app-name=' + appName + '][data-user-i-d="' + convo.userID + '"]').clone()
        if (objConvo.length) { // 检测存在
            $('#td-left [data-app-name=' + appName + '][data-user-i-d="' + convo.userID + '"]').remove()
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


        return Promise.race([new Promise((resolve, reject) => {

            if ($(webTag2Selector(webTag)).length == 0) {
                reject("respFuncWinReplyWeb : no " + webTag + "exist")
                return
            }

            console.log("debug : ", "----------------------")
            console.log("debug : ", "Convo from ", webTag)
            // console.log(MSG)

            if (key == 'Dialog') {
                // 收到某个用户聊天记录
                console.log("debug : ", "==========Dialog============")
                console.log(Obj)

                console.log('focusing innnnnnnnnnnn')
                $(webTag2Selector(webTag)).focus()
                console.log(document.activeElement)
                // document.querySelector('webview').focus()

                // setTimeout(() => {
                console.log('bluring outttttttttttttttttttt')
                $(webTag2Selector(webTag)).blur()
                console.log(document.activeElement)
                // document.querySelector('webview').blur()
                // }, 2000)


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
                    $('#td-left [data-app-name=' + webTag + '][data-user-i-d="' + Convo.userID + '"]').remove()
                    $('#td-left').prepend(AddConvoHtml(webTag, Convo))
                } else if (Convo.action === 'c') {
                    console.log('going to change html snippet')
                    ChangeConvoHtml(webTag, Convo)
                }

                resolve("copy that")
            } else if (key == 'focus') {
                console.log('focusing innnnnnnnnnnn')
                $(webTag2Selector(webTag)).focus()
                console.log(document.activeElement)
                resolve("focus done")
            } else if (key == 'blur') {
                console.log('bluring outttttttttttttttttttt')
                $(webTag2Selector(webTag)).blur()
                console.log(document.activeElement)
                resolve("blur done")
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
            $(sectionSelector).append("<webview data-extension-name='" + extensionName + "' src='' preload='' style='display:none;'></webview>")

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
                $(webSelector).show()
            } else {
                // 隐藏所有webview
                $(sectionSelector + " webview").each(function (index) {
                    $(this).hide();
                });
                console.log("loadExtension : reload extension")

                $(webSelector).attr("data-extension-name", extensionName)

                $(webSelector).attr('src', strUrl)

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

    function processDataTransfer(data) {

        return new Promise((resolve, reject) => {

            filterDataTransfer(data).then((items) => {
                // console.log("start insert")
                items.forEach((item) => {
                    // console.log(item)
                    if (typeof (item) == 'string') {
                        // insert string
                        pasteHtmlAtCaret("<div>" + item + "</div>", 'div.td-inputbox')
                    } else {
                        // insert file
                        item.addFileID(core.UniqueStr())
                        //插入html
                        // pasteHtmlAtCaret("&nbsp;<a data-file-ID='" + fileID + "' contenteditable=false>" + item.name + "</a>&nbsp;", 'div.td-inputbox')
                        if (pasteHtmlAtCaret("<a data-file-ID='" + item.fileID + "' contenteditable=false> " + item.name + " </a>", 'div.td-inputbox')) {
                            fileList[item.fileID] = item
                        }
                    }
                })

                resolve("")

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
            } else if ($(el)[0].nodeName == 'A') {
                let fileID = $(el).attr('data-file-ID')
                sendStr.push(fileList[fileID])
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

    // =============================程序主体=============================


    // ===========================接收消息===========================

    // wechat
    core.WinReplyWeb(webTag2Selector("wechat"), (key, arg) => {
        return respFuncWinReplyWeb("wechat", key, arg)
    })

    // skype
    core.WinReplyWeb(webTag2Selector("skype"), (key, arg) => {
        return respFuncWinReplyWeb("skype", key, arg)
    })

    // ===========================发送消息===========================

    // 点击convo
    $('#td-left').on('click', 'div.td-convo', function () {
        // 识别webtag
        let webTag = $(this).attr("data-app-name")
        let userID = $(this).attr("data-user-i-d")
        $('#td-left div.td-convo').removeClass('theme-transduction-active')
        $(this).addClass('theme-transduction-active')

        if (webTag == undefined || userID == undefined) {
            console.log("error : click obj error.")
            console.log("obj : ", this)
            console.log("userID : ", userID)
        } else {


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
    });

    console.log("toggle")
    toggleWebview()
    // openDevtool('skype')
    window.onresize = () => {
        console.log("===window resize====")
    }


    // =================extension click==================
    // extension click
    $(debug_firefox_send_str).on('click', () => {
        let extensionName = "firefox-send"
        $("#td-right div.td-chatLog[winType='chatLog']").hide()
        $("#td-right div.td-chatLog[winType='extension']").show()
        loadExtension("#td-right div.td-chatLog[winType='extension']", extensionName, "https://send.firefox.com/", '')
    })

    $(debug_latex_str).on('click', () => {
        let extensionName = "latex2png"
        $("#td-right div.td-chatLog[winType='chatLog']").hide()
        $("#td-right div.td-chatLog[winType='extension']").show()
        loadExtension("#td-right div.td-chatLog[winType='extension']", extensionName, "http://latex2png.com/", '')
    })

    // 隐藏extension
    $(debug_goBackChat_str).on('click', () => {
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
    $("#td-right").on("dragenter", (event) => {
        if ($("#td-right div.td-chatLog[winType='chatLog']").css("display") == "none") {

        } else {
            $("#td-right").hide()
            $("div[winType='dropFile']").show()
        }
    })
    $("div.td-inputbox").on("dragenter", (event) => {
        if ($("#td-right div.td-chatLog[winType='chatLog']").css("display") == "none") {
            $("#td-right").hide()
            $("div[winType='dropFile']").show()
        } else {

        }
    })

    // 拖出右侧还原
    $("div[winType='dropFile']").on("dragleave", (event) => {
        $("div[winType='dropFile']").hide()
        $("#td-right").show()
    })

    //识别到放下东西
    $("div[winType='dropFile']").on("drop", (event) => {
        console.log("drop")
        $("div[winType='dropFile']").hide()
        $("#td-right").show()
        // Prevent default behavior (Prevent file from being opened)
        event.preventDefault();


        processDataTransfer(event.originalEvent.dataTransfer).then(
            console.log("insert input done")
        )


    })

    // ===========paste================
    $("div.td-inputbox").on("paste", function (event) {
        event.preventDefault();
        event.stopPropagation();

        processDataTransfer(event.originalEvent.clipboardData).then(
            console.log("insert input done")
        )
    });


    // ==========send===============
    $(debug_send_str).on('click', event => {


        let arraySend = getInput('div.td-inputbox')
        console.log('-----send-----')


        // let arraySend = new Array()
        // arraySend.push(nativeImage.createFromPath('/home/bsplu/workspace/transduction/res/pic/ffsend.png'))
        console.log(arraySend)

        core.HostSendToWeb(webTag2Selector('skype'), { 'sendDialog': arraySend })


    })


})
