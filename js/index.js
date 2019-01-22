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
    console.log(process.versions.electron)
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

        let data = event.originalEvent.dataTransfer

        // console.log(data)

        if (data.items) {
            let items = data.items
            console.log("---found items---", items.length)
            // Use DataTransferItemList interface to access the file(s)

            for (var i = 0; i < items.length; i++) {
                console.log(i, "item", items[i].kind)
                // If dropped items aren't files, reject them
                if ((items[i].kind == 'string') &&
                    (items[i].type.match('^text/plain'))) {
                    // This item is the target node
                    items[i].getAsString(function (s) {
                        console.log("... Drop: text", s)
                        // ev.target.appendChild(document.getElementById(s));
                    });
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
                    items[i].getAsString(function (s) {
                        console.log("... Drop: URI", s)
                        // ev.target.appendChild(document.getElementById(s));
                    });
                } else if ((items[i].kind == 'file') &&
                    (items[i].type.match('^image/'))) {
                    // Drag data item is an image file
                    var file = items[i].getAsFile();
                    console.log('... file[' + i + '].name = ' + file.name);
                }
            }
        } else {
            console.log("---found files---")
            // Use DataTransfer interface to access the file(s)
            for (var i = 0; i < data.files.length; i++) {
                console.log('... file[' + i + '].name = ' + data.files[i].name);
            }
        }
    })


})
