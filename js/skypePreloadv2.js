/*************************************
notice : Because Skype overload console function in vender.js,
'console.info' should be used, instead of 'console.log'
**************************************/

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

Object.defineProperty(navigator, 'platform', {
    value: 'Win32',
    configurable: false,
    writable: false,
})

Object.defineProperty(navigator, 'appVersion', {
    value: '5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) WhatsApp/0.3.1475 Chrome/66.0.3359.181 Electron/3.0.0 Safari/537.36',
    configurable: false,
    writable: false,
})

Object.defineProperty(navigator, 'userAgent', {
    value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) WhatsApp/0.3.1475 Chrome/66.0.3359.181 Electron/3.0.0 Safari/537.36',
    configurable: false,
    writable: false,
})
// *********************************************

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

    class chatMSG {
        constructor(type, msgID, from, time, message) {
            this.type = type
            this.msgID = msgID
            this.from = from
            this.time = time
            this.message = message
        }
        /**
         * 从每个消息中抓取信息
         * @param {Element} node <div role='region' ...>
         * @param {String} userID convo的userID
         */
        extract(node, userID) {
            this.msgID = $(node).attr("msgID")

            if ($(node).attr("aria-label")) {
                if ($(node).find(" > div > div ").css("justify-content") == 'flex-start') {
                    // 左侧
                    let indexSplitName = ($(node).attr("aria-label")).lastIndexOf(',')
                    this.from = $(node).attr("aria-label").substr(0, indexSplitName)
                } else {
                    this.from = undefined
                }
            } else {
                // 特殊消息
            }

        }
    }

    function uniqueStr() {
        return Math.random().toString().slice(2, 5) + Date.now().toString()
    }

    /**
     * 将skype格式的时间, 转化为timestamp
     * - 20:40 , 8:03 AM
     * - Fri
     * - 2019/3/3
     * @param {String} strTime 
     * @returns {Int} Timestamp
     */
    function tranSkypeTime(strTime) {
        // console.info("time : " ,strTime)
        let timeStamp = 0
        if (strTime.indexOf(':') >= 0) {
            let timeArray = strTime.split(':')
            // console.info('type1 ', strTime.indexOf(':') , timeArray, )
            let time = new Date(Date.now())
            if (timeArray[1].indexOf('PM') >= 0) {
                console.log(parseInt(timeArray[0]) + 12)
                time.setHours(parseInt(timeArray[0]) + 12)
                time.setMinutes(timeArray[1].slice(0, -3))
            } else if (timeArray[1].indexOf('AM') >= 0) {
                time.setHours(timeArray[0])
                time.setMinutes(timeArray[1].slice(0, -3))
            } else {
                time.setHours(timeArray[0])
                time.setMinutes(timeArray[1])
            }


            timeStamp = time.getTime()
            // console.info(time.getTime())

        } else if (strTime.indexOf('/') >= 0
            || strTime.indexOf(',') >= 0) {
            let time = new Date(Date.parse(strTime))
            timeStamp = time.getTime()
        } else {
            let time = new Date(Date.now())
            time.setHours(0)
            time.setMinutes(0)

            // Sunday - Saturday : 0 - 6
            let today = time.getDay()
            let msgDay = 0
            if (strTime == 'Sun' || strTime == 'Sunday') {
                msgDay = 0
            } else if (strTime == 'Mon' || strTime == 'Monday') {
                msgDay = 1
            } else if (strTime == 'Tue' || strTime == 'Tuesday') {
                msgDay = 2
            } else if (strTime == 'Wed' || strTime == 'Wednesday') {
                msgDay = 3
            } else if (strTime == 'Thu' || strTime == 'Thursday') {
                msgDay = 4
            } else if (strTime == 'Fri' || strTime == 'Friday') {
                msgDay = 5
            } else if (strTime == 'Sat' || strTime == 'Saturday') {
                msgDay = 6
            } else if (strTime == 'Yesterday') {
                msgDay = today - 1
            } else if (strTime == 'Today') {
                msgDay = today
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
     * 修改date对应的具体时间
     * @param {} date 
     * @param {*} strClock 6:02:53 AM
     */
    function modifyClockOfDate(date, strClock) {

        console.info('--------')
        console.info(date, strClock)
        let time = new Date(date)

        let timeArray = strClock.split(':')
        console.info(timeArray, timeArray.length)
        if (timeArray.length == 2) {
            console.info('2 : ', timeArray[1].indexOf('PM') >= 0)
            if (timeArray[1].indexOf('PM') >= 0) {

                time.setHours(parseInt(timeArray[0]) + 12)
                time.setMinutes(timeArray[1].slice(0, -3))
            } else if (timeArray[1].indexOf('AM') >= 0) {
                time.setHours(timeArray[0])
                time.setMinutes(timeArray[1].slice(0, -4))
            } else {
                time.setHours(timeArray[0])
                time.setMinutes(timeArray[1])
            }
        } else {
            console.info('3 : ', timeArray[2].indexOf('PM') >= 0)
            if (timeArray[2].indexOf('PM') >= 0) {
                // console.log(parseInt(timeArray[0]) + 12)
                time.setHours(parseInt(timeArray[0]) + 12)
                time.setMinutes(timeArray[1])
                time.setMilliseconds(timeArray[2].slice(0, -3))
            } else if (timeArray[2].indexOf('AM') >= 0) {
                time.setHours(timeArray[0])
                time.setMinutes(timeArray[1])
                time.setMilliseconds(timeArray[2].slice(0, -3))
            } else {
                time.setHours(timeArray[0])
                time.setMinutes(timeArray[1])
                time.setMilliseconds(timeArray[2])
            }
        }
        console.info(time)
        return time.getTime()
        // console.info(time.getTime())

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
     * 登录后, preload主体函数, 用来抓取左侧和右侧消息
     */
    function runMain() {

        // 先读取一遍, 然后再obser. 
        // 因为observe抓不到刚登录时候的变化
        tranConvoByID(
            $.map($("[role=button][id^=rx-vlv-]"), function (convo) {
                return $(convo).attr("id");
            })
        ).forEach(convo => {
            if (convo.counter > 0) {
                // 判断counter有没有发生变化
                convo.action = 'a'
                convo.print()
                convo.send()
            }
        })

        let callbackConvo = function (mutationList, observer) {
            // console.info("debug : ===========convo============")
            // console.info(mutationList)
            let convoIDList = new Array()
            let counterList = new Array() // 记录counter发生了变化

            mutationList.forEach((mutation, index) => {

                let objConvo = $(mutation.target).closest("[role=button][id^=rx-vlv-]")
                if ($(objConvo).length > 0) {
                    // console.info( "------") 
                    // console.info(objConvo)           
                    // console.info(mutation)
                    // console.info("debug : ", "obs target : ")
                    // console.info(mutation.target)
                    let userID = $(objConvo).attr("id")
                    if (!convoIDList.includes(userID)) {
                        convoIDList.push(userID)
                    }
                    // console.info($("#" + userID + "> div > div > div:nth-child(3)"))
                    // console.info($.contains($("#" + userID + "> div > div > div:nth-child(3)").get(0), mutation.target))
                    // console.info($("#" + userID + "> div > div > div:nth-child(3)").get(0) == $(mutation.target))
                    if ($.contains($("#" + userID + "> div > div > div:nth-child(3)").get(0), mutation.target)) {
                        // 消息数变化
                        if (!counterList.includes(userID)) {
                            counterList.push(userID)
                        }
                    } else if ($("#" + userID + "> div > div > div:nth-child(3)").get(0) == mutation.target
                        && (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0)) {
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
                if (counterList.includes(convo.userID)) {
                    convo.action = 'a'
                    convo.print()
                    convo.send()
                }
            })
        }
        let obsConvo = new MutationObserver(callbackConvo);
        // 
        obsConvo.observe($("div.rxCustomScroll.rxCustomScrollV:not(.neutraloverride) > div > div > div")[0], {
            subtree: true, childList: true, characterData: true, attributes: true,
            attributeFilter: ["data-text-as-pseudo-element"], attributeOldValue: false, characterDataOldValue: false
        });

    }

    function getNickNameByUserID(userID) {
        return $($("#" + userID + " > div > div > div:get(2)")
            .find("[data-text-as-pseudo-element]").get(0))
            .attr("data-text-as-pseudo-element") //名字和消息
    }

    /**
     * 给右侧消息添加MsgID
     */
    function addMsgID() {
        $("div[role=region]:not([msgID])").each((index, element) => {
            let nodeBubble = $(element).find(" > div > div")
            if ($(nodeBubble).length > 0
                && $(nodeBubble).css("justify-content")
                && ($(nodeBubble).css("justify-content") == 'flex-start' || $(nodeBubble).css("justify-content") == 'flex-end')) {
                $(element).attr("msgID", uniqueStr())
            }
        })
    }

    /**
    * 给右侧消息添加时间戳
    */
    function addMsgTime() {
        let date = undefined
        let timeLast = undefined //储存上一条Bubble时间

        $("div[role=region]").each((index, element) => {


            if ($(element).find("> div[role='heading']").length > 0) {
                // 日期格式有问题
                let dateStrLocal = $(element).find("> div[role='heading']").attr("aria-label");
                let dayList = ['Today', 'Yesterday', 'Sunday', 'Monday', 'Tuesday', 'Wednsday', 'Thursday', 'Friday', 'Saturday']
                if (dayList.indexOf(dateStrLocal.split(',')[0]) != -1) { //排除非日期格式 : unread...
                    date = tranSkypeTime(dateStrLocal)
                }

            }

            let nodeBubble = $(element).find(" > div > div")
            if (date
                && $(nodeBubble).length > 0
                && $(nodeBubble).css("justify-content")
                && ($(nodeBubble).css("justify-content") == 'flex-start' || $(nodeBubble).css("justify-content") == 'flex-end')
                && $(element).attr("aria-label")) {
                let time = $(element).attr("aria-label")
                    .slice(
                        $(element).attr("aria-label").lastIndexOf('at') + 3, -1) // c4r Team, aaa, sent at 1:57 PM.
                // let msgTime = new Date(date)
                // modifyClockOfDate(date, time)
                if (timeLast) {
                    let timeCurrent = modifyClockOfDate(date, time)
                    if (timeLast >= timeCurrent) {
                        timeCurrent = timeLast + 1
                    }
                    $(element).attr("time", timeCurrent)
                    timeLast = timeCurrent
                } else {
                    let timeCurrent = modifyClockOfDate(date, time)
                    $(element).attr("time", timeCurrent)
                    timeLast = timeCurrent
                }

            }

        })
    }

    /**
     * 右侧聊天窗已经点开, 爬取bubble
     */
    function runGrepRightBubble() {

        // 添加id
        addMsgID()

        // 添加时间戳
        addMsgTime()


        // let msgArray = new Array()
        // $("div[role=region][aria-label]").each((index, element) => {
        //     let nodeBubble = $(element).find(" > div > div")
        //     if ($(nodeBubble).length > 0
        //         && $(nodeBubble).css("justify-content")
        //         && ($(nodeBubble).css("justify-content") == 'flex-start' || $(nodeBubble).css("justify-content") == 'flex-end')) {
        //         let msg = new chatMSG()
        //         msg.extract(element, userID)
        //         msgArray.push(msg)
        //     }
        // })        
    }

    $(document).ready(function () {
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
                    runMain()

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

        if (document.getElementById("i0281") || document.getElementById("forgotUsername")) {
            logStatus.status = "offline"
            console.info("********************offline***************************************")
            core.WebToHost({ "logStatus": logStatus })
            core.WebToHost({ "show": {} })
        }
    })

    //========================
    // 等待win发来消息
    core.WebReply((key, arg) => {
        return new Promise((resolve, reject) => {
            //  收到消息进行处理
            console.info('WebReply : ', key)
            if (key == 'queryDialog') {

                if (logStatus.status == 'online') {
                    // 查询Dialog
                    let userID = arg.userID
                    console.info("debug : userID : ", userID, $('[aria-label="Find"]').length)
                    // let target = $("#" + userID)
                    let convo = new conversation()
                    convo.extractById(userID)
                    console.info(convo.nickName)

                    // if ($('[aria-label="Find"]').length == 0 || $("#" + userID).attr('tabindex') == '-1') {
                    if ($("button[role='button'][title='" + convo.nickName + "']").length == 0) {
                        console.info("debug : 点击")
                        $("#" + userID + " > div > div").click()

                        // 等待加载右侧
                        let callbackRight = function (mutationList, observer) {
                            if ($("div.DraftEditor-editorContainer").length > 0 && $("button[role='button'][title='" + convo.nickName + "']").length > 0) {

                                // 爬取右侧
                                runGrepRightBubble()

                                observer.disconnect()
                            }
                        }
                        let obsRight = new MutationObserver(callbackRight);
                        obsRight.observe($('div.app-cotainer')[0], {
                            subtree: true, childList: true, characterData: true, attributes: true,
                            attributeOldValue: false, characterDataOldValue: false
                        });

                    } else {
                        // 直接爬取
                        runGrepRightBubble()
                    }

                    resolve("copy the query. Please wait...")
                }


                reject("skype not online.")


            } else if (key == 'sendDialog') {


                console.info("--------sendDialog---")
                //检查


            } else if (key == 'queryLogStatus') {
                resolve(logStatus)
            } else if (key == 'logoff') {
                if (logStatus.status == 'online') {
                    console.info('logoff')
                    console.info($("button[aria-label='Sign out']").length)
                    if ($("button[aria-label='Sign out']").length == 0) {
                        $('button[aria-label="More options"]').click()
                    }
                    setTimeout(() => {
                        $("button[aria-label='Sign out']").click()
                        setTimeout(() => {
                            $("button[aria-label='Sign out']").click()
                        }, 500);
                    }, 500);


                    resolve("wechat log off")
                } else {
                    resolve('wechat already logoff')
                }
            } else {
                reject("unknown key : ", key)
            }
        })
    })
}