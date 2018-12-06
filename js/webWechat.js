window.onload = function () {

    const core = require("../js/core.js")
    const watchJS = require("../toolkit/watch-1.4.2.js")
    // const http = require('http')
    const fs = require('fs')
    const { net } = require('electron').remote


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
        let toUserName = MSG["ToUserName"]
        let time = MSG["MMDigestTime"]
        let remarkName = ''
        let nickName = ''
        if (contacts[fromUserName] != undefined) {
            remarkName = (contacts[fromUserName])["RemarkName"]
            nickName = (contacts[fromUserName])["NickName"]
        }
        // 获取有几条未读消息
        let strUnread = $("div.ng-scope div [data-username='" + fromUserName + "'] i").text()
        let unread = strUnread == '' ? 0 : parseInt(strUnread)
        let type = MSG["MsgType"]
        let content = MSG["MMDigest"]
        let MSGID = MSG["MsgId"]

        return {
            "fromUserName": fromUserName,
            "toUserName": toUserName,
            "MSGID": MSGID,
            "time": time,
            "remarkName": remarkName,
            "nickName": nickName,
            "unread": unread,
            "type": type,
            "content": content
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


        let timeStr = $(obj).find("div.ext p.attr.ng-binding").text()
        let time = new Date() // Now
        if (timeStr != "") {

            time = new Date(
                time.getFullYear(),
                time.getMonth(),
                time.getDate(),
                parseInt(timeStr.substr(0, timeStr.indexOf(':'))),
                parseInt(timeStr.substr(timeStr.indexOf(':') + 1)))

        }

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
            // let action = 'c'
            let action = 'a' //简单粗暴, 全部变成a
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
                        action = 'a'
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
                    action = 'a'
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


        core.WebReply((key, arg) => {
            return new Promise((resolve, reject) => {
                if (key == 'get') {

                    console.log("debug : ", "---获取用户聊天记录----")
                    // 下面开始模拟点击
                    let ID = arg

                    if ($("div.ng-scope div [data-username='" + ID + "']").length == 0) reject("user not existed")

                    $("div.ng-scope div [data-username='" + ID + "']").click();

                    resolve("request received. MSG will send.")

                    setTimeout(() => {
                        // 获取内容
                        let objSlide = chatContent[ID]
                        for (let indexMSG in objSlide) {
                            console.log("debug : ", indexMSG, "---->")
                            // console.log(objSlide[indexMSG])
                            let MSG = grepMSG(contacts, objSlide[indexMSG])

                            if (MSG.type == wechatMSGType.MSGTYPE_TEXT) {
                                // 正常输出

                                // console.log("ID :", MSG.fromUserName, "->", MSG.toUserName)
                                // console.log("type :", MSG.type)
                                // console.log("Name :", MSG.nickName, MSG.remarkName)
                                // console.log("type :", MSG.type)
                                // console.log("content :", MSG.content)
                                // console.log("time :", MSG.time)
                                // console.log("unread :", MSG.unread)


                            } else if (MSG.type == wechatMSGType.MSGTYPE_IMAGE) {
                                // 缓存图片
                                // console.log($("div [data-cm*='" + MSG.MSGID + "'] img.msg-img"))
                                let imgUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + $("div [data-cm*='" + MSG.MSGID + "'] img.msg-img").attr("src")
                                // 置换内容
                                MSG.content = imgUrl
                            } else {

                            }


                            core.WebToHost({ "MSG-Log": MSG }).then((res) => {
                                console.log(res)
                            }).catch((error) => {
                                throw error
                            });
                        }
                    }, 100);
                } else {
                    reject('unknown key')
                }

            })

        })


    })

}
