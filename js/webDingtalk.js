window.onload = function () {

    const core = require("../js/core.js")
    const watchJS = require("../toolkit/watch-1.4.2.js")
    // const http = require('http')
    const fs = require('fs')
    const { net } = require('electron').remote

    let logStatus = { "status": "offline" }


    /**
      * 通过左侧边栏读取消息
      * @param {Object} obj 左侧边栏.chat_item.slide-left.ng-scope 元素
      * @returns {Object} 返回"新消息"类型
      * 
      */
    function grepNewMSG(obj) {

        // console.log("--------------MSG-----------")
        // console.log($(obj).html())

        let userID = $(obj).attr('con-id')
        let time = $(obj).find('span.time').text()
        let nickName = $(obj).find('span.name-title').text()
        let avatarStyle = $(obj).find('div.user-avatar').attr('style')
        let avatar = undefined
        if (avatarStyle && avatarStyle.includes('https')) {
            avatar = avatarStyle.slice(("background-image: url(\"").length, -3)
        }

        let message = $(obj).find('.latest-msg-info span[ng-bind-html="convItem.conv.lastMessageContent|emoj"]').text()

        let muted = false

        if ($(obj).find('.latest-msg-info i.icon-conv-mute').is(":visible")) {
            muted = true
        } else {
            muted = false
        }

        let counter = 0
        let counterObj = $(obj).find('.latest-msg-info em[ng-show="!convItem.conv.notificationOff"]')
        if (counterObj.length == 0 || $(counterObj).text().trim() == '') {
            counter = 0
        } else {
            counter = parseInt($(counterObj).text().trim())
        }

        let index = 0
        if ($('.conv-lists:eq(0)').has(obj).length > 0) {
            // console.log('has obj')
            index = $(obj).index()
        } else {
            // console.log('no obj')
            index = $(obj).index() + $('.conv-lists:eq(0)').children().length
        }

        let action = "a"
        if ($("div.conv-lists-box").find('[con-id="' + userID + '"]').length == 0) {
            action = 'r'
        } else {
            if (counter > 0 || $('.conv-lists:eq(0)').has(obj).length > 0 || $(obj).find('div.list-item.active').length > 0) {
                action = "a"
            } else {
                action = 'c'
            }
        }

        return {
            "userID": userID,
            "time": time,
            "message": message,
            "nickName": nickName,
            "avatar": avatar,
            "counter": counter,
            "action": action,
            "muted": muted,
            "index": index
        }
    }

    function addConvoObjToArray(arrayConvoObj, convoObj) {
        if ($(convoObj).length > 0) {
            let existed = false
            arrayConvoObj.forEach((currentValue, index) => {

                if (!existed && $(currentValue).is(convoObj)) {
                    existed = true
                }

            })
            if (!existed) {
                arrayConvoObj.push(convoObj)
            }
        } else {
            console.log('convoObj.length ==0')
        }
    }

    /**
      * 
      * @param {Object} objBubble 单条消息
      * @returns {Object} 拿到我们关系的内容
      * @param {Integer} indexBubble MSG位置
      */
    function grepBubble(objBubble, indexBubble) {


        let fromUserName = undefined
        if ($(objBubble).find('> div.me').length > 0) {
            fromUserName = undefined
        } else if ($(objBubble).find('user-ding-title-list').length > 0) {
            fromUserName = $('div.conv-title div.title').text()

        } else if ($(objBubble).find('user-name').length > 0) {
            fromUserName = $(objBubble).find('user-name span').attr('title')
        }

        let timeStr = $(objBubble).find('span.chat-time').text()

        // bug : 如果时间是一年前, 没办法分辨
        let time = new Date()
        if (timeStr.includes('-')) {
            time = new Date(
                (new Date()).getFullYear()
                + " " + $(objBubble).find('span.chat-time').text()
                + ':' + (indexBubble % 1000))
        } else {
            time = new Date(
                time.getFullYear()
                + " " + (time.getMonth() + 1)
                + "-" + time.getDate()
                + " " + $(objBubble).find('span.chat-time').text()
                + ':' + (indexBubble % 1000))
        }


        let MSGID = undefined
        if (indexBubble > 0) {
            MSGID = $(objBubble).find('div.chat-item').attr('msg-id')
        }


        let avatarStyle = $(objBubble).find('div.avatar > div.normal').attr('style')
        let avatar = undefined
        if (avatarStyle && avatarStyle.includes('https')) {
            avatar = avatarStyle.slice(("background-image: url(\"").length, -3)
        }

        let type = 'unknown'
        let objContent = $(objBubble).find('div.msg-bubble-area > div')
        let typeStr = $(objContent).find('> [ng-switch-when]').attr('ng-switch-when')

        let content = ''

        let fileName = undefined
        let fileSize = undefined


        if (typeStr == 'msg-text') {
            // 文字内容
            type = 'text'
            if ($(objContent).find('div.msg-bubble > pre').length > 0) {

                contentObj = $(objContent).find('div.msg-bubble > pre')

                content = ""
                $(contentObj).contents().toArray().forEach((c, i) => {
                    // 将内容进行切割, 判断是否为img
    
                    // console.log(c, $(c).prop('nodeName'))
                    let nodeName = $(c).prop('nodeName')
                    if (nodeName == "IMG") {
                        // 筛选字符表情
                        content = content + $(c).attr('title')
                    }
                    // 链接文字
                    content = content + $(c).text()
                    
                })

            } else if ($(objContent).find('div.msg-bubble > code-snippet-container').length > 0) {
                // console.log("found code -----")
                // console.log($(objContent).html())
                content = ''
                $(objContent).find('span[role="presentation"]').each((index, element) => {
                    content = content + $(element).text() + '\n\r'
                })

            }

        } else if (typeStr == 'msg-img') {
            // 图片内容
            type = 'img'
            let fullImgUrl = $(objContent).find('img.chat-img').attr('src')
            // 
            content = fullImgUrl.slice(0, fullImgUrl.indexOf('?'))
            content = content.slice(0, content.lastIndexOf('_'))
        } else if (typeStr == 'msg-img-text') {
            // 图文内容
        } else if (typeStr == 'msg-file') {
            // 普通文件内容(旧数据)
        } else if (typeStr == 'msg-space-file') {
            //  云盘内容

            type = 'file'
            content = $(objContent).find('a.download-file-btn:not(ng-hide)').attr('href')

            fileName = $(objContent).find('p.file-name').text()
            fileSizeStr = $(objContent).find('p.file-size').text()
            if (fileSizeStr.includes(' B')) {
                fileSize = parseFloat(fileSizeStr.slice(0,-2))
            } else if (fileSizeStr.includes(' KB')) {
                fileSize = parseFloat(fileSizeStr.slice(0,-3))*1000.
            } else if (fileSizeStr.includes(' MB')) {
                fileSize = parseFloat(fileSizeStr.slice(0,-3))*1000.*1000.
            } else if (fileSizeStr.includes(' GB')) {
                fileSize = parseFloat(fileSizeStr.slice(0,-3))*1000.*1000.*1000.
            }else{

            }


        } else if (typeStr == 'ding-text') {
            // ding文字   
        } else if (typeStr == 'msg-encrypt-img') {
            // 加密文件
        } else if (type == 'msg-encrypt-img') {
            // 加密图片
        } else {

        }

        return {
            "from": fromUserName,
            "msgID": MSGID,
            "time": time.getTime(),
            "type": type,
            "message": content,
            "avatar": avatar,
            "fileName": fileName,
            "fileSize": fileSize
        }


    }


    function grepAndSendRight() {

        let objActiveUser = $('div.list-item.conv-item.context-menu.active')
        if (objActiveUser.length > 0) {
            let ID = objActiveUser.attr('menu-data')

            let bubbleList = new Array()

            $("div.msg-items > div").each((index, element) => {
                let objSending = $(element).find('div[progress-bar]')
                if (($(objSending).length == 0 ||
                    $(objSending).is(':hidden'))
                    && index > 0) {
                    //  sending 排除
                    //  第一个bubble去掉, 里面没有内容

                    let bubble = grepBubble(element, index)
                    bubbleList.push(bubble)
                }
            })

            if (bubbleList.length > 0) {
                console.log("debug : dialog-----------");
                (bubbleList[0])["userID"] = ID;
                // console.log(bubbleList[0])
                // console.log(ID)
                // console.log(typeof(ID))
                core.WebToHost({ "Dialog": bubbleList }).then((res) => {
                    console.log(res)
                }).catch((error) => {
                    throw error
                });
            }
        }

    }

    function callbackChatRight(mutationList, observer) {

        let arrayConvoObj = new Array();
        let arrayContent = new Array();

        // console.log('dingtalk left : ', mutationList)

        mutationList.forEach((mutation, index) => {
            if (mutation.type == "childList") {
                if ($(mutation.target).is('span.ng-binding:not(.ng-hide), div.noti')) {
                    // 未读消息数增加
                    // console.log('dingtalk convo changed : ', mutation, $(mutation.target).closest('conv-item'))
                    addConvoObjToArray(arrayConvoObj, $(mutation.target).closest('conv-item'))
                }

            }
            if (mutation.type == "characterData") {
                if ($(mutation.target).parent('span.time').length > 0
                    && mutation.oldValue != ''
                    && mutation.oldValue != '{{convItem.conv.updateTime|dateTime}}') {
                    // 时间戳发生变化
                    // console.log('dingtalk convo text changed : ', mutation)
                    addConvoObjToArray(arrayConvoObj, $(mutation.target).closest('conv-item'))
                }
            }
            if (mutation.type == "attributes") {
                if ($(mutation.target).is('div.list-item.active')) {
                    addConvoObjToArray(arrayConvoObj, $(mutation.target).closest('conv-item'))
                }
            }

            // mutation.addedNodes.forEach( (node,index) =>{
            //     if($(node).is('conv-item')){
            //         // 添加convo || 从以读到未读 
            //         console.log('dingtalk convo changed : ', $(node))
            //     }
            // })
            mutation.removedNodes.forEach((node, index) => {
                if ($(node).is('conv-item')) {
                    console.log('remove convo')
                    addConvoObjToArray(arrayConvoObj, node)
                }
            })

        })
        arrayConvoObj.forEach((convoObj, index) => {
            // console.log("debug : ", index)
            // if($('.conv-lists:eq(0)').has(convoObj).length > 0){
            arrayContent.push(grepNewMSG(convoObj))
            // }

        })

        arrayContent.forEach((currentValue, index) => {
            // 向index发出新消息提醒
            core.WebToHost({ "Convo-new": currentValue }).then((res) => {
                console.log(res)
            }).catch((error) => {
                throw error
            });
        })
    }

    var callbackRight = function (mutationList) {

        console.log("debug : ===========Right changed============")
        // console.log(mutationList)
        // grepAndSendRight()
        let addedNewBubble = false
        mutationList.forEach((mutation, index) => {

            mutation.addedNodes.forEach((node, index) => {
                if ($(node).is('div.msg-box, div.msg-menu-box')) {
                    // console.log($(node))
                    addedNewBubble = addedNewBubble || true

                    // return
                }
            })
        })

        if (addedNewBubble) {
            setTimeout(() => {
                // 获取内容
                grepAndSendRight()
            }, 500);
        }
    }

    $(document).ready(function () {


        // 观察左侧消息变动
        let obsChatRight = new MutationObserver(callbackChatRight);

        if ($('#menu-pannel').length == 0) {
            console.log("********************offline***************************************")
            logStatus.status = "offline"
            core.WebToHost({ "logStatus": logStatus })
            core.WebToHost({ "show": {} })

            let callbackobsLogin = function (mutationList, observer) {
                // console.log("log status changed : ", mutationList)
                if ($('#menu-pannel').length > 0) {
                    logStatus.status = "online"
                    console.log("=======================online=====================================")
                    // console.log($("div.login"))
                    core.WebToHost({ "logStatus": logStatus })
                    core.WebToHost({ "hide": {} })
                    observer.disconnect()

                    obsChatRight.observe(document.getElementById('sub-menu-pannel'), {
                        childList: true,
                        subtree: true,
                        characterData: true,
                        characterDataOldValue: true,
                        // attributeFilter: ["data-username"],
                        attributes: true,
                        attributeOldValue: false
                    });
                }
            }
            let obsLogin = new MutationObserver(callbackobsLogin);
            obsLogin.observe($('body')[0], {
                childList: true,
                subtree: false,
                characterData: false,
                // attributeFilter: ["style"],
                attributes: false, attributeOldValue: false
            });
        } else {
            logStatus.status = "online"
            console.log("=======================online=====================================")
            // console.log($("div.login"))
            core.WebToHost({ "logStatus": logStatus })
            core.WebToHost({ "hide": {} })

            obsChatRight.observe(document.getElementById('sub-menu-pannel'), {
                childList: true,
                subtree: true,
                characterData: true,
                characterDataOldValue: true,
                // attributeFilter: ["data-username"],
                attributes: true,
                attributeOldValue: false
            });

        }

        let obsRight = new MutationObserver(callbackRight);

        core.WebReply((key, arg) => {
            return new Promise((resolve, reject) => {
                if (key == 'queryDialog') {
                    // 索取右侧
                    console.log("debug : ", "---获取用户聊天记录----")
                    // 下面开始模拟点击
                    let userID = arg.userID

                    if ($('[con-id="' + userID + '"]').length == 0) reject("user not existed")

                    $('[con-id="' + userID + '"]').click();

                    // =========未完 : 右侧============


                    setTimeout(() => {
                        // 获取内容
                        grepAndSendRight()

                        obsRight.disconnect()
                        obsRight.observe($("div.msg-items")[0], {
                            subtree: true, childList: true, characterData: false, attributes: false,
                            attributeOldValue: false, characterDataOldValue: false
                        })
                    }, 500);
                } else if (key == 'sendDialog') {
                    // 键入消息
                    console.log("--------sendDialog---")
                    // 检查
                    if (!$("div.list-item.conv-item.context-menu[menu-data='" + arg[0] + "']").hasClass("active")) {

                        reject("user not active")
                        return
                    }


                    function send(arrayValue, index = 0) {

                        console.log("index : ", index)
                        if (index == arrayValue.length) {
                            console.log("sendDialog finished")
                            resolve("Dialog send")
                            return
                        }

                        value = arrayValue[index]
                        if (typeof (value) == 'string') {
                            // console.log(value)
                            console.log("---send : text---")
                            $('div.msg-box > textarea').val(value)

                            $('div.action-area > a').get(0).click()

                            waitSend(arrayValue, index)

                            // observer.disconnect()
                            // });
                            // obsSend.observe($('div.send-button-holder button')[0], {
                            //     subtree: false, childList: false, characterData: false, attributes: true,
                            //     attributeOldValue: false, characterDataOldValue: false
                            // });

                        } else {
                            // $("div.webuploader-pick").attr('class','webuploader-pick webuploader-pick-hover')
                            $('input.normal-file').get(0).click()

                            core.WebToHost({ "attachFile": { "selector": "input.normal-file", "file": value } }).then((resHost) => {
                                console.log("---file---")
                                setTimeout(() => {
                                    let objSendButton = $('div.file-area-box').closest('div.modal-content').find('div.foot button')
                                    if($(objSendButton).length ==0){
                                        reject("no send button")
                                        return
                                    }else{
                                        $(objSendButton).get(0).click()
                                    }
                                
                                waitSend(arrayValue, index)
                                }, 200);

                            })
                        }

                    }

                    function waitSend(arrayValue, index) {
                        // 等待发送完成
                        let objSending = $('div[progress-bar]')
                        if (($(objSending).length == 0 ||
                            $(objSending).is(':hidden'))) {
                            // 没有找到sending
                            console.log("---next msg---")
                            send(arrayValue, index + 1)
                            return
                        }

                        let obsSwxUpdated = new MutationObserver((mutationList, observer) => {


                            let objSending = $('div[progress-bar]')
                            if (($(objSending).length == 0 ||
                                $(objSending).is(':hidden'))) {
                                // 没有找到sending
                                console.log("---next msg---")
                                send(arrayValue, index + 1)
                                observer.disconnect()
                                return
                            }

                        })
                        obsSwxUpdated.observe(document.getElementById('sub-menu-pannel'), {
                            childList: true,
                            subtree: true,
                            characterData: true,
                            characterDataOldValue: true,
                            // attributeFilter: ["data-username"],
                            attributes: true,
                            attributeOldValue: false
                        });

                    }

                    // 开始发送消息
                    send(arg, 1)                    
                } else if (key == 'queryLogStatus') {
                    console.log("resolve back")
                    resolve(logStatus)
                } else if (key == 'logoff') {
                    // 登出
                } else {
                    reject('unknown key')
                }

            })

        })

    })

}