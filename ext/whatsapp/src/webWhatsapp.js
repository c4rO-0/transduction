window.onload = function () {


    // ==============================
    // setup transduction environment
    const { app } = require('electron').remote
    let rootDir = app.getAppPath()
    console.log("transduction root directory : ", rootDir )
    console.log('current path : ', __dirname)
    const path = require('path')
    const {tdMessage} = require('td')
    window.$ = window.jQuery = require('jquery')
    // -----------------------

    const fs = require('fs')
    const { net } = require('electron').remote
    

    const wapi = require(path.join(__dirname, "wapi.js"))

    let logStatus = { "status": "offline" }


    /**
     * 获取convo在页面的实际排序
     * @param {object} convoObj  ! convo
     * @returns {int} index start from 0
     */
    function getIndex(convoObj) {
        var matrix = $(convoObj).css('transform').replace(/[^0-9\-.,]/g, '').split(',');
        var x = matrix[12] || matrix[4];
        var y = matrix[13] || matrix[5];

        return parseInt(y) / 72
    };

    function getNickNameFromContact(contact){
        return contact.name === undefined ? (
            contact.pushname === undefined ? contact.formattedName : contact.pushname
        ) : contact.name
    }

    /**
     * 获取convo的信息
     * @param {*} userID  
     */
    function grepConvo(userID) {

        // check user
        let contact = WAPI.getContact(userID)
        // console.log('contact : ', contact)
        if (contact === undefined) {
            console.log("user ", userID, " not exist")
            return undefined
        }
        // contact.name > contact.pushname > contact.formattedName
        let nickName = getNickNameFromContact(contact)
        // console.log('nickName : ', nickName)

        let avatar = contact.profilePicThumbObj.img
        // console.log('avatar : ', avatar)

        let hasNewMSG = false
        let time
        let allMSG = WAPI.getAllMessagesInChat(userID, true, true)
        let lastMSG
        if (allMSG === undefined || allMSG.length == 0) {
            console.log("warning : no chat log found in user ", userID)
        } else {
            lastMSG = allMSG[allMSG.length - 1]
            time = lastMSG.t * 1000

            allMSG.forEach(msg => {
                if (msg.isNewMsg) {
                    hasNewMSG = true
                }
            })
        }
        // console.log('lastMSG : ', lastMSG)

        // let chat = WAPI.getChatById(userID)
        let chat
        let index = 0
        WAPI.getAllChats().forEach((val, indx) => {
            if (val.id._serialized == userID) {
                index = indx
                chat = val
            }
        })
        // if(chat === undefined){
        //     chat = WAPI.getChatById(userID)
        // }
        // console.log('chat : ', chat)

        let muted
        let counter = 0
        let message = ''
        if (chat) {
            muted = chat.muteExpiration * 1000 < (new Date()).getTime() ? false : true
            counter = chat.unreadCount


            if (chat.isGroup) {
                let lastSender = WAPI.getContact(lastMSG.author._serialized)
                let lastSenderName = getNickNameFromContact(lastSender)

                messageBody = lastSenderName + ":"
            } else {
                messageBody = ""
            }

            if (lastMSG.type == 'chat') {
                message = messageBody + lastMSG.body
            } else if (lastMSG.type == "image") {
                message = messageBody + '[image]'
            } else if (lastMSG.type == 'video') {
                message = messageBody + '[video]'
            } else if (lastMSG.type == 'document') {
                message = messageBody + '[' + lastMSG.mediaData.filename +']'
            } else {
                message = messageBody + '[unknown]'
            }


        }

        let action = hasNewMSG ? "a" : "c"


        // -------

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



    /**
      * 
      * @param {object} wbubble ! whatsapi的bubble
      * @returns {Object} bubble list
      */
     function grepBubble(wbubble) {


        // let contact = WAPI.getContact(wbubble.author._serialized)
        let contact = wbubble.sender._serialized
        let fromUserName = getNickNameFromContact(contact)
        let time = wbubble.t*1000
        let MSGID = wbubble.id
        let avatar = contact.profilePicThumbObj.img
        let content = ''
        let fileName = undefined
        let fileSize = undefined
        let type = 'unknown'
        let url = undefined
        if(wbubble.type == 'chat'){
            type = 'text'
            content = wbubble.body
        }else if(wbubble.type == "image"){
            type = 'img'
            content = wbubble.caption === undefined ? "" : wbubble.caption
            // url = 

        }else if(wbubble.type == "document"){
            type = 'file'
            // content = wbubble.caption === undefined ? "" : wbubble.caption
        }else if(wbubble.type == "video"){
            type = 'unknown'
            // content = wbubble.caption === undefined ? "" : wbubble.caption
        }else{
            content = wbubble.caption === undefined ? wbubble.body : wbubble.caption
        }

        let status = undefined
        if(wbubble.isForwarded === undefined){ // <---待定
            status = 'sending'
        }else{
            status = 'done'
        }
        // ================

        return {
            "from": fromUserName,
            "msgID": MSGID,
            "time": time.getTime(),
            "type": type,
            "message": content.trim(),
            "url":url,
            "avatar": avatar,
            "fileName": fileName,
            "fileSize": fileSize,
            "status" : status
        }


    }

    function loadFunAfterWAPI() {

        // at start we load initial convo
        setTimeout(() => {
            console.log('initialize convo...')
            WAPI.getAllChats().forEach((chat) => {
                let convo = grepConvo(chat.contact.id._serialized)
                // only need 'c'
                // 'a' will be processed in `waitNewMessages`
                // if (convo.action == 'c') {
                    if ( (chat.pin !== undefined && chat.pin > 0 )
                        || convo.counter > 0) {
                        convo.action = 'a'
                        tdMessage.WebToHost({ "Convo-new": convo }).then((res) => {
                            console.log(res)
                        }).catch((error) => {
                            throw error
                        });
                    }
                // }
            })
        }, 1000);


        WAPI.waitNewMessages(rmCallbackAfterUse = false, done = (queuedMessages) => {
            console.log("new messages coming : ", queuedMessages)

            let newChatList = []
            queuedMessages.forEach((msg, index) => {
                if (msg.chat
                    && msg.chatId._serialized
                    && (!newChatList.includes(msg.chatId._serialized))) {
                    newChatList.push(msg.chatId._serialized)
                }
            })

            console.log(newChatList.length, " chats have new MSGs")

            newChatList.forEach((userID) => {
                let convo = grepConvo(userID)
                tdMessage.WebToHost({ "Convo-new": convo }).then((res) => {
                    console.log(res)
                }).catch((error) => {
                    throw error
                });
            })

        })


        tdMessage.WebReply((key, arg) => {
            return new Promise((resolve, reject) => {
                if (key == 'queryDialog') {
                    // 索取右侧
                    console.log("debug : ", "---获取用户聊天记录----")
                    // 下面开始模拟点击
                    let userID = arg.userID

                    let indexChat = (WAPI.getAllChatIds()).indexOf(userID)
                    if (indexChat == -1) reject("user not existed")

                    console.log('indexChat : ', indexChat)
                    $("div.X7YrQ").each((indexInHTML, element) => {

                        // console.log('getIndex : ', getIndex(element))
                        if (indexChat == getIndex(element)) {
                            console.log("click")
                            rect = $(element).find("span[title][dir]").get(0).getBoundingClientRect()
                            tdMessage.WebToHost({
                                "simulateMouse": {
                                    type: "click",
                                    x: rect.x,
                                    y: rect.y
                                }
                            }).then((res) => {
                                // =========未完 : 右侧============
                                setTimeout(() => {
                                    // 获取内容
                                    // bubbles = grepRight()

                                    console.log(WAPI.getChatById(userID))

                                    // 加载convo
                                    let convo = grepConvo(userID)
                                    tdMessage.WebToHost({ "Convo-new": convo }).then((res) => {
                                        console.log(res)
                                    }).catch((error) => {
                                        throw error
                                    });

                                    setTimeout(() => {
                                        document.activeElement.blur()
                                        resolve("request received. MSG will send.")
                                    }, 30);
                                }, 30);
                            }).catch((error) => {
                                throw error
                            });
                        }

                    })

                    resolve("request received. MSG will send.")

                } else if (key == 'sendDialog') {
                    // 键入消息
                    console.log("--------sendDialog---")
                    // 检查

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

    }

    $(document).ready(function () {

        const titleEl = document.querySelector('.window-title');
        if (titleEl && titleEl.innerHTML.includes('Google Chrome')) {
            window.navigator.serviceWorker.getRegistrations().then(registrations => {
                for (let registration of registrations) {
                    registration.unregister(); //Unregisters all the service workers
                }
            });
            window.location.reload(); //Reloads the page if the page shows the error
        } else {


            // 观察左侧消息变动
            // let obsChatLeft = new MutationObserver(callbackChatLeft);

            if ($('#pane-side').length == 0) {
                console.log("********************offline***************************************")
                logStatus.status = "offline"
                tdMessage.WebToHost({ "logStatus": logStatus })
                tdMessage.WebToHost({ "show": {} })

                let callbackobsLogin = function (mutationList, observer) {
                    // console.log("log status changed : ", mutationList)
                    if ($('#pane-side').length > 0) {
                        logStatus.status = "online"
                        console.log("=======================online=====================================")
                        // console.log($("div.login"))
                        tdMessage.WebToHost({ "logStatus": logStatus })
                        tdMessage.WebToHost({ "hide": {} })
                        observer.disconnect()

                        setTimeout(() => {
                            console.log("initialize WAPI")
                            wapi.init()

                            loadFunAfterWAPI()
                        }, 10);


                    }
                }
                let obsLogin = new MutationObserver(callbackobsLogin);
                obsLogin.observe($('body')[0], {
                    childList: true,
                    subtree: true,
                    characterData: false,
                    // attributeFilter: ["style"],
                    attributes: false, attributeOldValue: false
                });
            } else {
                logStatus.status = "online"
                console.log("=======================online=====================================")
                // console.log($("div.login"))
                tdMessage.WebToHost({ "logStatus": logStatus })
                tdMessage.WebToHost({ "hide": {} })
                setTimeout(() => {
                    console.log("initialize WAPI")
                    wapi.init()

                    loadFunAfterWAPI()
                }, 10);

            }

        }


        $(document).on('click', 'div.X7YrQ', (event)=>{
            let ObjUsr = $(event.target).closest('div.X7YrQ')
            if(ObjUsr){

                let userID = ((WAPI.getAllChats())[getIndex(ObjUsr)]).contact.id._serialized
                // console.log('click ', $(ObjUsr), getIndex(ObjUsr), userID)
                let convo = grepConvo(userID)
                convo.action = 'a'
                tdMessage.WebToHost({ "Convo-new": convo }).then((res) => {
                    console.log(res)
                }).catch((error) => {
                    throw error
                });
            }
        })

    })

}