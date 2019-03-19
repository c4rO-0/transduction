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
                console.info(property + ": " + this[property])
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
                console.info("debug : ---Win reply---")
                console.info(res)
            }).catch((error) => {
                throw error
            });
        }
        /**
         * 从...的target中爬取到convo信息
         * @param {String} userID 
         */
        extractById(userID) {

            this.userID = userID


            let parts = $("#" + userID + " > div > div > div")

            if ($(parts).length == 3) {
                // console.info($(parts).get(0))
                //     // 0 为头像, 1 为中间(名字和消息), 2 为时间和未读数
                let objAvatar = $(parts).get(0)
                // console.info($(objAvatar).find("[data-text-as-pseudo-element]").length)
                if ($(objAvatar).find("[data-text-as-pseudo-element]").length > 0) {
                    this.avatar = undefined
                } else {
                    // console.info($(objAvatar).find("> div"))
                    this.avatar = ($(objAvatar).find("> div").css("background-image")).slice(5, -2)
                }
                // console.info(this.avatar)

                let objMiddle = $(parts).get(1) //名字和消息
                this.nickName = $($(objMiddle).find("[data-text-as-pseudo-element]").get(0)).attr("data-text-as-pseudo-element")
                this.message = $(objMiddle).text()
                // console.info(this.nickName, this.message)

                let objRight = $($(parts).get(2)).find("[data-text-as-pseudo-element]") //时间和未读数
                if ($(objRight).length == 2) {
                    // 有时间和未读
                    this.counter = parseInt($($(objRight).get(1)).attr("data-text-as-pseudo-element"))
                    let timeStr = $($(objRight).get(0)).attr("data-text-as-pseudo-element")

                    if (timeStr == '') {
                        this.timestamp = undefined
                    } else {
                        this.timestamp = tranSkypeTime(timeStr)
                    }
                    // console.info('time : ', timeStr, new Date(this.timestamp))
                } else {
                    // 没有未读
                    this.counter = 0
                    let timeStr = $($(objRight).get(0)).attr("data-text-as-pseudo-element")

                    if (timeStr == '') {
                        this.timestamp = undefined
                    } else {
                        this.timestamp = tranSkypeTime(timeStr)
                    }
                    // console.info('time : ', timeStr, new Date(this.timestamp))

                }
                // console.info(this.counter, this.timestamp)

            }

            if (this.counter > 0) {
                this.action = 'a'
            } else {
                this.action = 'c'
            }

            this.muted = false
            this.index = $("div.rxCustomScroll.rxCustomScrollV:not(.neutraloverride) > div > div > div > div").index($("#" + userID))

        }
    }

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

    /**
     * 将skype格式的时间, 转化为timestamp
     * - 20:40
     * - Fri
     * - 2019/3/3
     * @param {String} strTime 
     */
    function tranSkypeTime(strTime) {

        let timeStamp = 0
        if (strTime.indexOf(':') >= 0) {
            let timeArray = strTime.split(':')
            // console.info('type1 ', strTime.indexOf(':') , timeArray, )
            let time = new Date(Date.now())
            time.setHours(timeArray[0])
            time.setMinutes(timeArray[1])

            timeStamp = time.getTime()
            // console.info(time.getTime())

        } else if (strTime.indexOf('/') >= 0) {
            let timeArray = strTime.split('/')
            // console.info('type2 ', strTime.indexOf('/'), timeArray)
            let time = new Date(Date.now())
            time.setFullYear(timeArray[0])
            time.setMonth(parseInt(timeArray[1]) - 1)
            time.setDate(timeArray[2])
            time.setHours(0)
            time.setMinutes(0)

            timeStamp = time.getTime()
        } else {
            let time = new Date(Date.now())
            time.setHours(0)
            time.setMinutes(0)

            // Sunday - Saturday : 0 - 6
            let today = time.getDay()
            let msgDay = 0
            if (strTime == 'Sun') {
                msgDay = 0
            } else if (strTime == 'Mon') {
                msgDay = 1
            } else if (strTime == 'Tue') {
                msgDay = 2
            } else if (strTime == 'Wed') {
                msgDay = 3
            } else if (strTime == 'Thu') {
                msgDay = 4
            } else if (strTime == 'Fri') {
                msgDay = 5
            } else if (strTime == 'Sat') {
                msgDay = 6
            }
            if (msgDay > today) { // 上周
                timeStamp = (new Date(time.getTime() - (7 - (msgDay - today)) * 24 * 60 * 60 * 1000)).getTime()
            } else {
                timeStamp = (new Date(time.getTime() - (today - msgDay) * 24 * 60 * 60 * 1000)).getTime()
            }
        }

        return timeStamp
    }

    /**
     * 传入convo的userID, 转化为conversition
     * @param {Array(String)} convoIDList 
     * @returns {Array(conversation)}
     */
    function tranConvoByID(convoIDList) {
        let convoList = new Array()

        convoIDList.forEach(userID => {
            let convo = new conversation()
            convo.extractById(userID)

            convoList.push(convo)
        });

        return convoList
    }

    // ==================================================
    /**
     * 登录后, 爬虫脚本, 用来抓取左侧和右侧消息
     */
    function runCrawler() {

        let callbackConvo = function (mutationList, observer) {
            // console.info("debug : ===========convo============")
            // console.info(mutationList)
            let convoIDList = new Array()
            let counterList = new Array() // 记录counter发生了变化
            
            mutationList.forEach((mutation,index) => {

                let objConvo = $(mutation.target).closest("[id^=rx-vlv-]")
                if ($(objConvo).length > 0) {
                    // console.info( "------") 
                    // console.info(objConvo)           
                    // console.info("debug : ", "obs type : ", mutation.type)
                    // console.info("debug : ", "obs target : ")
                    // console.info(mutation.target)
                    let userID = $(objConvo).attr("id")
                    if (!convoIDList.includes(userID)) {
                        convoIDList.push(userID)
                    }
                    console.info($("#" + userID + "> div > div > div:nth-child(3)"))
                    console.info($.contains($("#" + userID + "> div > div > div:nth-child(3)").get(0),mutation.target))
                    console.info($("#" + userID + "> div > div > div:nth-child(3)").get(0) == $(mutation.target))
                    if($.contains($("#" + userID + "> div > div > div:nth-child(3)").get(0),mutation.target)){
                        // 消息数变化
                        if (!counterList.includes(userID)) {
                            counterList.push(userID)
                        }
                    }else if($("#" + userID + "> div > div > div:nth-child(3)").get(0) == mutation.target
                    && (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)){
                        // 新添未读/ 删除未读
                        if (!counterList.includes(userID)) {
                            counterList.push(userID)
                        }                        
                    }
                }


                if (mutation.removedNodes.length > 0) {
                    // 有节点被删除
                    // console.info($(mutation.removedNodes))     
                    // mutation.removedNodes.forEach(node =>{
                    //     // 判断删除的节点
                    // })
                }
            })
            // console.info(convoIDList)
            let convoList = tranConvoByID(convoIDList)
            convoList.forEach(convo => {
                
                // 判断counter有没有发生变化
                if (counterList.includes(convo.userID) ) {
                    convo.action = 'a'
                    // convo.print()
                    convo.send()
                }
            })
        }
        let obsConvo = new MutationObserver(callbackConvo);
        obsConvo.observe($("div.rxCustomScroll.rxCustomScrollV:not(.neutraloverride):not(.active) > div > div > div")[0], {
            subtree: true, childList: true, characterData: true, attributes: true,
            attributeFilter: ["data-text-as-pseudo-element"], attributeOldValue: false, characterDataOldValue: false
        });
    }

    // 检查登录状态
    // - 登陆了
    if (document.getElementById("signInName")) {

        console.info("=======================online=====================================")

        // 观察整个body, 等待skype页面加载完成(否则skype会报错)
        let callbackBody = function (mutationList, observer) {
            if ($("div.scrollViewport.scrollViewportV").length > 0) {

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
                let userID = arg.userID
                console.info("debug : userID : ", userID)
                let target = $("#" + userID)
                // if (target.classList.contains('active')) {
                //     reportChatLog(undefined)
                // } else {
                //     obsChatLog.observe(document.querySelector('.fragmentsContainer'), {
                //         subtree: true, childList: true, attributes: true, attributeOldValue: true
                //     })
                $("#" + userID + " > div > div").click()
                // }
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