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
    
    // ==============================
    // setup transduction environment
    const { app } = require('electron').remote
    let rootDir = app.getAppPath()
    console.log("transduction root directory : ", rootDir )
    console.log('current path : ', __dirname)
    const path = require('path')
    const {tdMessage} = require('td')
    window.$ = window.jQuery = require(path.join(rootDir, "toolkit/jquery-3.3.1.min.js"))
    // -----------------------

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
            tdMessage.WebToHost({
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
         */
        extract(node) {
            this.msgID = $(node).attr("msgID")
            this.time = parseInt($(node).attr("time"))
            this.from = $(node).attr("sender")
            if (this.from === '') {
                this.from = undefined
            }
            this.type = undefined

            let nodeBubble = $(node).find("div[style*='justify-content: flex-start;'], div[style*='justify-content: flex-end;']")
            if ($(nodeBubble).length > 0) {
                if ($(node).attr("aria-label")) {
                    // 图片 , 文字
                    let textObj = $(node).find('> div > div > div > div > div > div > div > div')
                    if ($(textObj).length > 0 && $(textObj).text() != '') {
                        this.type = 'text'
                        this.message = $(textObj).text()
                    }

                    let imgObj = $(node).find("button[role='button'][title='Open image'][aria-label='Open image']")
                    if ($(imgObj).length > 0) { // 图片信息
                        this.type = 'img'
                        this.message = $(imgObj).find('> div > div').css('background-image')
                        if (this.message && this.message.includes('url')) {
                            this.message = this.message.slice(5, -2).replace(/imgpsh_thumbnail_sx/, "imgpsh_mobile_save_anim")

                        }
                    }

                    // 卡片链接
                    let urlCardObj = $(node).find("button[role='button'][aria-label*='sent a website'] > div > div")
                    if ($(urlCardObj).length == 2) { // 没有简介
                        this.type = 'url'
                        this.message = $($(urlCardObj).get(1)).text()
                    } else if ($(urlCardObj).length == 3) { // 有简介
                        this.type = 'url'
                        this.message = $($(urlCardObj).get(2)).text()
                    }

                    let urlObj = $(node).find("a[href]")
                    if ($(urlObj).length > 0) {
                        this.type = 'url'
                        this.message = $(urlObj).attr('href')
                    }



                } else {
                    // 奇怪的消息类型

                }
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
                if (parseInt(timeArray[0]) == 12) {
                    time.setHours(12)
                } else {
                    time.setHours(parseInt(timeArray[0]) + 12)
                }

                time.setMinutes(timeArray[1].slice(0, -3))
            } else if (timeArray[1].indexOf('AM') >= 0) {
                if (parseInt(timeArray[0]) == 12) {
                    time.setHours(0)
                } else {
                    time.setHours(timeArray[0])
                }

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

        // console.info('--------')
        // console.info(date, strClock)
        let time = new Date(date)

        let timeArray = strClock.split(':')
        // console.info(timeArray, timeArray.length)
        if (timeArray.length == 2) {
            // console.info('2 : ', timeArray[1].indexOf('PM') >= 0)
            if (timeArray[1].indexOf('PM') >= 0) {
                if (parseInt(timeArray[0]) == 12) {
                    time.setHours(12)
                } else {
                    time.setHours(parseInt(timeArray[0]) + 12)
                }
                time.setMinutes(timeArray[1].slice(0, -3))
            } else if (timeArray[1].indexOf('AM') >= 0) {
                if (parseInt(timeArray[0]) == 12) {
                    time.setHours(0)
                } else {
                    time.setHours(timeArray[0])
                }
                time.setMinutes(timeArray[1].slice(0, -3))
            } else {
                time.setHours(timeArray[0])
                time.setMinutes(timeArray[1])
            }
        } else {
            // console.info('3 : ', timeArray[2].indexOf('PM') >= 0)
            if (timeArray[2].indexOf('PM') >= 0) {
                // console.log(parseInt(timeArray[0]) + 12)
                if (parseInt(timeArray[0]) == 12) {
                    time.setHours(12)
                } else {
                    time.setHours(parseInt(timeArray[0]) + 12)
                }
                time.setMinutes(timeArray[1])
                time.setMilliseconds(timeArray[2].slice(0, -3))
            } else if (timeArray[2].indexOf('AM') >= 0) {
                if (parseInt(timeArray[0]) == 12) {
                    time.setHours(0)
                } else {
                    time.setHours(timeArray[0])
                }
                time.setMinutes(timeArray[1])
                time.setMilliseconds(timeArray[2].slice(0, -3))
            } else {
                time.setHours(timeArray[0])
                time.setMinutes(timeArray[1])
                time.setMilliseconds(timeArray[2])
            }
        }
        // console.info(time)
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



        let callbackAddConvo = function (mutationList, observer) {
            let convoIDList = new Array()

            mutationList.forEach((mutation, index) => {

                if ($(mutation.target).attr('tabindex') == 0 && mutation.oldValue != null && (!mutation.oldValue.includes('background-color')) && $(mutation.target).find('>div>div').attr('style').includes('background-color')) {
                    let objConvo = $(mutation.target)
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
                    }


                }
            })
            let convoList = tranConvoByID(convoIDList)
            convoList.forEach(convo => {

                convo.action = 'a'
                convo.print()
                convo.send()

            })

            // console.info("style changed")
        }
        let obsAddConvo = new MutationObserver(callbackAddConvo);
        // 
        obsAddConvo.observe($("div.rxCustomScroll.rxCustomScrollV:not(.neutraloverride) > div > div > div")[0], {
            subtree: true, childList: true, characterData: false, attributes: true,
            attributeFilter: ["style"], attributeOldValue: true, characterDataOldValue: false
        });

    }

    // function getNickNameByUserID(userID) {
    //     return $($("#" + userID + " > div > div > div:get(2)")
    //         .find("[data-text-as-pseudo-element]").get(0))
    //         .attr("data-text-as-pseudo-element") //名字和消息
    // }

    /**
     * 给右侧消息添加MsgID
     */
    function addMsgID() {
        // console.info("add MsgID")
        $("div[role=region]:not([msgID])").each((index, element) => {
            let nodeBubble = $(element).find("div[style*='justify-content: flex-start;'], div[style*='justify-content: flex-end;']")
            if ($(nodeBubble).length > 0) {
                $(element).attr("msgID", uniqueStr())
            }
        })
    }

    // Sheng Bi, aa222 , sent at 10:37 PM. This message was edited. c4r reacted with a yes.
    // c4r Team sent a photo at 12:41 AM.
    function getTimeFromSkypeAria(str) {
        let posAt = str.lastIndexOf('at') + 3
        let posEnd = str.indexOf('.', posAt)

        return str.slice(posAt, posEnd)
    }

    /**
    * 给右侧消息添加时间戳
    */
    function addMsgTime() {
        // console.info("add Time")
        let date = undefined
        let timeLast = undefined //储存上一条Bubble时间


        // // 先扫一遍, 防止一个时间都没有
        $("div[role=region]").each((index, element) => {
            if ($(element).find("> div[role='heading']").length > 0) {
                // 日期格式有问题
                let dateStrLocal = $(element).find("> div[role='heading']").attr("aria-label");
                let dayList = ['Today', 'Yesterday', 'Sunday', 'Monday', 'Tuesday', 'Wednsday', 'Thursday', 'Friday', 'Saturday']
                if (dayList.indexOf(dateStrLocal.split(',')[0]) != -1) { //排除非日期格式 : unread...

                    date = tranSkypeTime(dateStrLocal)

                }

            }
        })

        if (date == undefined) {
            // 可能存在问题 准确日期应该从
            // $('.reactxp-ignore-pointer-events button div[data-text-as-pseudo-element]')

            date = Date.now()

            // return
        }

        $("div[role=region]").each((index, element) => {


            if ($(element).find("> div[role='heading']").length > 0) {
                // 日期格式有问题
                let dateStrLocal = $(element).find("> div[role='heading']").attr("aria-label");
                let dayList = ['Today', 'Yesterday', 'Sunday', 'Monday', 'Tuesday', 'Wednsday', 'Thursday', 'Friday', 'Saturday']
                if (dayList.indexOf(dateStrLocal.split(',')[0]) != -1) { //排除非日期格式 : unread...
                    date = tranSkypeTime(dateStrLocal)
                    // console.info(dateStrLocal, '| ', new Date(date), element)
                }

            }

            // if ($(element).attr("time")) {  // 已经存在时间了
            //     timeLast = parseInt($(element).attr("time"))
            //     // timeLast = $(element).attr("time")
            //     // console.info("already timeLast")
            // } else {
            let nodeBubble = $(element).find("div[style*='justify-content: flex-start;'], div[style*='justify-content: flex-end;']")
            if (date && $(nodeBubble).length > 0) {
                if ($(element).attr("aria-label")) {
                    let time = getTimeFromSkypeAria($(element).attr("aria-label"))
                    // let msgTime = new Date(date)
                    // modifyClockOfDate(date, time)
                    if (timeLast) {
                        let timeCurrent = modifyClockOfDate(date, time)
                        // console.info(time, new Date(timeCurrent))
                        if (timeLast >= timeCurrent) {
                            timeCurrent = timeLast + 1
                        }
                        $(element).attr("time", timeCurrent)
                        $(element).attr("timeTempDate", date)
                        $(element).attr("timeTempTime", time)
                        $(element).attr("timeTempMod", modifyClockOfDate(date, time))
                        // $(element).attr("timeTemp", time+','+ (new Date(date)).toString())
                        timeLast = timeCurrent
                    } else {
                        let timeCurrent = modifyClockOfDate(date, time)
                        // console.info(time, new Date(timeCurrent))
                        $(element).attr("time", timeCurrent)
                        $(element).attr("timeTempDate", date)
                        $(element).attr("timeTempTime", time)
                        $(element).attr("timeTempMod", modifyClockOfDate(date, time))
                        // $(element).attr("timeTemp", time+','+ (new Date(date)).toString())
                        timeLast = timeCurrent
                    }
                } else {
                    // 不具有aria-label, 奇怪的消息类型, 比如天气
                    let timeObj = $(element).find("div[aria-label*='sent at']")
                    if ($(timeObj).length > 0) {
                        let time = getTimeFromSkypeAria($(timeObj).attr("aria-label")) // c4r Team, aaa, sent at 1:57 PM.  
                        if (timeLast) {
                            let timeCurrent = modifyClockOfDate(date, time)
                            if (timeLast >= timeCurrent) {
                                timeCurrent = timeLast + 1
                            }
                            $(element).attr("time", timeCurrent)
                            $(element).attr("timeTempDate", date)
                            $(element).attr("timeTempTime", time)
                            $(element).attr("timeTempMod", modifyClockOfDate(date, time))
                            // $(element).attr("timeTemp", time+','+ (new Date(date)).toString())
                            timeLast = timeCurrent
                        } else {
                            let timeCurrent = modifyClockOfDate(date, time)
                            $(element).attr("time", timeCurrent)
                            // $(element).attr("timeTemp", time+','+ (new Date(date)).toString())
                            timeLast = timeCurrent
                        }
                    } else {
                        // 没有找到任何时间标识, 用上一个时间做推测
                        if (timeLast) {
                            let timeCurrent = timeLast + 1
                            $(element).attr("time", timeCurrent)
                            timeLast = timeCurrent
                        } else {
                            // 前面也没有时间, 无能为例, 跳过该条消息
                        }
                    }
                }
            }
            // }


        })
    }


    /**
     * 给右侧消息添加MsgID
     */
    function addSender() {
        // console.info("add MsgID")

        let lastSender = undefined


        $("div[role=region]").each((index, element) => {

            if ($(element).attr('sender') === undefined) {
                let nodeBubble = $(element).find("div[style*='justify-content: flex-start;'], div[style*='justify-content: flex-end;']")
                if ($(nodeBubble).length > 0) {

                    if ($(nodeBubble).css("justify-content") == 'flex-start') { //右侧
                        let senderObj = $(nodeBubble).find("button[role='button'][aria-label$=profile]")
                        if ($(senderObj).length > 0) {
                            let currentSender = $(senderObj).attr('aria-label').slice(0, $(senderObj).attr('aria-label').lastIndexOf(','))
                            $(element).attr('sender', currentSender)
                            lastSender = currentSender
                        } else if (lastSender) {
                            $(element).attr('sender', lastSender)
                        } else {
                            // 没有找到sender
                        }

                    } else if ($(nodeBubble).css("justify-content") == 'flex-end') {
                        $(element).attr('sender', '')
                        lastSender = ''
                    }

                }
            } else {
                lastSender = $(element).attr('sender')
            }

        })
    }

    /**
     * 右侧聊天窗已经点开, 爬取bubble
     */
    function runGrepRightBubble() {

        let userID = $("button[role='button'][userID]").attr('userID')
        if ($("button[role='button'][userID]")) {

            // 添加id
            addMsgID()

            // 添加时间戳
            addMsgTime()

            // 添加发送者
            addSender()


            let msgArray = new Array()
            $("div[role=region][msgID][time][sender]").each((index, element) => {
                let msg = new chatMSG()
                msg.extract(element)

                msgArray.push(msg)
            })

            if (msgArray.length > 0) {
                (msgArray[0])["userID"] = userID;

                tdMessage.WebToHost({ "Dialog": msgArray }).then((res) => {
                    // console.info("send dialog res : ", res)
                }).catch((error) => {
                    throw error
                });
            }


        } else {
            return
        }

    }


    let callbackDialog = function (mutationList, observer) {

        // console.info("======Dialog changed=====", mutationList.length)
        if ($("button[role='button'][userID]").length > 0) {
            runGrepRightBubble()
        }

    }

    let callbackDialogOnce = function (mutationList, observer) {

        let addedNodes = false
        mutationList.forEach(mutation => {
            if (mutation.addedNodes.length == 1) {
                let node = mutation.addedNodes[0]


                if ($(node).find(' > button[title="More options"]').length > 0) { // 普通划过

                    // }else if($(node).find(' > button[title^="See who reacted with emoticon"]').length > 0){// 点赞

                    // }else if($(node).closest(' > button[title^="See who reacted with emoticon"]').length > 0){// 点赞

                    // }else if(node.nodeName == 'SPAN' && $(node).attr('class').includes('sprite')) { // 点赞

                } else {
                    // console.info(mutation.addedNodes)
                    addedNodes = addedNodes || true
                }



            } else if (mutation.addedNodes.length > 0) {
                // console.info(mutation.addedNodes)
                addedNodes = addedNodes || true

            }
        })

        // console.info('once : ', addedNodes , $("button[role='button'][userID]").length)
        if (addedNodes) {
            if ($("button[role='button'][userID]").length > 0) {
                runGrepRightBubble()
            }
        }
        // if ($("button[role='button'][userID]").length > 0) {
        //     console.info("once : ", $("button[role='button'][userID]").length)
        //     runGrepRightBubble()
        //     observer.disconnect()
        // } 

    }
    let obsDialog = new MutationObserver(callbackDialog); // 用来检测Dialog变化
    let obsDialogOnce = new MutationObserver(callbackDialogOnce); // 用来检测Dialog变化


    function startObserveDialog() {
        obsDialog.disconnect()
        obsDialogOnce.disconnect()

        if ($(".rxCustomScroll.rxCustomScrollV .scrollViewport.scrollViewportV").length == 3) {

            obsDialog.observe($(".rxCustomScroll.rxCustomScrollV .scrollViewport.scrollViewportV:eq(2) > div > div:eq(1)")[0], {
                subtree: true, childList: false, characterData: false, attributes: true,
                attributeFilter: ['data-transition-id'], attributeOldValue: true, characterDataOldValue: false
            });


            obsDialogOnce.observe($(".rxCustomScroll.rxCustomScrollV .scrollViewport.scrollViewportV:eq(2)")[0], {
                subtree: true, childList: true, characterData: false, attributes: false,
                attributeOldValue: false, characterDataOldValue: false
            });


        } else {
            console.info("error : startObserveDialog : 没找到dialog obt", $(".rxCustomScroll.rxCustomScrollV .scrollViewport.scrollViewportV"))
        }

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
                    tdMessage.WebToHost({ "logStatus": logStatus })
                    tdMessage.WebToHost({ "hide": {} })

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
            tdMessage.WebToHost({ "logStatus": logStatus })
            tdMessage.WebToHost({ "show": {} })
        }
    })

    //========================
    // 等待win发来消息
    tdMessage.WebReply((key, arg) => {
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
                    console.info(convo.nickName, userID)

                    // if ($('[aria-label="Find"]').length == 0 || $("#" + userID).attr('tabindex') == '-1') {
                    if ($("button[role='button'][title='" + convo.nickName + "']").length == 0
                        || $("button[role='button'][title='" + convo.nickName + "']").attr("userID") != userID) {


                        // 等待加载右侧
                        let callbackRight = function (mutationList, observer) {

                            // console.info("callbackRight", $("div.DraftEditor-editorContainer").length > 0 , $("button[role='button'][title='" + convo.nickName + "']").length > 0)

                            if ($("div.DraftEditor-editorContainer").length > 0  // 有编辑区域
                                && $("button[role='button'][title='" + convo.nickName + "']").length > 0 // 最上面title已加载
                                && $(".rxCustomScroll.rxCustomScrollV .scrollViewport.scrollViewportV").length == 3 // 右侧bubble已加载出来
                            ) {


                                console.info("add userID in title")
                                $("button[role='button'][title='" + convo.nickName + "']").attr("userID", userID)

                                // 爬取右侧
                                // runGrepRightBubble()
                                startObserveDialog()


                                observer.disconnect()
                            }


                        }
                        let obsRight = new MutationObserver(callbackRight);
                        obsRight.observe($('div.app-container')[0], {
                            subtree: true, childList: true, characterData: true, attributes: true,
                            attributeOldValue: false, characterDataOldValue: false
                        });


                        console.info("debug : 点击")
                        $("#" + userID + " > div > div").click()

                    } else {
                        // 直接爬取
                        console.info("debug : 直接爬取")
                        runGrepRightBubble()
                    }

                    resolve("copy the query. Please wait...")
                }


                reject("skype not online.")


            } else if (key == 'sendDialog') {


                console.info("--------sendDialog---")
                //检查
                if ($("button[role='button'][userID]").attr("userID") != arg[0]) {

                    reject("user not active")
                    return
                }

                function send(arrayValue, index = 0) {

                    console.info("index : ", index)
                    if (index == arrayValue.length) {
                        console.info("sendDialog finished")
                        resolve("Dialog send")
                        return
                    }

                    value = arrayValue[index]
                    if (typeof (value) == 'string') {
                        // console.log(value)

                        // 等待send button
                        let obsSend = new MutationObserver((mutationList, observer) => {

                            // console.info(mutationList)

                            if ($('button[role="button"][title="Send message"]').length > 0
                                && $('span[data-offset-key="0-0-0"]').length > 0
                                && $('span[data-offset-key="0-0-0"] span').text() == 'A') {
                                observer.disconnect()

                                // 2. 在A后面添加真实消息
                                setTimeout(() => {
                                    $('span[data-offset-key="0-0-0"] span').text(' ' + value)

                                    // 3. 输入空格
                                    $('div.public-DraftEditor-content').focus()
                                    tdMessage.WebToHost({ 'simulateKey': { 'type': 'keypress', 'charCode': 0x20 } }).then(() => {
                                        // 4. 光标移动到最开始
                                        $('div.public-DraftEditor-content').focus()
                                        tdMessage.WebToHost({ 'simulateKey': { 'type': 'keydown', 'charCode': 0x24 } })
                                    }).then(() => {
                                        // 5. 两次 Del 去掉字母A
                                        $('div.public-DraftEditor-content').focus()
                                        setTimeout(() => {
                                            tdMessage.WebToHost({ 'simulateKey': { 'type': 'keydown', 'charCode': 0x2E } })
                                        }, 200);
                                    }).then(() => {
                                        setTimeout(() => {
                                            tdMessage.WebToHost({ 'simulateKey': { 'type': 'keydown', 'charCode': 0x2E } })
                                        }, 400);
                                    }).then(() => {
                                        // 6. 发送
                                        setTimeout(() => {
                                            // waitSend(arrayValue, index)
                                            $('button[role="button"][title="Send message"]').click()
                                        }, 600);
                                    })

                                    // console.info("---text---")

                                }, 200);

                            }

                            if ($('button[role="button"][title="Send message"]').length > 0
                                && $('span[data-offset-key="0-0-0"]').length > 0
                                && $('span[data-offset-key="0-0-0"] span').text() == ' A') { // 空格A
                                observer.disconnect()

                                // 2. 在A后面添加真实消息
                                setTimeout(() => {
                                    $('span[data-offset-key="0-0-0"] span').text(' ' + value)

                                    // 3. 输入空格
                                    $('div.public-DraftEditor-content').focus()
                                    tdMessage.WebToHost({ 'simulateKey': { 'type': 'keypress', 'charCode': 0x20 } }).then(() => {
                                        // 4. 光标移动到最开始
                                        $('div.public-DraftEditor-content').focus()
                                        tdMessage.WebToHost({ 'simulateKey': { 'type': 'keydown', 'charCode': 0x24 } })
                                    }).then(() => {
                                        // 5. 两次 Del 去掉字母A
                                        $('div.public-DraftEditor-content').focus()
                                        setTimeout(() => {
                                            tdMessage.WebToHost({ 'simulateKey': { 'type': 'keydown', 'charCode': 0x2E } })
                                            setTimeout(() => {
                                                tdMessage.WebToHost({ 'simulateKey': { 'type': 'keydown', 'charCode': 0x2E } })

                                                // 6. 发送
                                                setTimeout(() => {
                                                    // waitSend(arrayValue, index)
                                                    $('div.public-DraftEditor-content').focus()
                                                    console.info("click send")
                                                    $('button[role="button"][title="Send message"]').click()
                                                    console.info("waitSend : ", index)
                                                    waitSend(arrayValue, index)

                                                }, 200);

                                            }, 200);

                                        }, 200);
                                    })


                                    // console.info("---text---")

                                }, 200);

                            }

                        });
                        obsSend.observe($('button[aria-label="Open Expression picker"]').parent()[0], {
                            subtree: true, childList: true, characterData: true, attributes: true,
                            attributeOldValue: false, characterDataOldValue: false
                        });
                        // console.info($('button[aria-label="Open Expression picker"]').parent())
                        // 1. 敲击键盘 输入字母A 
                        tdMessage.WebToHost({ "focus": '' }).then(() => {
                            $('div.public-DraftEditor-content').focus()
                            tdMessage.WebToHost({ 'simulateKey': { 'type': 'keypress', 'charCode': 0x20 } })
                            tdMessage.WebToHost({ 'simulateKey': { 'type': 'keypress', 'charCode': 0x41 } })
                        })



                    } else {
                        console.info("---file---")
                        tdMessage.WebToHost({ "focus": '' }).then(() => {
                            // if ($('input[type="file"]').length == 0) {
                            if ($('button[role="button"][title="Add files"]').length == 0) {
                                if ($('button[role="button"][title="More"][aria-label="More"]').length == 0) {
                                    // error
                                } else {
                                    console.info("click more")
                                    $('button[role="button"][title="More"][aria-label="More"]').click()
                                }
                            }

                            console.info("click add")
                            $('button[role="button"][title="Add files"]').click()
                            // }

                            tdMessage.WebToHost({ "attachFile": { "selector": "input[type='file']", "file": value } }).then((resHost) => {


                                waitSend(arrayValue, index)

                            })
                        })
                    }

                }

                function waitSend(arrayValue, index) {
                    // 等待发送完成
                    console.info("wait : ", index)
                    if (typeof (arrayValue[index]) == 'string') {
                        send(arrayValue, index + 1)

                    } else {
                        if ($('div[role="region"]').parent().length == 1) {



                            let obsSwxUpdated = new MutationObserver((mutationList, observer) => {
                                if ($("div[role=region]:eq(-2) svg[viewBox]").length > 0) {
                                    console.info("发送中....", $("div[role=region]:eq(-2) svg[viewBox]"))
                                    observer.disconnect()

                                    let sendFinished = new MutationObserver((mutationListSend, observerSend) => {

                                        let objSend = $("div[role=region]:eq(-2)")
                                        // console.info("发送状态 : 右侧 :", 
                                        // $(objSend).find("div[style*='justify-content: flex-end;']").length > 0, 
                                        // "小飞机 : ", $(objSend).find('button[role="button"][title="Forward"][aria-label="Forward"]').length > 0)
                                        if ($(objSend).find("div[style*='justify-content: flex-end;']").length > 0) {

                                            if ($(objSend).find('button[role="button"][title="Forward"][aria-label="Forward"]').length > 0) {
                                                console.info("图片已发送...")
                                                observerSend.disconnect()
                                                send(arrayValue, index + 1)
                                            } else if ($("div[role=region]:eq(-2)").find('div[title="Unable to send message"]').length > 0) {
                                                // 发送失败
                                                observerSend.disconnect()
                                                send(arrayValue, index + 1)
                                            }
                                        }
                                    })
                                    sendFinished.observe($("div[role=region]:eq(-2)")[0], {
                                        subtree: true, childList: true, characterData: true, attributes: false,
                                        attributeOldValue: false, characterDataOldValue: false
                                    })

                                }

                            })


                            obsSwxUpdated.observe($('div[role="region"]').parent()[0], {
                                subtree: true, childList: true, characterData: false, attributes: false,
                                attributeOldValue: false, characterDataOldValue: false
                            });


                        } else {
                            send(arrayValue, index + 1)
                        }


                    }

                }

                // 开始发送消息
                send(arg, 1)

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