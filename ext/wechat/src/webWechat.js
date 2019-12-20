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

let initialContactList = undefined
let isXRHinDocumentReady = false

function addXMLRequestCallback(callback) {
    var oldSend, i;
    if (XMLHttpRequest.callbacks) {
        // we've already overridden send() so just add the callback
        XMLHttpRequest.callbacks.push(callback);
    } else {
        // create a callback queue
        XMLHttpRequest.callbacks = [callback];
        // store the native send()
        oldSend = XMLHttpRequest.prototype.send;
        // override the native send()
        XMLHttpRequest.prototype.send = function () {
            // process the callback queue
            // the xhr instance is passed into each callback but seems pretty useless
            // you can't tell what its destination is or call abort() without an error
            // so only really good for logging that a request has happened
            // I could be wrong, I hope so...
            // EDIT: I suppose you could override the onreadystatechange handler though
            for (i = 0; i < XMLHttpRequest.callbacks.length; i++) {
                XMLHttpRequest.callbacks[i](this);
            }
            // call the native send()
            oldSend.apply(this, arguments);
        }
    }
}

addXMLRequestCallback(function (xhr) {
    if (!isXRHinDocumentReady) {
        xhr.addEventListener("load", function () {

            try {
                let response = JSON.parse(xhr.responseText)
                // console.log("=====XMLRequest======")
                // console.dir(xhr); 
                // console.log("initial xhr")
                if (response.ContactList != undefined && response.ContactList.length > 0) {

                    if (initialContactList == undefined) {
                        initialContactList = response.ContactList
                    } else {
                        initialContactList = initialContactList.concat(response.ContactList)
                    }
                    console.log("initial initialContactList before ready : ", initialContactList)
                }
            } catch (error) {

            }

        })
    }

});


