window.onload = function () {

    const core = require("../js/core.js")
    // const watchJS = require("../toolkit/watch-1.4.2.js")
    // const http = require('http')
    const fs = require('fs')
    const { net } = require('electron').remote
    window.$ = window.jQuery = require("../toolkit/jquery-3.3.1.min.js")

    const wapi = require("../toolkit/wapi.js")

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
        if(wbubble.type == 'chat'){
            type = 'text'
            content = wbubble.body
        }else if(wbubble.type == "image"){
            type = 'img'

        }else if(wbubble.type == "document"){
            type = 'file'
        }else if(wbubble.type == "video"){
            type = 'unknown'
        }else{

        }

        // ================



        // if (typeStr == 'msg-text') {
        //     // 文字内容
        //     type = 'text'
        //     if ($(objContent).find('div.msg-bubble > pre').length > 0) {

        //         contentObj = $(objContent).find('div.msg-bubble > pre')

        //         content = ""
        //         $(contentObj).contents().toArray().forEach((c, i) => {
        //             // 将内容进行切割, 判断是否为img

        //             // console.log(c, $(c).prop('nodeName'))
        //             let nodeName = $(c).prop('nodeName')
        //             if (nodeName == "IMG") {
        //                 // 筛选字符表情
        //                 if($(c).attr('title')){
        //                     content = content + $(c).attr('title')
        //                 }else if($(c).attr('alt')){
        //                     content = content + $(c).attr('alt')
        //                 }else{
        //                     type = 'undefined'
        //                 }
                        
        //             }
        //             // 链接文字
        //             content = content + $(c).text()

        //         })

        //     } else if ($(objContent).find('div.msg-bubble > code-snippet-container').length > 0) {
        //         // console.log("found code -----")
        //         // console.log($(objContent).html())
        //         content = ''
        //         $(objContent).find('span[role="presentation"]').each((index, element) => {
        //             content = content + $(element).text() + '\n\r'
        //         })

        //     }else{
        //         type = 'unknown'
        //         content = $(objContent).find('div.msg-bubble').text()
        //     }

        // } else if (typeStr == 'msg-img') {
        //     // 图片内容
        //     type = 'img'
        //     let fullImgUrl = $(objContent).find('img.chat-img').attr('src')
        //     if(fullImgUrl == undefined ){
        //         content = ''
        //     }else{
        //         if(fullImgUrl.includes('img/filelogo/pic.p') || fullImgUrl.indexOf('?') <0 || fullImgUrl.lastIndexOf('_') < 0 ){
        //             content = fullImgUrl
        //         }else{
        //             content = fullImgUrl.slice(0, fullImgUrl.indexOf('?'))
        //             content = content.slice(0, content.lastIndexOf('_'))
        //         }

        //     }

        // } else if (typeStr == 'msg-img-text') {
        //     // 图文内容
        // } else if (typeStr == 'msg-file') {
        //     // 普通文件内容(旧数据)
        // } else if (typeStr == 'msg-space-file') {
        //     //  云盘内容

        //     type = 'file'
        //     content = $(objContent).find('a.download-file-btn:not(ng-hide)').attr('href')

        //     fileName = $(objContent).find('p.file-name').text()
        //     fileSizeStr = $(objContent).find('p.file-size').text()
        //     if (fileSizeStr.includes(' B')) {
        //         fileSize = parseFloat(fileSizeStr.slice(0, -2))
        //     } else if (fileSizeStr.includes(' KB')) {
        //         fileSize = parseFloat(fileSizeStr.slice(0, -3)) * 1000.
        //     } else if (fileSizeStr.includes(' MB')) {
        //         fileSize = parseFloat(fileSizeStr.slice(0, -3)) * 1000. * 1000.
        //     } else if (fileSizeStr.includes(' GB')) {
        //         fileSize = parseFloat(fileSizeStr.slice(0, -3)) * 1000. * 1000. * 1000.
        //     } else {

        //     }


        // } else if (typeStr == 'ding-text') {
        //     // ding文字   
        //     content = $(objContent).find('div.msg-bubble').text()
        // } else if (typeStr == 'msg-encrypt-img') {
        //     // 加密文件
        //     content = $(objContent).find('div.msg-bubble').text()
        // } else if (type == 'msg-encrypt-img') {
        //     // 加密图片
        //     content = $(objContent).find('div.msg-bubble').text()
        // } else {
        //     content = $(objContent).find('div.msg-bubble').text()
        // }

        // // 获取状态
        // let status = undefined

        // if ($(objBubble).length > 0) {
        //     let objSending = $(objBubble).find('div[progress-bar]')
        //     let objFailed = $(objBubble).find('.icon-resend')

        //     if ($(objSending).length > 0 && $(objSending).is(':visible')) {
        //         status = 'sending'
        //     } else if ( $(objFailed).length > 0 && $(objFailed).is(':visible') ) {
        //         status = 'failed'
        //     } else {
        //         status = 'done'
        //     }
        // }

        // return {
        //     "from": fromUserName,
        //     "msgID": MSGID,
        //     "time": time.getTime(),
        //     "type": type,
        //     "message": content.trim(),
        //     "avatar": avatar,
        //     "fileName": fileName,
        //     "fileSize": fileSize,
        //     "status" : status
        // }


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
                        core.WebToHost({ "Convo-new": convo }).then((res) => {
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
                core.WebToHost({ "Convo-new": convo }).then((res) => {
                    console.log(res)
                }).catch((error) => {
                    throw error
                });
            })

        })


        core.WebReply((key, arg) => {
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

                        console.log('getIndex : ', getIndex(element))
                        if (indexChat == getIndex(element)) {
                            console.log("click")
                            rect = $(element).find("span[title][dir]").get(0).getBoundingClientRect()
                            // core.WebToHost({
                            //     "simulateMouse": {
                            //         type: "click",
                            //         x: rect.x,
                            //         y: rect.y
                            //     }
                            // }).then((res) => {
                                // =========未完 : 右侧============
                                setTimeout(() => {
                                    // 获取内容
                                    // bubbles = grepRight()

                                    console.log(WAPI.getChatById(userID))

                                    setTimeout(() => {
                                        document.activeElement.blur()
                                        resolve("request received. MSG will send.")
                                    }, 30);

                                }, 30);
                            // }).catch((error) => {
                            //     throw error
                            // });
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
                core.WebToHost({ "logStatus": logStatus })
                core.WebToHost({ "show": {} })

                let callbackobsLogin = function (mutationList, observer) {
                    // console.log("log status changed : ", mutationList)
                    if ($('#pane-side').length > 0) {
                        logStatus.status = "online"
                        console.log("=======================online=====================================")
                        // console.log($("div.login"))
                        core.WebToHost({ "logStatus": logStatus })
                        core.WebToHost({ "hide": {} })
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
                core.WebToHost({ "logStatus": logStatus })
                core.WebToHost({ "hide": {} })
                setTimeout(() => {
                    console.log("initialize WAPI")
                    wapi.init()

                    loadFunAfterWAPI()
                }, 10);

            }

        }


        // $(document).on('click', 'div.X7YrQ', (event)=>{
        //     let ObjUsr = $(event.target).closest('div.X7YrQ')
        //     if(ObjUsr){

        //         let userID = ((WAPI.getAllChats())[getIndex(ObjUsr)]).contact.id._serialized
        //         console.log('click ', $(ObjUsr), getIndex(ObjUsr), userID)
        //         let convo = grepConvo(userID)
        //         core.WebToHost({ "Convo-new": convo }).then((res) => {
        //             console.log(res)
        //         }).catch((error) => {
        //             throw error
        //         });
        //     }
        // })

    })

}