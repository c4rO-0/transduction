// *********************************************
// navigator setting
// ---------------------------------------------
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


window.onload = function () {

    const core = require("../js/core.js")
    const watchJS = require("../toolkit/watch-1.4.2.js")
    // const http = require('http')
    const fs = require('fs')
    const { net } = require('electron').remote

    let logStatus = { "status": "offline" }

    // const request = require('request')
    // const setimmediate = require('setimmediate')


    let wechatMSGType = {
        MSGTYPE_TEXT: 1,
        MSGTYPE_IMAGE: 3,
        MSGTYPE_VOICE: 34,
        MSGTYPE_VIDEO: 43,
        MSGTYPE_MICROVIDEO: 62,
        MSGTYPE_EMOTICON: 47,
        MSGTYPE_APP: 49,
        MSGTYPE_VOIPMSG: 50,
        MSGTYPE_VOIPNOTIFY: 52,
        MSGTYPE_VOIPINVITE: 53,
        MSGTYPE_LOCATION: 48,
        MSGTYPE_STATUSNOTIFY: 51,
        MSGTYPE_SYSNOTICE: 9999,
        MSGTYPE_POSSIBLEFRIEND_MSG: 40,
        MSGTYPE_VERIFYMSG: 37,
        MSGTYPE_SHARECARD: 42,
        MSGTYPE_SYS: 1e4
    }


    // 微信UserName是ID, RemarkName是给别人取得昵称 NickName是本人的微信名

    // 通过RemarkName查找用户ID
    function getUsernameByRemarkName(remarkName) {
        let contact = window._contacts
        for (let username in contact) {
            // console.log(contact[username])
            // console.log((contact[username]))
            if ((contact[username])["RemarkName"] == remarkName) {
                return username
            }

        }

        return undefined
    }

    /**
     * 根据微信储存的变量_chatcontent读取消息
     * @param {Object} MSG 微信单条消息
     * @returns {Object} 拿到我们关系的内容
     */
    function grepMSG(contacts, MSG) {

        let fromUserName = MSG["FromUserName"]
        // let toUserName = MSG["ToUserName"]
        let time = new Date(MSG["CreateTime"] * 1000)



        let remarkName = ''
        if (contacts[fromUserName] != undefined) {
            remarkName = (contacts[fromUserName])["RemarkName"]
            nickName = (contacts[fromUserName])["NickName"]
        }
        // 获取有几条未读消息
        // let strUnread = $("div.ng-scope div [data-username='" + fromUserName + "'] i").text()
        // let unread = strUnread == '' ? 0 : parseInt(strUnread)
        let type = ""

        let contentObj = jQuery.parseHTML(MSG["MMDigest"])
        let content = ""
        // 对content进行处理, 目前只发现emoji在里面
        contentObj.forEach((c, i) => {
            // 将内容进行切割, 判断是否为img emoji进行处理

            let nodeName = $(c).prop('nodeName')
            if (nodeName == "IMG") {
                // 对左侧栏筛选字符表情
                if ($(c).hasClass("qqemoji")) {
                    // <img class="qqemoji qqemoji68" text="[蛋糕]_web" src="/zh_CN/htmledition/v2/images/spacer.gif"></img>
                    let strEmoji = $(c).attr("text")
                    console.log(strEmoji, strEmoji.substr(0, strEmoji.length - 4))
                    strEmoji = strEmoji.substr(0, strEmoji.length - 4)
                    content = content + strEmoji
                } else if ($(c).hasClass("emoji")) {
                    // <img class="emoji emoji1f63c" text="_web" src="/zh_CN/htmledition/v2/images/spacer.gif"></img>
                    content = content + "[emoji]"
                } else {
                    content = content + "[image]"
                }
            }

            // 链接文字
            content = content + $(c).text()


        })

        let MSGID = MSG["MsgId"]

        let MSGObj = $("div[data-cm*='" + MSGID + "']")
        if (MSG["MsgType"] == wechatMSGType.MSGTYPE_TEXT) {
            // 正常输出
            type = 'text'

            // 判断是否为url
            if ($(MSGObj).find("div.plain pre a").length > 0 && $(MSGObj).find("div.plain pre").contents().toArray().length == 1) {
                type = "url"
            }

        } else if (MSG["MsgType"] == wechatMSGType.MSGTYPE_IMAGE) {
            // 缓存图片
            // console.log($("div [data-cm*='" + MSG.MSGID + "'] img.msg-img"))
            type = 'img'
            let imgUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + $(MSGObj).find("img.msg-img").attr("src")
            // 置换内容
            content = imgUrl
        } else if (MSG["MsgType"] == wechatMSGType.MSGTYPE_MICROVIDEO) {
            type = 'img'
            // 小视频
            let imgUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + $(MSGObj).find("img.msg-img").attr("src")
            // 置换内容
            content = imgUrl
        } else if (MSG["MsgType"] == wechatMSGType.MSGTYPE_APP) {
            // 文件
            type = 'text'
            let fileName = $(MSGObj).find("div.attach p[ng-bind*='message.FileName']").text()
            let fileSize = $(MSGObj).find("div.attach span[ng-bind*='message.MMAppMsgFileSize']").text()
            content = fileName
        }
        else {

        }

        // console.log(remarkName, MSGID, type, content, time)
        return {
            "from": MSGObj.hasClass("right") ? undefined : (remarkName == '' ? nickName : remarkName),
            "msgID": MSGID,
            "time": time.getTime(),
            "type": type,
            "message": content
        }


    }

    // 
    /**
     * 通过左侧边栏读取消息
     * @param {Object} obj 左侧边栏.chat_item.slide-left.ng-scope 元素
     * @returns {Object} 返回"新消息"类型
     * 
     */
    function grepNewMSG(obj) {




        // 筛选消息内容
        let contentObj = $(obj).find("div.info p.msg span.ng-binding[ng-bind-html='chatContact.MMDigest']")
        // console.log(contentObj)
        if ($(contentObj).length == 0) {
            content = ''
        } else {
            content = ""
            $(contentObj).contents().toArray().forEach((c, i) => {
                // 将内容进行切割, 判断是否为img

                // console.log(c, $(c).prop('nodeName'))
                let nodeName = $(c).prop('nodeName')
                if (nodeName == "IMG") {
                    // 对左侧栏筛选字符表情
                    if ($(c).hasClass("qqemoji")) {
                        // <img class="qqemoji qqemoji68" text="[蛋糕]_web" src="/zh_CN/htmledition/v2/images/spacer.gif"></img>
                        let strEmoji = $(c).attr("text")
                        console.log(strEmoji, strEmoji.substr(0, strEmoji.length - 4))
                        strEmoji = strEmoji.substr(0, strEmoji.length - 4)
                        content = content + strEmoji
                    } else if ($(c).hasClass("emoji")) {
                        // <img class="emoji emoji1f63c" text="_web" src="/zh_CN/htmledition/v2/images/spacer.gif"></img>
                        content = content + "[emoji]"
                    } else {
                        content = content + "[image]"
                    }
                }

                // 链接文字
                content = content + $(c).text()


            })

        }

        let nickName = $(obj).find("div.info h3.nickname span").text()
        let userID = $(obj).attr("data-username")


        let time = new Date() // Now
        let chatObj = _chatContent[userID]
        if (chatObj.length > 0) { // last MSG
            time = new Date((chatObj[chatObj.length - 1])["MMDisplayTime"] * 1000)
        }

        let host =
            window.location.href.lastIndexOf('/') == window.location.href.length - 1 ?
                window.location.href.substring(0, window.location.href.lastIndexOf('/')) :
                window.location.href


        let avatar = host + $(obj).find("div.avatar img").attr("src")



        if ($("div[data-username='" + userID + "']").length == 0) {
            // 元素被删除了
            return {
                "userID": userID,
                "time": time.getTime(),
                "message": "",
                "nickName": nickName,
                "avatar": avatar,
                "counter": 0,
                "action": "r",
                "muted": true,
                "index": 0
            }
        } else {
            let counter = 0
            let muted = false
            // 简单粗暴, 默认为add
            // 微信初始会弹出最近联系人, 需要滤掉该部分convo, 将action设为c
            // action为c: 使得没有消息的联系人不会在transduction上创建
            // 特殊 : filehelper以及被置顶的联系人依然会被添加
            let action = 'a'
            if ($(obj).find("div.ext p.attr.ng-scope[ng-if='chatContact.isMuted()']").length > 0) {
                // 被静音了
                muted = true
                if ($(obj).find("div.info p.msg span.ng-binding.ng-scope").length > 0) {
                    // 多条未读
                    let str_counter = $(obj).find("div.info p.msg span.ng-binding.ng-scope").text()
                    str_counter = str_counter.substr(1, str_counter.length - 3)
                    counter = parseInt(str_counter)
                } else {
                    if (content == '') {
                        // 初始化
                        counter = 0
                        if (userID == "filehelper" || $(obj).hasClass("top")) {
                            action = 'a'
                        } else {
                            action = 'c'
                        }


                    } else {
                        // 一条未读
                        counter = 1
                    }

                }
            } else {
                // 正常
                if ($(obj).find("div.avatar i.web_wechat_reddot_middle").length > 0) {
                    counter = $(obj).find("div.avatar i.web_wechat_reddot_middle").text()
                } else {
                    counter = 0
                }
                if (content == '') {
                    // 初始化
                    counter = 0
                    if (userID == "filehelper" || $(obj).hasClass("top")) {
                        action = 'a'
                    } else {
                        action = 'c'
                    }
                }

            }

            let index = $(".chat_item.slide-left.ng-scope").index(obj)

            // icon web_wechat_reddot ng-scope 一个小点

            return {
                "userID": userID,
                "time": time.getTime(),
                "message": content,
                "nickName": nickName,
                "avatar": avatar,
                "counter": counter,
                "action": action,
                "muted": muted,
                "index": index
            }
        }

    }

    // 联系人发生变更
    var callbackContact = function (records) {

        if ($("#navContact").scrollTop() + $("#navContact")[0].clientHeight != $("#navContact")[0].scrollHeight) {
            console.log("debug : ", "----------contact change----------")
            $("#navContact").scrollTop(0)
            $("#navContact").scrollTop($("#navContact")[0].scrollHeight)

            // 更新联系人
            contacts = window._contacts
            // 更新对话
            chatContent = window._chatContent

            // 临时放在这
            // let username = getUsernameByRemarkName(remarkName)

        }
    };

    // 消息发生变更
    var callbackChat = function (records) {
        console.log("debug : ===========chat changed============")
        let arrayObjUser = new Array();
        let arrayContent = new Array();
        records.map(function (record) {
            console.log("debug : ===========chat slide============")
            console.log("debug : ", "obs type : ", record.type)
            console.log("debug : ", "obs target : ")
            console.log($(record.target))
            console.log("debug : ", "remove : ", $(record.removedNodes).length)
            console.log($(record.removedNodes))


            let obj = $(record.target).closest(".chat_item.slide-left.ng-scope")
            // console.log( obj  )    
            if (obj.length > 0) {
                let existed = false
                arrayObjUser.forEach((currentValue, index) => {

                    if (!existed && $(currentValue).is(obj)) {
                        existed = true
                    }

                })
                if (!existed) {
                    arrayObjUser.push(obj)
                }
            }


            if ($(record.removedNodes).length != 0) {
                $(record.removedNodes).toArray().forEach((currentValue, index) => {
                    $(currentValue).children(".chat_item.slide-left.ng-scope").toArray().forEach((obj, idx) => {
                        let existed = false
                        arrayObjUser.forEach((objIn) => {

                            if (!existed && $(objIn).is(obj)) {
                                existed = true
                            }

                        })
                        if (!existed) {
                            arrayObjUser.push(obj)
                        }
                    })
                })
            }

        })

        console.log("debug : ", "------array:user-----")
        console.log(arrayObjUser)

        // console.log("debug : ", "------array:MSG-----")
        arrayObjUser.forEach((currentValue, index) => {
            // console.log("debug : ", index)
            arrayContent.push(grepNewMSG(currentValue))
        })

        // console.log("debug : ", "------array:MSG-----")
        // console.log(arrayContent)
        arrayContent.forEach((currentValue, index) => {
            // 向index发出新消息提醒
            core.WebToHost({ "Convo-new": currentValue }).then((res) => {
                console.log(res)
            }).catch((error) => {
                throw error
            });
        })

    };

    $(document).ready(function () {

        // 观察到微信登录或者注销登录页面会刷新
        if ($("div.login").length > 0) {
            console.log("********************offline***************************************")
            logStatus.status = "offline"
            core.WebToHost({ "logStatus": logStatus })
            core.WebToHost({ "show": {} })
        } else {
            logStatus.status = "online"
            console.log("=======================online=====================================")
            // console.log($("div.login"))
            core.WebToHost({ "logStatus": logStatus })
            core.WebToHost({ "hide": {} })
        }


        let contacts = window._contacts
        let chatContent = window._chatContent

        // let remarkName = "乐宏昊"

        // 等待拉取联系人
        let obsContact = new MutationObserver(callbackContact);

        obsContact.observe($("#navContact")[0], { childList: true, subtree: true });



        // 截取新消息
        // 观察左侧消息变动
        let obsChat = new MutationObserver(callbackChat);

        obsChat.observe($("#J_NavChatScrollBody")[0], {
            childList: true,
            subtree: true,
            characterData: true
        });

        // 接收上层消息
        core.WebReply((key, arg) => {
            return new Promise((resolve, reject) => {
                if (key == 'queryDialog') {

                    console.log("debug : ", "---获取用户聊天记录----")
                    // 下面开始模拟点击
                    let ID = arg.userID

                    if ($("div.ng-scope div [data-username='" + ID + "']").length == 0) reject("user not existed")

                    $("div.ng-scope div [data-username='" + ID + "']").click();

                    resolve("request received. MSG will send.")

                    setTimeout(() => {
                        // 获取内容
                        let objSlide = chatContent[ID]
                        let MSGList = new Array()
                        for (let indexMSG in objSlide) {
                            // console.log("debug : ", indexMSG, "---->")
                            // console.log(objSlide[indexMSG])
                            let MSG = grepMSG(contacts, objSlide[indexMSG])

                            MSGList.push(MSG)
                        }
                        if (MSGList.length > 0) {
                            console.log("debug : dialog-----------");
                            (MSGList[0])["userID"] = ID;
                            // console.log(MSGList[0])
                            // console.log(ID)
                            // console.log(typeof(ID))
                            core.WebToHost({ "Dialog": MSGList }).then((res) => {
                                console.log(res)
                            }).catch((error) => {
                                throw error
                            });
                        }

                    }, 100);

                } else if (key == 'sendDialog') {
                    console.log("--------sendDialog---")
                    // 检查
                    if (!$("div.chat_item[data-username='" + arg[0] + "']").hasClass("active")) {

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

                            // $('#editArea').text(value)
                            angular.element('pre:last').scope().editAreaCtn = value

                            // let e = $.Event("keydown", { keyCode: 64 }); //64没有对应按键
                            // $("#chatInputAreaWithQuotes").trigger(e);

                            // let obsSend = new MutationObserver((mutationList, observer) => {
                            // $('a[ng-click="sendTextMessage()"]').click()
                            angular.element('pre:last').scope().sendTextMessage();

                            console.log("---text---")
                            waitSend(arrayValue, index)

                            // observer.disconnect()
                            // });
                            // obsSend.observe($('div.send-button-holder button')[0], {
                            //     subtree: false, childList: false, characterData: false, attributes: true,
                            //     attributeOldValue: false, characterDataOldValue: false
                            // });

                        } else {
                            core.WebToHost({ "attachFile": { "selector": "input.webuploader-element-invisible", "file": value } }).then((resHost) => {
                                console.log("---file---")
                                waitSend(arrayValue, index)
                            })
                        }

                    }

                    function waitSend(arrayValue, index) {
                        // 等待发送完成
                        let obsSwxUpdated = new MutationObserver((mutationList, observer) => {

                            mutationList.forEach((mutation, nodeIndex) => {
                                let addedNodes = mutation.addedNodes
                                console.log(addedNodes)
                                if (addedNodes && $(addedNodes[0]).attr("ng-repeat") && $(addedNodes[0]).attr("ng-repeat") == "message in chatContent") {
                                    console.log('---addedNodes----')
                                    observer.disconnect()

                                    let obsFinished = new MutationObserver((mList, obs) => {
                                        console.log('-------obs update--------')
                                        console.log(mList)
                                        if ($("div[ng-switch-default].me")
                                            .last()
                                            .find("[src='//res.wx.qq.com/a/wx_fed/webwx/res/static/img/xasUyAI.gif']")
                                            .is(':hidden')) {
                                            obs.disconnect()
                                            send(arrayValue, index + 1)
                                        }
                                    })

                                    obsFinished.observe($("div[ng-switch-default].me")
                                        .last().find("div.bubble_cont.ng-scope")[0], {
                                            // obsFinished.observe($('swx-message.me div.DeliveryStatus:not(.hide)').last()[0], {
                                            subtree: true, childList: true, characterData: true, attributes: true,
                                            attributeOldValue: false, characterDataOldValue: false
                                        });

                                }
                            })

                        })
                        obsSwxUpdated.observe($("div[mm-repeat='message in chatContent']")[0], {
                            subtree: false, childList: true, characterData: false, attributes: false,
                            attributeOldValue: false, characterDataOldValue: false
                        })

                    }

                    // 开始发送消息
                    send(arg, 1)
                } else if (key == 'queryLogStatus') {
                    console.log("resolve back")
                    resolve(logStatus)
                } else if (key == 'logoff') {
                    if (logStatus.status == 'online') {
                        if ($("i.menuicon_quit").length == 0) {
                            $("i.web_wechat_add").click()
                        }

                        $("i.menuicon_quit").click()

                        resolve("wechat log off")
                    } else {
                        resolve('wechat already logoff')
                    }
                } else {
                    reject('unknown key')
                }

            })

        })


    })

}
