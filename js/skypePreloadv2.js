/*************************************
notice : Because Skype overload console function in vender.js,
'console.info' should be used, instead of 'console.log'
**************************************/

window.onload = function () {
    console.info("runing skype preload------------------------>")
    // console.info(process.versions.electron)
    // console.info(process.env.PWD)
    // console.info(process.cwd())
    window.$ = window.jQuery = require("../toolkit/jquery-3.3.1.min.js")
    const core = require("../js/core")

    let logStatus = { "status": "offline" }

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
    //             console.info(property + ": " + this[property])
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
    //             console.info("debug : ---Win reply---")
    //             console.info(res)
    //         }).catch((error) => {
    //             throw error
    //         });
    //     }
    //     extractAll(aNode) {
    //         // this.action=
    //         console.info(aNode)
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
    //         console.info(aNode)
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
    //             console.info('found img')
    //             this.type = 'img'
    //             this.message = aNode.querySelector('div.content > p.PictureSharing > a').href
    //         } else if (aNode.classList.contains('urlPreview') &&
    //             aNode.querySelector('div.content p.urlPreviewText > a')) {
    //             console.info('found url')
    //             this.type = 'url'
    //             this.message = aNode.querySelector('div.content p.urlPreviewText > a').href
    //         } else if (aNode.classList.contains('urlPreview') &&
    //             aNode.querySelector('div.content a.thumbnail')) {
    //             console.info('found url')
    //             this.type = 'url'
    //             this.message = aNode.querySelector('div.content a.thumbnail').href
    //         } else if (aNode.classList.contains('text') &&
    //             aNode.querySelector('div.content > p')) {
    //             console.info('found text')
    //             this.type = 'text'
    //             this.message = aNode.querySelector('div.content > p').innerHTML.replace(/<[^<>]*>/gm, '')
    //         } else {
    //             console.info('found unknown')
    //             this.type = 'unknown'
    //             this.message = aNode.querySelector('div.content').innerHTML.replace(/<!--[\s\S]*?-->/gm, '').replace(/<[^<>]*>/gm, '').trim()
    //         }
    //     }
    // }

    function uniqueStr() {
        return Math.random().toString().slice(2, 5) + Date.now().toString()
    }


    // ==================================================
    /**
     * 登录后, 爬虫脚本, 用来抓取左侧和右侧消息
     */
    function runCrawler() {

        let callbackConvo = function (mutationList, observer) {
            console.info("left changed")
            mutationList.map(function (mutation) {
                // console.info("debug : ===========convo============")

                
                let objConvo = $(mutation.target).closest("[id^=rx-vlv-]")
                if(objConvo.length > 0){
                    console.info( "------") 
                    console.info(objConvo)           
                    console.info("debug : ", "obs type : ", mutation.type)
                    console.info("debug : ", "obs target : ")
                    console.info(mutation.target)
                }

                if($(mutation.removedNodes).length > 0){
                    // 有节点被删除
                    // console.info($(mutation.removedNodes))      
                }
            })
        }
        let obsConvo = new MutationObserver(callbackConvo);
        obsConvo.observe($("div.scrollViewport.scrollViewportV")[0], {
            subtree: true, childList: true, characterData: true, attributes: true,
            attributeOldValue: true, characterDataOldValue: true
        });
    }

    // 检查登录状态
    // - 登陆了
    if (document.getElementById("signInName")) {
        
        console.info("=======================online=====================================")

        // 观察整个body, 等待skype页面加载完成(否则skype会报错)
        let callbackBody = function (mutationList, observer) {
            if ($("div.app-container").length > 0) {
                
                // 发送登录消息
                logStatus.status = "online"
                core.WebToHost({ "logStatus": logStatus })
                core.WebToHost({ "hide": {} })

                // 运行页面爬虫脚本
                runCrawler()

                observer.disconnect()
            }
        }
        let obsMain = new MutationObserver(callbackBody);
        obsMain.observe(document.body, {
            subtree: true, childList: true, characterData: true, attributes: true,
            attributeOldValue: true, characterDataOldValue: true
        });

    }

    // 没登录
    if (document.getElementById("forgotUsername")) {
        logStatus.status = "offline"
        console.info("********************offline***************************************")
        core.WebToHost({ "logStatus": logStatus })
        core.WebToHost({ "show": {} })
    }

    //========================
    // 等待win发来消息
    core.WebReply((key, arg) => {
        return new Promise((resolve, reject) => {
            //  收到消息进行处理
            if (key == 'queryDialog') {
                // 查询Dialog

                resolve("copy the query. Please wait...")
            } else if (key == 'sendDialog') {


                console.info("--------sendDialog---")
                //检查


            } else if (key == 'queryLogStatus') {
                resolve(logStatus)
            } else {
                reject("unknown key : ", key)
            }
        })
    })
}