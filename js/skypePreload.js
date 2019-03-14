window.onload = function () {
    console.log("runing skype preload")
    // console.log(process.versions.electron)
    // console.log(process.env.PWD)
    // console.log(process.cwd())
    window.$ = window.jQuery = require("../toolkit/jquery-3.3.1.min.js")
    const core = require("../js/core")

    let logStatus = { "status": "offline" }

    // 检查登录状态
    if (document.getElementById("timelineComponent")) {
        logStatus.status = "online"
        console.log("=======================online=====================================")
        core.WebToHost({ "logStatus": logStatus })
        core.WebToHost({ "hide": {} })
    }

    $(document).ready(function () {
        console.log(document.getElementById("forgotUsername"))
        if (document.getElementById("forgotUsername")) {
            logStatus.status = "offline"
            console.log("********************offline***************************************")
            core.WebToHost({ "logStatus": logStatus })
            core.WebToHost({ "show": {} })
        }
    })


    class conversation {
        constructor(action, userID, nickName, timestamp, avatar, message, counter, index, muted) {
            this.action = action
            this.userID = userID
            this.nickName = nickName
            this.timestamp = timestamp
            this.avatar = avatar
            this.message = message
            this.counter = counter
            this.index = index
            this.muted = muted
        }
        print() {
            for (let property in this) {
                console.log(property + ": " + this[property])
            }
        }
        /**
         * 发送消息到Win
         */
        send() {
            core.WebToHost({
                "Convo-new":
                {
                    "userID": this.userID,
                    "time": this.timestamp,
                    "message": this.message,
                    "nickName": this.nickName,
                    "avatar": this.avatar,
                    "counter": this.counter,
                    "action": this.action,
                    "muted": this.muted,
                    "index": this.index
                }

            }).then((res) => {
                console.log("debug : ---Win reply---")
                console.log(res)
            }).catch((error) => {
                throw error
            });
        }
        extractAll(aNode) {
            // this.action=
            console.log(aNode)
            this.userID = aNode.dataset.userID
            this.nickName = aNode.querySelector('h4 > span.topic').title
            this.timestamp = Date.now()
            this.avatar = aNode.querySelector('img.Avatar-image').src
            this.message = aNode.querySelector('div.message > p').innerHTML.replace(/<[^<>]*>/gm, '')
            this.counter = parseInt(aNode.querySelector('span.circle > p').innerText)
            this.index = Array.prototype.indexOf.call(
                aNode.closest('div.recents.scrollViewport-inner').querySelectorAll(
                    'swx-recent-item.list-selectable'),
                aNode.closest('swx-recent-item.list-selectable'))
            this.muted = false
        }
        extract(aNode, property) {
            console.log(aNode)
            this.userID = aNode.dataset.userID
            if (property === 'nickName') {
                this.nickName = aNode.querySelector('h4 > span.topic').title
            } else if (property === 'avatar') {
                this.avatar = aNode.querySelector('img.Avatar-image').src
            } else if (property === 'message') {
                this.message = aNode.querySelector('div.message > p').innerHTML.replace(/<[^<>]*>/gm, '')
            }
        }
    }

    class chatLog {
        constructor(type, msgID, from, time, message) {
            this.type = type
            this.msgID = msgID
            this.from = from
            this.time = time
            this.message = message
        }
        extractAll(aNode) {
            // 各种类型的信息应该都在div.content里，正常是p，图片是p.PictureSharing，
            // 联系人是<span>+<div.contactslist>，文件是p.FileTransfer.扩展名
            // 所以正确的逻辑应该是寻找div.content然后判断内部内容
            // 来自对方的消息 swx-message.their 自己的消息 swx-message.me
            // url是 div.messageTextWrapper>p.urlPreviewText>a
            this.msgID = aNode.dataset.id
            this.time = parseInt(aNode.dataset.id)
            if (aNode.classList.contains('their') &&
                aNode.querySelector('swx-name')) {
                this.from = aNode.querySelector('swx-name').innerHTML.replace(/<[^<>]*>/gm, '').trim()
            } else {
                this.from = undefined
            }
            if (aNode.classList.contains('picture') &&
                aNode.querySelector('div.content > p.PictureSharing > a')) {
                console.log('found img')
                this.type = 'img'
                this.message = aNode.querySelector('div.content > p.PictureSharing > a').href
            } else if (aNode.classList.contains('urlPreview') &&
                aNode.querySelector('div.content p.urlPreviewText > a')) {
                console.log('found url')
                this.type = 'url'
                this.message = aNode.querySelector('div.content p.urlPreviewText > a').href
            } else if (aNode.classList.contains('urlPreview') &&
                aNode.querySelector('div.content a.thumbnail')) {
                console.log('found url')
                this.type = 'url'
                this.message = aNode.querySelector('div.content a.thumbnail').href
            } else if (aNode.classList.contains('text') &&
                aNode.querySelector('div.content > p')) {
                console.log('found text')
                this.type = 'text'
                this.message = aNode.querySelector('div.content > p').innerHTML.replace(/<[^<>]*>/gm, '')
            } else {
                console.log('found unknown')
                this.type = 'unknown'
                this.message = aNode.querySelector('div.content').innerHTML.replace(/<!--[\s\S]*?-->/gm, '').replace(/<[^<>]*>/gm, '').trim()
            }
        }
    }

    function uniqueStr() {
        return Math.random().toString().slice(2, 5) + Date.now().toString()
    }

    let observer = new MutationObserver(function (list, obs) {
        console.log("-------------------------fire in the left hole--------------------------")
        console.log(list)

        let convo
        for (let i in list) {
            //初始化所有id，所有，新插入的也会被初始化
            if (list[i].type === 'childList' &&
                list[i].target.matches('swx-recent-item.list-selectable') &&
                list[i].addedNodes.length !== 0 &&
                list[i].addedNodes[0].nodeType === 1 &&
                list[i].addedNodes[0].matches('a')) {
                console.log("hit at: " + i + " initializing userID...")
                // console.log(list[i].addedNodes[0])
                list[i].addedNodes[0].dataset.userID = uniqueStr()
            }

            //检查小圈圈
            if (list[i].type === 'characterData' &&
                list[i].target.parentNode.matches('span.counter > span.circle > p')) {
                console.log('hit at: ' + i + ' 检查小圈圈')
                convo = new conversation('a')
                convo.extractAll(list[i].target.parentNode.closest('a'))
                convo.print()
                convo.send()
                convo = undefined
            }

            //检查小圈圈の消失
            if (list[i].type === 'childList' &&
                list[i].target.matches('div.text') &&
                list[i].removedNodes.length !== 0 &&
                list[i].removedNodes[0].nodeType === 1 &&
                list[i].removedNodes[0].matches('div.unseenNotifications') &&
                list[i].removedNodes[0].children.length === 1) {
                console.log('hit at: ' + i + ' 小圈圈の消失')
                convo = new conversation('c')
                convo.extract(list[i].target.closest('a'), 'userID')
                convo.counter = 0
                convo.print()
                convo.send()
                convo = undefined
            }

            //检查src
            if (list[i].type === 'attributes' &&
                list[i].attributeName === 'src' &&
                list[i].target.matches('img.Avatar-image')) {
                console.log('hit at: ' + i + ' 检查头像src')
                let convo = new conversation('c')
                convo.extract(list[i].target.closest('a'), 'avatar')
                convo.print()
                convo.send()
                convo = undefined
            }

            //检查 p.small
            if (list[i].type === 'childList' &&
                list[i].target.matches('p.small') &&
                list[i].addedNodes.length !== 0) {
                console.log('hit at: ' + i + ' 检查消息更新')
                let convo = new conversation('c')
                convo.extract(list[i].target.closest('a'), 'message')
                convo.print()
                convo.send()
                convo = undefined
            }

            //检查 nickName
            if (list[i].type === 'characterData' &&
                list[i].target.parentNode.matches('span.tileName span.topic')) {
                console.log('hit at: ' + i + ' 检查 nickName')
                let convo = new conversation('c')
                convo.extract(list[i].target.parentNode.closest('a'), 'nickName')
                convo.print()
                convo.send()
                convo = undefined
            }
        }
    })
    //观察左边
    observer.observe(document.getElementById("timelineComponent"),
        {
            subtree: true, childList: true, characterData: true, attributes: true,
            attributeFilter: ["src"], attributeOldValue: true, characterDataOldValue: true
        })


    // 观察右边
    let callbackMSG = function (records) {
        console.log("-------------------------fire in the right hole--------------------------")
        console.log(document.querySelectorAll('swx-message.message'))
        let msglog = []
        // document.querySelectorAll('swx-message.message').forEach((item, i) => {
        $("div.fragment:not(.hide) swx-message.message").toArray().forEach((item, i) => {
            msglog[i] = new chatLog()
            msglog[i].extractAll($(item)[0])
        })
        console.log(msglog)
        if (msglog.length > 0) {
            core.WebToHost({ 'Dialog': msglog }).then((res) => {
                console.log(res)
                // core.WebToHost({'focus':''}).then((res) =>{
                //     core.WebToHost({'blur':''})
                // }).catch((error) =>{
                //     throw error
                // })                    
            }).catch((error) => {
                throw error
            })
        }
        msglog = undefined
    }

    function reportChatLog(obs) {
        console.log('gathering messages')
        let msglog = []
        document.querySelectorAll('div.fragment:not(.hide) swx-message.message').forEach((item, i) => {
            msglog[i] = new chatLog()
            msglog[i].extractAll(item)
        })
        // 获取userID
        if (msglog.length > 0) {
            (msglog[0])["userID"] = $("a.active[data-user-i-d]").attr("data-user-i-d")
        }
        core.WebToHost({ 'Dialog': msglog }).then((res) => {
            console.log(res)
        }).catch((error) => {
            throw error
        })
        console.log('msglog: ')
        console.log(msglog)
        msglog = undefined
        if (obs != undefined) {
            console.log('disconnecting.........')
            obs.disconnect()
        }
    }

    let obsMSG = new MutationObserver(callbackMSG);
    obsMSG.observe($("#chatComponent")[0], {
        subtree: true, childList: true, characterData: true, attributes: true,
        attributeOldValue: true, characterDataOldValue: true
    });
    obsMSG.disconnect()
    let newInsertFragment = false
    let obsChatLog = new MutationObserver(function (list, obs) {
        console.log('observing chatlog')
        console.log(list)
        console.log('newInsertFragment: ' + newInsertFragment)

        if (list.length === 5 &&
            list[0].type === 'childList' &&
            list[1].type === 'childList' &&
            list[2].type === 'childList' &&
            list[3].type === 'attributes' &&
            list[3].attributeName === 'class' &&
            list[3].oldValue === 'fragment hide' &&
            list[4].type === 'attributes' &&
            list[4].attributeName === 'aria-hidden') {
            console.log('type 1 full update')
            newInsertFragment = true
        }

        if (list.length === 4 &&
            list[0].type === 'attributes' &&
            list[1].type === 'attributes' &&
            list[2].type === 'attributes' &&
            list[3].type === 'attributes' &&
            list[0].attributeName === 'class' &&
            list[1].attributeName === 'aria-hidden' &&
            list[2].attributeName === 'class' &&
            list[3].attributeName === 'aria-hidden' &&
            list[0].oldValue === 'fragment' &&
            list[2].oldValue === 'fragment hide') {
            console.log('type 2 lite update')
            newInsertFragment = false
            reportChatLog(obs)
        }

        if (newInsertFragment && list.length < 50) {
            for (let i in list) {
                if (list[i].type === 'attributes' &&
                    list[i].attributeName === 'class' &&
                    list[i].oldValue.includes('swx-in-viewport') &&
                    list[i].target.classList.contains('swx-in-viewport')) {
                    console.log('chat log update finished?')
                    newInsertFragment = false
                    reportChatLog(obs)
                    break
                }

            }
        }
    })


    // 等待win发来消息
    core.WebReply((key, arg) => {
        return new Promise((resolve, reject) => {
            //  收到消息进行处理
            if (key == 'queryDialog') {
                // 查询Dialog
                let userID = arg.userID
                console.log("debug : userID : ", userID)
                let target = document.querySelector('[data-user-i-d="' + userID + '"]')
                if (target.classList.contains('active')) {
                    reportChatLog(undefined)
                } else {
                    obsChatLog.observe(document.querySelector('.fragmentsContainer'), {
                        subtree: true, childList: true, attributes: true, attributeOldValue: true
                    })
                    target.click()
                }
                resolve("copy the query. Please wait...")
            } else if (key == 'sendDialog') {


                console.log("--------sendDialog---")
                //检查
                if (!$("a[data-user-i-d='" + arg[0] + "']").hasClass("active")) {

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

                        $('#chatInputAreaWithQuotes').val(value)

                        let e = $.Event("keydown", { keyCode: 64 }); //64没有对应按键
                        $("#chatInputAreaWithQuotes").trigger(e);

                        let obsSend = new MutationObserver((mutationList, observer) => {
                            $('div.send-button-holder button').click()

                            console.log("---text---")
                            waitSend(arrayValue, index)

                            observer.disconnect()
                        });
                        obsSend.observe($('div.send-button-holder button')[0], {
                            subtree: false, childList: false, characterData: false, attributes: true,
                            attributeOldValue: false, characterDataOldValue: false
                        });

                    } else {
                        core.WebToHost({ "attachFile": { "selector": "input.fileInput", "file": value } }).then((resHost) => {
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
                            if (addedNodes && addedNodes[0].nodeName == "SWX-MESSAGE") {
                                console.log('---addedNodes----')
                                observer.disconnect()

                                let obsFinished = new MutationObserver((mList, obs) => {
                                    console.log('-------obs update--------')
                                    console.log(mList)
                                    console.log("DeliveryStatus update : ", $('swx-message.me span.DeliveryStatus-status').last().text())
                                    if ($('swx-message.me span.DeliveryStatus-status').last().text() == 'Sent') {
                                        obs.disconnect()
                                        send(arrayValue, index + 1)
                                    }
                                })

                                obsFinished.observe($('swx-message.me span.DeliveryStatus-status').last()[0], {
                                    // obsFinished.observe($('swx-message.me div.DeliveryStatus:not(.hide)').last()[0], {
                                    subtree: true, childList: true, characterData: true, attributes: true,
                                    attributeOldValue: false, characterDataOldValue: false
                                });

                            }
                        })

                    })
                    obsSwxUpdated.observe($("div.messageHistory")[0], {
                        subtree: false, childList: true, characterData: false, attributes: false,
                        attributeOldValue: false, characterDataOldValue: false
                    })

                }

                // 开始发送消息
                send(arg, 1)

            } else if (key == 'queryLogStatus') {
                resolve(logStatus )
            } else {
                reject("unknown key : ", key)
            }
        })
    })
}