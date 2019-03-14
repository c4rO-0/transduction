window.onload = function () {
    console.log("runing skype preload")
    // console.log(process.versions.electron)
    // console.log(process.env.PWD)
    // console.log(process.cwd())
    window.$ = window.jQuery = require("../toolkit/jquery-3.3.1.min.js")
    const core = require("../js/core")

    let logStatus = { "status": "offline" }

    // 检查登录状态
    if (document.getElementById("signInName")) {
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


    // class conversation {
    //     constructor(action, userID, nickName, timestamp, avatar, message, counter, index, muted) {
    //         this.action = action
    //         this.userID = userID
    //         this.nickName = nickName
    //         this.timestamp = timestamp
    //         this.avatar = avatar
    //         this.message = message
    //         this.counter = counter
    //         this.index = index
    //         this.muted = muted
    //     }
    //     print() {
    //         for (let property in this) {
    //             console.log(property + ": " + this[property])
    //         }
    //     }
    //     /**
    //      * 发送消息到Win
    //      */
    //     send() {
    //         core.WebToHost({
    //             "Convo-new":
    //             {
    //                 "userID": this.userID,
    //                 "time": this.timestamp,
    //                 "message": this.message,
    //                 "nickName": this.nickName,
    //                 "avatar": this.avatar,
    //                 "counter": this.counter,
    //                 "action": this.action,
    //                 "muted": this.muted,
    //                 "index": this.index
    //             }

    //         }).then((res) => {
    //             console.log("debug : ---Win reply---")
    //             console.log(res)
    //         }).catch((error) => {
    //             throw error
    //         });
    //     }
    //     extractAll(aNode) {
    //         // this.action=
    //         console.log(aNode)
    //         this.userID = aNode.dataset.userID
    //         this.nickName = aNode.querySelector('h4 > span.topic').title
    //         this.timestamp = Date.now()
    //         this.avatar = aNode.querySelector('img.Avatar-image').src
    //         this.message = aNode.querySelector('div.message > p').innerHTML.replace(/<[^<>]*>/gm, '')
    //         this.counter = parseInt(aNode.querySelector('span.circle > p').innerText)
    //         this.index = Array.prototype.indexOf.call(
    //             aNode.closest('div.recents.scrollViewport-inner').querySelectorAll(
    //                 'swx-recent-item.list-selectable'),
    //             aNode.closest('swx-recent-item.list-selectable'))
    //         this.muted = false
    //     }
    //     extract(aNode, property) {
    //         console.log(aNode)
    //         this.userID = aNode.dataset.userID
    //         if (property === 'nickName') {
    //             this.nickName = aNode.querySelector('h4 > span.topic').title
    //         } else if (property === 'avatar') {
    //             this.avatar = aNode.querySelector('img.Avatar-image').src
    //         } else if (property === 'message') {
    //             this.message = aNode.querySelector('div.message > p').innerHTML.replace(/<[^<>]*>/gm, '')
    //         }
    //     }
    // }

    // class chatLog {
    //     constructor(type, msgID, from, time, message) {
    //         this.type = type
    //         this.msgID = msgID
    //         this.from = from
    //         this.time = time
    //         this.message = message
    //     }
    //     extractAll(aNode) {
    //         // 各种类型的信息应该都在div.content里，正常是p，图片是p.PictureSharing，
    //         // 联系人是<span>+<div.contactslist>，文件是p.FileTransfer.扩展名
    //         // 所以正确的逻辑应该是寻找div.content然后判断内部内容
    //         // 来自对方的消息 swx-message.their 自己的消息 swx-message.me
    //         // url是 div.messageTextWrapper>p.urlPreviewText>a
    //         this.msgID = aNode.dataset.id
    //         this.time = parseInt(aNode.dataset.id)
    //         if (aNode.classList.contains('their') &&
    //             aNode.querySelector('swx-name')) {
    //             this.from = aNode.querySelector('swx-name').innerHTML.replace(/<[^<>]*>/gm, '').trim()
    //         } else {
    //             this.from = undefined
    //         }
    //         if (aNode.classList.contains('picture') &&
    //             aNode.querySelector('div.content > p.PictureSharing > a')) {
    //             console.log('found img')
    //             this.type = 'img'
    //             this.message = aNode.querySelector('div.content > p.PictureSharing > a').href
    //         } else if (aNode.classList.contains('urlPreview') &&
    //             aNode.querySelector('div.content p.urlPreviewText > a')) {
    //             console.log('found url')
    //             this.type = 'url'
    //             this.message = aNode.querySelector('div.content p.urlPreviewText > a').href
    //         } else if (aNode.classList.contains('urlPreview') &&
    //             aNode.querySelector('div.content a.thumbnail')) {
    //             console.log('found url')
    //             this.type = 'url'
    //             this.message = aNode.querySelector('div.content a.thumbnail').href
    //         } else if (aNode.classList.contains('text') &&
    //             aNode.querySelector('div.content > p')) {
    //             console.log('found text')
    //             this.type = 'text'
    //             this.message = aNode.querySelector('div.content > p').innerHTML.replace(/<[^<>]*>/gm, '')
    //         } else {
    //             console.log('found unknown')
    //             this.type = 'unknown'
    //             this.message = aNode.querySelector('div.content').innerHTML.replace(/<!--[\s\S]*?-->/gm, '').replace(/<[^<>]*>/gm, '').trim()
    //         }
    //     }
    // }

    function uniqueStr() {
        return Math.random().toString().slice(2, 5) + Date.now().toString()
    }

}