window.onload = function () {

    const core = require("../js/core.js")
    const watchJS = require("../toolkit/watch-1.4.2.js")
    // const http = require('http')
    const fs = require('fs')

    const { net } = require('electron').remote
    const session = require('electron').remote.session;


    let logStatus = { "status": "offline" }
    let skey = ''
    // let meinUsername = undefined

    // const request = require('request')
    // const setimmediate = require('setimmediate')

    // 禁止弹出提醒
    // delete window.Notification

    // var Notification = function (title, ops) {
    //     // title is the title of the notifations, ops is the config object
    //     console.log("Notification : ", title, ops)
    // };

    addXMLRequestCallback(processXHR);



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


    function processXHR(xhr) {

        // console.log("=====XMLRequest======")
        // console.dir(xhr);
        if (!isXRHinDocumentReady && (initialContactList != undefined)) {

            // console.log("change isXRHinDocumentReady", initialContactList)
            isXRHinDocumentReady = true
            setTimeout(() => {

                initialContactList.forEach((element, index) => {

                    if (_chatContent[element.UserName] != undefined) {
                        let convoScope = angular.element(document.getElementById("J_NavChatScrollBody")).scope()
                        convoScope.chatList.forEach((chat, convoIndex) => {
                            if (chat.UserName == element.UserName) {
                                let convo = grepConvoInChatList(chat)
                                core.WebToHost({ "Convo-new": convo }).then((res) => {
                                    console.log(res)
                                }).catch((error) => {
                                    throw error
                                });
                            }

                        })
                    }
                })
            }, 200);

        }

        xhr.addEventListener("load", function () {
            // xhr.onreadystatechange = function () { if (xhr.readyState == 4 && xhr.status == 200) { 


            // =======start here
            try {
                let response = JSON.parse(xhr.responseText)

                // o 右侧来新消息
                // console.log(response, response.AddMsgList != undefined , response.AddMsgList.length)
                if (response.AddMsgList != undefined && response.AddMsgList.length > 0) {
                    response.AddMsgList.forEach((element, index) => {

                        // 目前猜测StatusNotifyCode为0是来新消息 (需要测试验证)
                        // console.log(element)
                        if (element.StatusNotifyCode == 0 || element.StatusNotifyCode == 2) {
                            console.log("xhr : new ")
                            let fromUserName = element.FromUserName

                            let usernameStr = $('div.header .avatar img.img').attr('mm-src')

                            let posUsername = usernameStr.indexOf('username')
                            let meinUsername = usernameStr.slice(posUsername + 'username='.length, usernameStr.indexOf('&', posUsername))

                            if (fromUserName == meinUsername) {
                                fromUserName = element.ToUserName
                            }

                            if (_chatContent[fromUserName] != undefined) {
                                let convoScope = angular.element(document.getElementById("J_NavChatScrollBody")).scope()
                                convoScope.chatList.forEach((chat, convoIndex) => {
                                    if (chat.UserName == fromUserName) {
                                        let convo = grepConvoInChatList(chat)
                                        core.WebToHost({ "Convo-new": convo }).then((res) => {
                                            console.log(res)
                                        }).catch((error) => {
                                            throw error
                                        });
                                    }

                                })
                            }

                        }

                    })
                    // console.log("new xrh--->")
                    // console.log(response.AddMsgList)

                }

                if (response.LocalID != undefined && response.MsgID != undefined) {
                    // 发送消息
                    // console.log("xhr : 发送消息")
                    Object.keys(_chatContent).forEach(usrID => {
                        // console.log("debug : usrID : ", usrID)
                        if (_chatContent[usrID].length > 0) {
                            (_chatContent[usrID]).forEach(msg => {
                                if (msg.MsgId == response.MsgID) {

                                    let convoScope = angular.element(document.getElementById("J_NavChatScrollBody")).scope()
                                    convoScope.chatList.forEach((chat, convoIndex) => {

                                        if (chat.UserName == usrID) {
                                            let convo = grepConvoInChatList(chat)
                                            core.WebToHost({ "Convo-new": convo }).then((res) => {
                                                console.log(res)
                                            }).catch((error) => {
                                                throw error
                                            });
                                        }

                                    })

                                }
                            })
                        }

                    });

                }
                if (response.ContactList != undefined && response.ContactList.length > 0) {

                    console.log("initial initialContactList : ", response.ContactList)
                    // let convoObj = findConvo('filehelper')
                    // if (convoObj != undefined) {
                    //     let convoClicked = grepNewMSG(convoObj)
                    //     core.WebToHost({ "Convo-new": convoClicked }).then((res) => {
                    //         console.log(res)
                    //     }).catch((error) => {
                    //         throw error
                    //     });
                    // }

                    setTimeout(() => {

                        response.ContactList.forEach((element, index) => {

                            if (_chatContent[element.UserName] != undefined) {
                                let convoScope = angular.element(document.getElementById("J_NavChatScrollBody")).scope()
                                convoScope.chatList.forEach((chat, convoIndex) => {
                                    if (chat.UserName == element.UserName) {
                                        let convo = grepConvoInChatList(chat)
                                        core.WebToHost({ "Convo-new": convo }).then((res) => {
                                            console.log(res)
                                        }).catch((error) => {
                                            throw error
                                        });
                                    }

                                })
                            }

                        })
                    }, 200);
                }
            } catch (error) {

            }
        })
    }

    /**
     * 根据微信储存的变量_chatcontent读取消息
     * @param {Object} MSG 微信单条消息
     * @returns {Object} 拿到我们关系的内容
     * @param {Integer} indexMSG MSG在_chatcontent里位置
     */
    function grepBubble(contacts, MSG, indexMSG) {


        let fromUserName = MSG["MMActualSender"]
        // let toUserName = MSG["ToUserName"]
        let time = new Date(MSG["CreateTime"] * 1000 + indexMSG % 1000)


        let avatar = undefined
        let fileName = undefined
        let fileSize = undefined
        let remarkName = ''
        let nickName = ''
        if (MSG["FromUserName"].substr(0, 2) == "@@") {
            // console.log("MSG is group")
            // 聊天群
            let memberList = (contacts[MSG["FromUserName"]])['MemberList']
            let foundName = false
            memberList.forEach(member => {
                // console.log('member name : ', member['UserName'] ,  MSG['MMActualSender'],member['UserName'] == MSG['MMActualSender'] )
                if (!foundName && member['UserName'] == MSG['MMActualSender']) {
                    remarkName = member['DisplayName']
                    nickName = member['NickName']
                    // console.log("find Name : ",member, member['DisplayName'],  member['DisplayName'])
                    // avatar = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + member['HeadImgUrl']
                    avatar = window.location.href.substring(0, window.location.href.lastIndexOf('/'))
                        + "/cgi-bin/mmwebwx-bin/webwxgeticon?seq=0&username=" + member['UserName']
                        + "&chatroomid=" + (contacts[MSG["FromUserName"]])["EncryChatRoomId"]
                        + "&skey="
                    foundName = true
                }
            })
            // console.log('member name : ', remarkName, nickName)
            // console.log('memberlist : ', memberList)
        } else if (contacts[fromUserName] != undefined) {
            remarkName = (contacts[fromUserName])["RemarkName"]
            nickName = (contacts[fromUserName])["NickName"]
        }
        // 获取有几条未读消息
        // let strUnread = $("div.ng-scope div [data-username='" + fromUserName + "'] i").text()
        // let unread = strUnread == '' ? 0 : parseInt(strUnread)
        let type = ""

        let content = ""

        if (MSG["MMActualContent"].length > 0) {
            let contentObj = jQuery.parseHTML(MSG["MMActualContent"])
            // 对content进行处理, 目前只发现emoji在里面
            contentObj.forEach((c, i) => {
                // 将内容进行切割, 判断是否为img emoji进行处理
                // console.log("content contentObj ",$(c))
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
                        content = content + emojiClasstoStr(c.classList[1])
                    } else {
                        content = content + "[image]"
                    }
                } else if (nodeName == "BR") {
                    content = content + '\n'
                }

                // 链接文字
                content = content + $(c).text()


            })
        }


        let MSGID = MSG["MsgId"]

        let MSGObj = $("div[data-cm*='" + MSGID + "']")

        // 获取状态
        let status = undefined

        if ($(MSGObj).length > 0) {

            if (($(MSGObj).find("[src='//res.wx.qq.com/a/wx_fed/webwx/res/static/img/xasUyAI.gif']").length > 0 && $(MSGObj).find("[src='//res.wx.qq.com/a/wx_fed/webwx/res/static/img/xasUyAI.gif']").is(':visible'))
                || ($(MSGObj).find("[ng-click='cancelUploadFile(message)']").length > 0 && $(MSGObj).find("[ng-click='cancelUploadFile(message)']").is(':visible'))) {
                status = 'sending'
            } else if (($(MSGObj).find(".ico_fail.web_wechat_message_fail").length > 0 && $(MSGObj).find(".ico_fail.web_wechat_message_fail").is(':visible'))
                || ($(MSGObj).find("[ng-if*='CONF.MM_SEND_FILE_STATUS_FAIL']").length > 0 && $(MSGObj).find("[ng-if*='CONF.MM_SEND_FILE_STATUS_FAIL']").is(':visible'))) {
                status = 'failed'
            } else {
                status = 'done'
            }
        }

        // console.log("text : ", MSG["MsgType"] == wechatMSGType.MSGTYPE_TEXT && 
        // ((! MSG["SubMsgType"])  || ( MSG["SubMsgType"] == 0)) )
        if (MSG["MsgType"] == wechatMSGType.MSGTYPE_TEXT &&
            ((!MSG["SubMsgType"]) || (MSG["SubMsgType"] == 0))) {
            // 正常输出
            type = 'text'
            // 判断是否为组群消息
            if (MSG["FromUserName"].substr(0, 2) == "@@") {
                // content <= MMActualContent 不需要去掉发件人
                // content = content.substr(content.indexOf(":") + 1)
            }
            // 判断是否为url
            if ($(MSGObj).find("div.plain pre a").length > 0 && $(MSGObj).find("div.plain pre").contents().toArray().length == 1) {
                type = "url"
            }

        } else if (MSG["MsgType"] == wechatMSGType.MSGTYPE_IMAGE || MSG["MsgType"] == wechatMSGType.MSGTYPE_EMOTICON) {
            // 缓存图片
            // console.log("type img")
            type = 'img'
            // if (MSG["MMThumbSrc"]) { //小图片, 直接原图
            //     content = MSG["MMThumbSrc"]
            //     // let scriptSrc = $("script[async][src*='skey']").attr("src")
            //     // console.log(scriptSrc)
            //     // let posskey =  scriptSrc.indexOf('skey')
            //     // let skey = scriptSrc.slice(posskey + 'skey='.length, scriptSrc.indexOf('&', posskey) )
            //     // console.log(skey)
            //     let imgUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'))
            //         + "/cgi-bin/mmwebwx-bin/webwxgetmsgimg?&MsgID=" + MSGID
            //         + "&skey=" + skey
            //     // console.log(imgUrl)
            //     content = imgUrl
            // } else {
            //     // 置换内容
            //     let imgUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + $(MSGObj).find("img.msg-img").attr("src")
            //     if (imgUrl) {
            //         content = imgUrl
            //         // 还原为原始大小
            //         content = content.slice(0, -"&type=slave".length)
            //     } else { // 找不到地址, 可能网页元素已经被删除
            //         content = MSG["MMThumbSrc"]
            //         let imgUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'))
            //             + "/cgi-bin/mmwebwx-bin/webwxgetmsgimg?&MsgID=" + MSGID
            //             + "&skey=" + skey
            //         // console.log(imgUrl)
            //         content = imgUrl
            //     }
            // }
            if (status == 'sending' || status == 'failed') {
                if (MSG["MMThumbSrc"]) {
                    content = MSG["MMThumbSrc"]
                } else {
                    content = ''
                }
            } else {
                let imgUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/'))
                    + "/cgi-bin/mmwebwx-bin/webwxgetmsgimg?&MsgID=" + MSGID
                    + "&skey=" + skey

                // console.log(imgUrl)
                content = imgUrl
            }

        } else if (MSG["MsgType"] == wechatMSGType.MSGTYPE_MICROVIDEO) {
            // 小视频
            type = 'unknown'

            // type = 'img'
            // let imgUrl = window.location.href.substring(0, window.location.href.lastIndexOf('/')) + $(MSGObj).find("img.msg-img").attr("src")
            // // 置换内容
            content = '[视频]'
        } else if (MSG["MsgType"] == wechatMSGType.MSGTYPE_APP && MSG["AppMsgType"] == 5) {
            // 公众号链接
            type = 'url'
            content = MSG["Url"]
        } else if (MSG["MsgType"] == wechatMSGType.MSGTYPE_APP && MSG["AppMsgType"] == 6) {
            // 文件
            if (MSG["MMAppMsgDownloadUrl"]) {
                type = 'file'
                content = MSG["MMAppMsgDownloadUrl"]
                fileName = MSG["FileName"]
                fileSize = parseFloat(MSG["FileSize"])
            }

        } else {
            type = 'unknown'
        }

        let usernameStr = $('div.header .avatar img.img').attr('mm-src')

        let posUsername = usernameStr.indexOf('username')
        let meinUsername = usernameStr.slice(posUsername + 'username='.length, usernameStr.indexOf('&', posUsername))
        // console.log("mein name : ", meinUsername)

        // console.log(remarkName, MSGID, type, content, time)
        // console.log(content)




        return {
            "from": MSG["FromUserName"] == meinUsername ? undefined : (remarkName == '' ? nickName : remarkName),
            "msgID": MSGID,
            "time": time.getTime(),
            "type": type,
            "message": content,
            "avatar": avatar,
            "fileName": fileName,
            "fileSize": fileSize,
            "status": status
        }


    }

    /**
     * 将QQ的emoji class转换为emoji字符
     * 例如 : emoji1f1e81f1f3 -> 🇨🇳 
     * @param {String} strClass 
     * @returns {String}
     */
    function emojiClasstoStr(strClass){
        
        let emojiRStr = strClass.slice(5)
        let emojiArray = []
        let emoji
        if(emojiRStr.length == 4){
            //只有一个unicode
            emojiArray.push('0x'+emojiRStr)
        }else if(emojiRStr.length == 5 && emojiRStr.slice(0,2) == '1f' ){
            // 以1f开头有5位
            emojiArray.push('0x'+emojiRStr)
        }else{
            // 估计是合成emoji, 进行拆分
            // qq的表情都是两个unicode合成的, 没有大于两个的
            if(emojiRStr.length == 6 ){
                emojiArray.push('0x'+emojiRStr.slice(0,2))
                emojiArray.push('0x'+emojiRStr.slice(2))
            }else if(emojiRStr.length == 8 ){
                emojiArray.push('0x'+emojiRStr.slice(0,4))
                emojiArray.push('0x'+emojiRStr.slice(4))
            }else if(emojiRStr.length == 9){
                if(emojiRStr.slice(0,2) == '1f'){
                    emojiArray.push('0x'+emojiRStr.slice(0,5))
                    emojiArray.push('0x'+emojiRStr.slice(5))
                }else{
                    emojiArray.push('0x'+emojiRStr.slice(0,4))
                    emojiArray.push('0x'+emojiRStr.slice(4))
                }
            }else if(emojiRStr.length == 10){
                emojiArray.push('0x'+emojiRStr.slice(0,5))
                emojiArray.push('0x'+emojiRStr.slice(5))
            }
        }

        try {
            emoji = String.fromCodePoint(...(emojiArray)) // ... 是js的扩展算符, 把array变成用","分割的多个变量
        } catch (error) {
            // 找不到emoji
            emoji = '[emoji]'
        }

        return emoji
    
    }

    function findConvo(usrID) {
        console.log("findConvo : ", usrID)
        // 判断是否在_chatContent, 不在说明一定找不到
        if (_chatContent[usrID] != undefined) {

            console.log("start to search convo")
            let convoList = "#J_NavChatScrollBody"

            $(convoList).scrollTop(0)

            do {
                $(convoList).scrollTop($(convoList).scrollTop() + 60)

                let convoObj = $(".chat_item.slide-left.ng-scope[data-username='" + usrID + "']")

                if ($(convoObj).length > 0) {
                    // 右侧找到convo
                    console.log("scroll find !")
                    return convoObj
                } else {
                    console.log("scroll not find")
                }
            } while ($(convoList).scrollTop() + $(convoList)[0].clientHeight != $(convoList)[0].scrollHeight)


        } else {
            console.log("findConvo : ", usrID, "not in _chatContent")
            return undefined
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
                        content = content + emojiClasstoStr(c.classList[1])
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

        // let host =
        //     window.location.href.lastIndexOf('/') == window.location.href.length - 1 ?
        //         window.location.href.substring(0, window.location.href.lastIndexOf('/')) :
        //         window.location.href


        let avatar = $(obj).find("div.avatar img").get(0).src


        // console.log("convo exist : ", $("div[ng-click][data-username='" + userID + "']").length, $("div[data-username='" + userID + "']"))
        // if ( $("div[ng-click][data-username='" + userID + "']").length == 0  ) {
        //     // 元素被删除了
        //     return {
        //         "userID": userID,
        //         "time": time.getTime(),
        //         "message": "",
        //         "nickName": nickName,
        //         "avatar": avatar,
        //         "counter": 0,
        //         "action": "r",
        //         "muted": true,
        //         "index": 0
        //     }
        // } else {
        let counter = 0
        let muted = false
        // 简单粗暴, 默认为add
        // 微信初始会弹出最近联系人, 需要滤掉该部分convo, 将action设为c
        // action为c: 使得没有消息的联系人不会在transduction上创建
        // 特殊 : filehelper以及被置顶的联系人依然会被添加
        let action = 'a'
        if ($(obj).find("div.ext p.attr.ng-scope[ng-if='chatContact.isMuted()']").length > 0) {
            // 被静音了
            console.log("is muted")
            muted = true
            if ($(obj).find("div.info p.msg span.ng-binding.ng-scope").length > 0) {
                // 多条未读
                console.log("multi-MSGs")
                let str_counter = $(obj).find("div.info p.msg span.ng-binding.ng-scope").text()
                str_counter = str_counter.substr(1, str_counter.length - 3)
                counter = parseInt(str_counter)
            } else {
                console.log("single-MSG")
                if (content == '') {
                    // 初始化
                    console.log("initial muted group")
                    counter = 0
                    if ($('#J_NavChatScrollBody').attr("data-username") == ""
                        && (userID == "filehelper" || $(obj).hasClass("top"))) {
                        action = 'a'
                    } else {
                        action = 'c'
                    }


                } else {
                    console.log("unread 1 : ", $(obj).find('div.avatar i.web_wechat_reddot').length)
                    if ($(obj).find('div.avatar i.web_wechat_reddot').length > 0) {
                        // 一条未读
                        counter = 1
                    } else {
                        counter = 0
                    }

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
                if ($('#J_NavChatScrollBody').attr("data-username") == ""
                    && (userID == "filehelper" || $(obj).hasClass("top"))) {
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
        // }

    }

    function grepConvoInChatList(obj) {


        // 筛选消息内容
        let contentObj = obj.MMDigest
        // console.log(contentObj)
        if (contentObj == '') {
            content = ''
        } else {
            content = ""
            $('<p class="msg ng-scope" ng-if="chatContact.MMDigest">' + contentObj + "</p>").contents().toArray().forEach((c, i) => {
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
                        content = content + emojiClasstoStr(c.classList[1])
                    } else {
                        content = content + "[image]"
                    }
                }

                // 链接文字
                content = content + $(c).text()


            })

        }

        let nickNameHtml = obj.RemarkName == '' ? obj.NickName : obj.RemarkName
        let nickName = ''
        if(nickNameHtml && nickNameHtml != ''){
            $('<p>'+nickNameHtml+'</p>').contents().toArray().forEach((c, i) => {
                // 将内容进行切割, 判断是否为img

                let nodeName = $(c).prop('nodeName')
                if (nodeName == "IMG") {
                    // 对左侧栏筛选字符表情
                    if ($(c).hasClass("qqemoji")) {
                        // <img class="qqemoji qqemoji68" text="[蛋糕]_web" src="/zh_CN/htmledition/v2/images/spacer.gif"></img>
                        let strEmoji = $(c).attr("text")
                        strEmoji = strEmoji.substr(0, strEmoji.length - 4)
                        nickName = nickName + strEmoji
                    } else if ($(c).hasClass("emoji")) {
                        // <img class="emoji emoji1f63c" text="_web" src="/zh_CN/htmledition/v2/images/spacer.gif"></img>
                        nickName = nickName + emojiClasstoStr(c.classList[1])
                    } else {
                        nickName = nickName + "[image]"
                    }
                }

                // 链接文字
                nickName = nickName + $(c).text()

            })
        }else{
            nickName = undefined
        }

        let userID = obj.UserName


        let time = new Date() // Now
        let chatObj = _chatContent[userID]
        if (chatObj.length > 0) { // last MSG
            time = new Date((chatObj[chatObj.length - 1])["MMDisplayTime"] * 1000)
        }

        let host =
            window.location.href.lastIndexOf('/') == window.location.href.length - 1 ?
                window.location.href.substring(0, window.location.href.lastIndexOf('/')) :
                window.location.href


        let avatar = host + obj.HeadImgUrl


        // console.log("convo exist : ", $("div[ng-click][data-username='" + userID + "']").length, $("div[data-username='" + userID + "']"))
        // if ( $("div[ng-click][data-username='" + userID + "']").length == 0  ) {
        //     // 元素被删除了
        //     return {
        //         "userID": userID,
        //         "time": time.getTime(),
        //         "message": "",
        //         "nickName": nickName,
        //         "avatar": avatar,
        //         "counter": 0,
        //         "action": "r",
        //         "muted": true,
        //         "index": 0
        //     }
        // } else {
        let counter = obj.NoticeCount



        let muted = false
        if (obj.isMuted()) {
            // 被静音了
            muted = true
        } else {

        }


        // 简单粗暴, 默认为add
        // 微信初始会弹出最近联系人, 需要滤掉该部分convo, 将action设为c
        // action为c: 使得没有消息的联系人不会在transduction上创建
        // 特殊 : filehelper以及被置顶的联系人依然会被添加
        let action = 'a'
        if (content == '') {
            if ($('#J_NavChatScrollBody').attr("data-username") == ""
                && (userID == "filehelper" || obj.isTop() > 0)) {
                action = 'a'
            } else {
                action = 'c'
            }
        }

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
            "index": obj._index
        }
        // }


    }



    function grepAndSendRight(MSGID = undefined) {


        if ($('div.title_wrap a[data-username]').length > 0) {
            let ID = $('div.title_wrap a[data-username]').attr('data-username')

            let objSlide = _chatContent[ID]
            // console.log("objSlide : id : ", ID ,objSlide)
            let MSGList = new Array()
            for (let indexMSG in objSlide) {
                // console.log("debug : ", indexMSG, "---->")
                // console.log(objSlide[indexMSG])
                // 发送中
                let objSending = $("div[data-cm*='" + (objSlide[indexMSG])["MsgId"] + "']")
                    .find("[src='//res.wx.qq.com/a/wx_fed/webwx/res/static/img/xasUyAI.gif'], [ng-click='cancelUploadFile(message)']")
                // if ($("div[data-cm*='" + (objSlide[indexMSG])["MsgId"] + "']").length > 0 &&
                //     ($(objSending).length == 0 ||
                //         $(objSending).is(':hidden'))) {
                if (MSGID == undefined) {
                    if ($("div[data-cm*='" + (objSlide[indexMSG])["MsgId"] + "']").length > 0) {
                        let MSG = grepBubble(_contacts, objSlide[indexMSG], indexMSG)
                        MSGList.push(MSG)
                    }
                } else {
                    if ((objSlide[indexMSG])["MsgId"] == MSGID &&
                        $("div[data-cm*='" + (objSlide[indexMSG])["MsgId"] + "']").length > 0) {
                        let MSG = grepBubble(_contacts, objSlide[indexMSG], indexMSG)
                        MSGList.push(MSG)
                    }
                }


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

        }
    }

    // 联系人发生变更
    var callbackContact = function (records, observer) {


        if ($("#navContact").scrollTop() + $("#navContact")[0].clientHeight != $("#navContact")[0].scrollHeight) {
            console.log("debug : ", "----------contact change----------")
            // console.log($("#navContact").scrollTop() , $("#navContact")[0].clientHeight, $("#navContact")[0].scrollHeight)
            $("#navContact").scrollTop(0)
            $("#navContact").scrollTop($("#navContact")[0].scrollHeight)

            // // 更新联系人
            // contacts = window._contacts
            // // 更新对话
            // chatContent = window._chatContent

            // 临时放在这
            // let username = getUsernameByRemarkName(remarkName)
            observer.disconnect()
        }
    };

    /**
     * 从形如
     * {"type":"message","actualSender":"@09ff76c19a9a106126e4e72f67494ed888b3844f432374bcc84e3238745892ec",↵                 "msgType":"1","subType":0,"msgId":"15685617865120817"}
     * 中获得msgID
     * @param {*} rawStr 
     */
    function getMSGIDFromString(rawStr) {
        return rawStr.slice(
            rawStr.indexOf('"msgId":') + ('"msgId":"').length,
            rawStr.indexOf('"', rawStr.indexOf('"msgId":') + ('"msgId":"').length))
    }

    var callbackRight = function (mutationList) {

        console.log("debug : ===========Right changed============")
        // console.log(mutationList)

        addedNewBubble = false
        // msgIDChanged = false
        mutationList.forEach((mutation, index) => {

            if ($(mutation.target).is('div.ng-scope')) {
                mutation.addedNodes.forEach((node, index) => {
                    if ($(node).is(' div.ng-scope')
                        && ($('div[ng-repeat="message in chatContent"]').length < 2 || $('div[ng-repeat="message in chatContent"]').index(node) >= 1)) {
                        console.log($('div[ng-repeat="message in chatContent"]').length, $('div[ng-repeat="message in chatContent"]').index(node))
                        addedNewBubble = addedNewBubble || true
                    }
                })
            }

            if (mutation.attributeName == 'data-cm' &&
                mutation.oldValue.includes('msgId')
                && getMSGIDFromString($(mutation.target).attr('data-cm')) != "{{message.MsgId}}") {

                if ($('div.title_wrap a[data-username]').length > 0) {
                    let ID = $('div.title_wrap a[data-username]').attr('data-username')

                    let objSlide = _chatContent[ID]
                    for (let indexMSG in objSlide) {

                        if ((objSlide[indexMSG])["MsgId"] == getMSGIDFromString($(mutation.target).attr('data-cm')) &&
                            $("div[data-cm*='" + (objSlide[indexMSG])["MsgId"] + "']").length > 0) {
                            let MSG = grepBubble(_contacts, objSlide[indexMSG], indexMSG)
                            if (MSG != undefined) {

                                MSG["userID"] = ID;
                                MSG["oldMsgID"] = getMSGIDFromString(mutation.oldValue)
                                if (MSG["oldMsgID"] != '{{message.MsgId}}') {
                                    core.WebToHost({ "Dialog": [MSG] }).then((res) => {
                                        console.log(res)
                                    }).catch((error) => {
                                        throw error
                                    });
                                }
                            }

                        }
                    }
                }

            }
        })

        if (addedNewBubble) {
            console.log(mutationList)
            grepAndSendRight()
        }


    }

    // 消息发生变更
    // var callbackChatInitial = function (records, observe) {

    //     if (initialContactList != undefined) {
    //         observe.disconnect()
    //         initialContactList.forEach((element, index) => {

    //             let convoObj = findConvo(element.UserName)
    //             if (convoObj != undefined) {
    //                 let convoClicked = grepNewMSG(convoObj)
    //                 core.WebToHost({ "Convo-new": convoClicked }).then((res) => {
    //                     console.log(res)
    //                 }).catch((error) => {
    //                     throw error
    //                 });
    //             }

    //         })
    //         initialContactList = undefined
    //     }

    // }

    var callbackChat = function (records) {
        console.log("debug : ===========chat changed============")


        let arrayObjUser = new Array();
        let arrayContent = new Array();
        records.map(function (record) {
            // console.log("debug : ===========chat slide============")
            // console.log("debug : ", "obs type : ", record.type)
            // console.log("debug : ", "obs target : ")
            // console.log($(record.target))
            // console.log("debug : ", "remove : ", $(record.removedNodes).length)
            // console.log($(record.removedNodes))


            let obj = $(record.target).closest(".chat_item.slide-left.ng-scope")
            // console.log( obj  )    
            if ($(obj).length > 0) {
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

                        let convoDel = grepNewMSG(obj)
                        // 判断是否被删除了
                        let existInChatList = false
                        let convoScope = angular.element(document.getElementById("J_NavChatScrollBody")).scope()
                        convoScope.chatList.forEach((chat, convoIndex) => {
                            if (chat.UserName == convoDel.userID) {
                                existInChatList = true
                            }

                        })
                        if (!existInChatList) {
                            convoDel.action = 'r'
                            core.WebToHost({ "Convo-new": convoDel }).then((res) => {
                                console.log(res)
                            }).catch((error) => {
                                throw error
                            });
                        }
                    })
                })
            }

            if (document.hasFocus() &&  record.target == $("#J_NavChatScrollBody")[0] && record.attributeName == 'data-username') {
                // 点击新的用户
                // arrayObjUser.push(
                //     $(".chat_item.slide-left.ng-scope[data-username='" + $("#J_NavChatScrollBody").attr('data-username') + "']"))
                let convoObj = $(".chat_item.slide-left.ng-scope[data-username='" + $("#J_NavChatScrollBody").attr('data-username') + "']")
                if (convoObj != undefined) {
                    let convoClicked = grepNewMSG(convoObj)
                    convoClicked.action = 'a'
                    core.WebToHost({ "Convo-new": convoClicked }).then((res) => {
                        console.log(res)
                    }).catch((error) => {
                        throw error
                    });
                }

            }

        })

        // console.log("debug : ", "------array:user-----")
        // console.log(arrayObjUser)

        // // console.log("debug : ", "------array:MSG-----")
        // arrayObjUser.forEach((currentValue, index) => {
        //     // console.log("debug : ", index)
        //     arrayContent.push(grepNewMSG(currentValue))
        // })

        // // console.log("debug : ", "------array:MSG-----")
        // // console.log(arrayContent)
        // arrayContent.forEach((currentValue, index) => {
        //     // 向index发出新消息提醒
        //     core.WebToHost({ "Convo-new": currentValue }).then((res) => {
        //         console.log(res)
        //     }).catch((error) => {
        //         throw error
        //     });
        // })



    };


    let callbackHead = function (mutationList) {

        // console.log("head changed : ",mutationList )
        mutationList.forEach((mutation, index) => {
            // skey changed
            // if (mutation.addedNodes && mutation.addedNodes.length){
            //     console.log("head changed : ",mutation.addedNodes )
            // }
            if (mutation.addedNodes.length > 0 && $(mutation.addedNodes[0]).is("script[async][src*='skey']")) {
                let scriptSrc = $("script[async][src*='skey']").attr("src")
                // console.log(scriptSrc)
                let posskey = scriptSrc.indexOf('skey')
                skey = scriptSrc.slice(posskey + 'skey='.length, scriptSrc.indexOf('&', posskey))
                // console.log('skey : ', skey)
            }
        })
    }

    $(document).ready(function () {



        let obsHead = new MutationObserver(callbackHead);

        // 观察到微信登录或者注销登录页面会刷新
        if ($("div.login").length > 0) {
            console.log("********************offline***************************************")
            logStatus.status = "offline"
            core.WebToHost({ "logStatus": logStatus })
            core.WebToHost({ "show": {} })


            session.defaultSession.cookies.get({ url: window.location.href }, (err, cookies) => {
                // console.log("cookies : ", cookies)
                let expire = undefined
                let frequency = undefined
                cookies.forEach((cookie) => {
                    if (cookie.name == 'webwx_auth_ticket') {
                        expire = cookie.expirationDate
                    }
                    if (cookie.name == 'login_frequency') {
                        frequency = parseInt(cookie.value)
                    }
                })
                if (expire != undefined
                    && frequency != undefined && (isNaN(frequency) || frequency < 2)) {
                    console.log("frequency is ", frequency)
                    session.defaultSession.cookies.set({
                        url: window.location.href,
                        name: 'login_frequency',
                        value: "2"
                    })
                    location.reload()
                }
            })

            let callbackobsLogin = function (mutationList, observer) {
                // console.log("log status changed : ", $("div.login").is(':visible'))
                if ($('div[data-username="filehelper"]').length > 0) {
                    logStatus.status = "online"
                    console.log("=======================online=====================================")
                    // console.log($("div.login"))
                    core.WebToHost({ "logStatus": logStatus })
                    core.WebToHost({ "hide": {} })

                    // =====skey=========
                    obsHead.observe($("head")[0], {
                        childList: true,
                        subtree: false,
                        characterData: false,
                        attributeFilter: ["src"],
                        attributes: true, attributeOldValue: true
                    });
                    observer.disconnect()

                    // addXMLRequestCallback(processXHR);


                }
            }
            let obsLogin = new MutationObserver(callbackobsLogin);
            obsLogin.observe($('div[mm-repeat="chatContact in chatList track by chatContact.UserName"]')[0], {
                childList: true,
                subtree: false,
                characterData: false,
                // attributeFilter: ["style"],
                attributes: false, attributeOldValue: false
            });

            // ====处理聊天记录====

            // =====skey=========
            obsHead.disconnect()


        } else {
            logStatus.status = "online"
            console.log("=======================online=====================================")
            // console.log($("div.login"))
            core.WebToHost({ "logStatus": logStatus })
            core.WebToHost({ "hide": {} })

            // =====skey=========
            obsHead.observe($("head")[0], {
                childList: true,
                subtree: false,
                characterData: false,
                attributeFilter: ["src"],
                attributes: true, attributeOldValue: true
            });
            // let scriptSrc = $("script[async][src*='skey']").attr("src")
            // // console.log(scriptSrc)
            // let posskey =  scriptSrc.indexOf('skey')
            // skey = scriptSrc.slice(posskey + 'skey='.length, scriptSrc.indexOf('&', posskey) )

            // addXMLRequestCallback(processXHR);
        }


        // let contacts = window._contacts
        // let chatContent = window._chatContent

        // let remarkName = "乐宏昊"

        // 等待拉取联系人
        let obsContact = new MutationObserver(callbackContact);

        obsContact.observe($("#navContact")[0], { childList: true, subtree: true });



        // 截取新消息
        // 观察左侧消息变动
        // let obsChatInitial = new MutationObserver(callbackChatInitial);

        // obsChatInitial.observe($("#J_NavChatScrollBody")[0], {
        //     childList: true,
        //     subtree: true,
        //     characterData: false,
        //     attributes: false, attributeOldValue: false
        // });

        let obsChat = new MutationObserver(callbackChat);

        obsChat.observe($("#J_NavChatScrollBody")[0], {
            childList: true,
            subtree: true,
            characterData: true,
            attributeFilter: ["data-username"],
            attributes: true, attributeOldValue: true
        });

        let obsRight = new MutationObserver(callbackRight);


        $(document).on('click', 'a[download]', function () {
            core.sendToMain({ 'download': { 'url': $(this).attr('href') } })
        })


        // 接收上层消息
        core.WebReply((key, arg) => {
            return new Promise((resolve, reject) => {
                if (key == 'queryDialog') {

                    console.log("debug : ", "---获取用户聊天记录----")
                    // 下面开始模拟点击
                    let ID = arg.userID

                    // if ($("div.chat_item[data-username='" + ID + "']").length > 0) {
                    //     $("div.chat_item[data-username='" + ID + "']").click()
                    // } else {
                        let convoScope = angular.element(document.getElementById("J_NavChatScrollBody")).scope()
                        
                        convoScope.itemClick(ID)
                        convoScope.$apply();

                        setTimeout(() => {
                            convoScope.chatList.forEach((chat, convoIndex) => {
                                if (chat.UserName == ID) {
                                    let convo = grepConvoInChatList(chat)
                                    core.WebToHost({ "Convo-new": convo }).then((res) => {
                                        console.log(res)
                                    }).catch((error) => {
                                        throw error
                                    });
                                }
    
                            })
                        }, 200);                        
                    // }



                    obsRight.disconnect()
                    obsRight.observe($("div[mm-repeat='message in chatContent']")[0], {
                        subtree: true, childList: true, characterData: false, attributes: true,
                        attributeFilter: ["data-cm"],
                        attributeOldValue: true, characterDataOldValue: false
                    })

                    setTimeout(() => {
                        // 获取内容
                        grepAndSendRight()

                    }, 100);

                    resolve("request received. MSG will send.")

                } else if (key == 'sendDialog') {
                    console.log("--------sendDialog---")
                    // 检查

                    if ($("div.title_wrap a[data-username='" + arg[0] + "']").length == 0) {
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
                            angular.element('pre:last').scope().editAreaCtn = core.htmlEntities(value)

                            // angular.element('pre:last').scope().editAreaCtn = $('#editArea').html()

                            // let e = $.Event("keydown", { keyCode: 64 }); //64没有对应按键
                            // $("#chatInputAreaWithQuotes").trigger(e);

                            // let obsSend = new MutationObserver((mutationList, observer) => {
                            // $('a[ng-click="sendTextMessage()"]').click()
                            angular.element('pre:last').scope().sendTextMessage();

                            console.log("---text---")
                            // waitSend(arrayValue, index)
                            // send(arrayValue, index + 1)

                            send(arrayValue, index + 1)

                            // observer.disconnect()
                            // });
                            // obsSend.observe($('div.send-button-holder button')[0], {
                            //     subtree: false, childList: false, characterData: false, attributes: true,
                            //     attributeOldValue: false, characterDataOldValue: false
                            // });

                        } else {
                            // $("div.webuploader-pick").attr('class','webuploader-pick webuploader-pick-hover')
                            // $('input.webuploader-element-invisible').click()
                            core.WebToHost({ "attachFile": { "selector": "input.webuploader-element-invisible", "file": value } }).then((resHost) => {
                                console.log("---file---", value)
                                // waitSend(arrayValue, index)

                                send(arrayValue, index + 1)

                            })

                        }

                    }

                    function waitSend(arrayValue, index) {
                        // 等待发送完成
                        let obsSwxUpdated = new MutationObserver((mutationList, observer) => {

                            console.log("bubble changed : ", mutationList)
                            mutationList.forEach((mutation, nodeIndex) => {
                                let addedNodes = mutation.addedNodes
                                console.log(addedNodes)
                                if (addedNodes && $(addedNodes[0]).attr("ng-repeat") && $(addedNodes[0]).attr("ng-repeat") == "message in chatContent") {
                                    console.log('---addedNodes----')
                                    observer.disconnect()

                                    let lastObj = $("div[ng-switch-default].me")
                                        .last().find("div.bubble")
                                    console.log("last me : ", $(lastObj).attr("class"), $(lastObj).attr("data-cm"))
                                    if ($("div[ng-switch-default].me")
                                        .last()
                                        .find("[src='//res.wx.qq.com/a/wx_fed/webwx/res/static/img/xasUyAI.gif']")
                                        .is(':hidden')) {
                                        console.log('---send single 完成----', $("div[ng-switch-default].me")
                                            .last().find('div.bubble').attr('data-cm'))
                                        send(arrayValue, index + 1)
                                    } else {
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