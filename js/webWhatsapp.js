window.onload = function () {

    const core = require("../js/core.js")
    // const watchJS = require("../toolkit/watch-1.4.2.js")
    // const http = require('http')
    const fs = require('fs')
    const { net } = require('electron').remote
    window.$ = window.jQuery = require("../toolkit/jquery-3.3.1.min.js")

    const wapi = require("../toolkit/wapi.js")

    let logStatus = { "status": "offline" }

    function simulatedClick(target, options = {}) {
        if (target.ownerDocument === undefined) return;
    
        const event = target.ownerDocument.createEvent('MouseEvents');
        const opts = { // These are the default values, set up for un-modified left clicks
            type: 'click',
            canBubble: false, // switch off to avoid closing for compose popup
            cancelable: true,
            view: target.ownerDocument.defaultView,
            detail: 1,
            screenX: 0, // The coordinates within the entire page
            screenY: 0,
            clientX: 0, // The coordinates within the viewport
            clientY: 0,
            ctrlKey: false,
            altKey: false,
            shiftKey: false,
            metaKey: false, // I *think* 'meta' is 'Cmd/Apple' on Mac, and 'Windows key' on Win. Not sure, though!
            button: 0, // 0 = left, 1 = middle, 2 = right
            relatedTarget: null,
        };
    
        // Merge the options with the defaults
        for (let key in options) {
            if (options.hasOwnProperty(key)) {
                opts[key] = options[key];
            }
        }
    
        // Pass in the options
        event.initMouseEvent(
            opts.type,
            opts.canBubble,
            opts.cancelable,
            opts.view,
            opts.detail,
            opts.screenX,
            opts.screenY,
            opts.clientX,
            opts.clientY,
            opts.ctrlKey,
            opts.altKey,
            opts.shiftKey,
            opts.metaKey,
            opts.button,
            opts.relatedTarget
        );
    
        // Fire the event
        target.dispatchEvent(event);
    }


    /**
     * 获取convo在页面的实际排序
     * @param {object} convoObj  ! convo
     * @returns {int} index start from 0
     */
    function getIndex(convoObj){
        var matrix = $(convoObj).css('transform').replace(/[^0-9\-.,]/g, '').split(',');
        var x = matrix[12] || matrix[4];
        var y = matrix[13] || matrix[5];
        
        return parseInt(y)/72
      };

    /**
     * 获取convo的信息
     * @param {*} userID  
     */
    function grepConvo(userID) {
        
        // check user
        let contact = WAPI.getContact(userID)
        // console.log('contact : ', contact)
        if(contact === undefined){
            console.log("user ", userID, " not exist")
            return undefined
        }
        // contact.name > contact.pushname > contact.formattedName
        let nickName = contact.name === undefined ? (
            contact.pushname === undefined ? contact.formattedName : contact.pushname
        ): contact.name
        // console.log('nickName : ', nickName)

        let avatar = contact.profilePicThumbObj.img
        // console.log('avatar : ', avatar)
        
        let hasNewMSG = false
        let time
        let allMSG = WAPI.getAllMessagesInChat(userID, true, true)
        let lastMSG
        if( allMSG === undefined || allMSG.length == 0){
            console.log("warning : no chat log found in user ", userID)
        }else{
            lastMSG = allMSG[allMSG.length -1]
            time = lastMSG.t*1000

            allMSG.forEach(msg =>{
                if(msg.isNewMsg){
                    hasNewMSG = true
                }
            })
        }
        // console.log('lastMSG : ', lastMSG)

        // let chat = WAPI.getChatById(userID)
        let chat
        let index = 0
        WAPI.getAllChats().forEach((val,indx)=>{
            if(val.id._serialized == userID){
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
        let message =''
        if(chat){
            muted = chat.muteExpiration*1000 < (new Date()).getTime() ? false : true
            counter = chat.unreadCount

            
            if(chat.isGroup){
                let lastSender = WAPI.getContact(lastMSG.author._serialized)
                let lastSenderName = lastSender.name === undefined ? (
                    lastSender.pushname === undefined ? lastSender.formattedName : lastSender.pushname
                ): lastSender.name

                messageBody = lastSenderName + ":"
            }else{
                messageBody = "" 
            }

            if(lastMSG.type == 'chat'){
                message = messageBody + lastMSG.body
            }else if(lastMSG.type == "image"){
                message = messageBody + '[image]'
            }else if(lastMSG.type == 'video'){
                message = messageBody + '[video]'
            }else{
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

    function loadFunAfterWAPI(){

        // at start we load initial convo
        setTimeout(() => {
            console.log('initialize convo...')
            WAPI.getAllChats().forEach((chat)=>{
                let convo = grepConvo(chat.contact.id._serialized) 
                // only need 'c'
                // 'a' will be processed in `waitNewMessages`
                if(convo.action == 'c'){
                    if(chat.pin !== undefined && chat.pin >0){
                        convo.action = 'a'
                        core.WebToHost({ "Convo-new": convo }).then((res) => {
                            console.log(res)
                        }).catch((error) => {
                            throw error
                        });
                    }
                }
            })
        }, 1000);


        WAPI.waitNewMessages(rmCallbackAfterUse = false, done = (queuedMessages)=>{
            console.log("new messages coming : ", queuedMessages)

            let newChatList = []
            queuedMessages.forEach((msg, index)=>{
                if(msg.chat 
                    && msg.chatId._serialized 
                    && (!newChatList.includes(msg.chatId._serialized) )){
                        newChatList.push(msg.chatId._serialized)
                }
            })

            console.log(newChatList.length,  " chats have new MSGs")

            newChatList.forEach((userID)=>{
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
                    if ( indexChat == -1 ) reject("user not existed")

                    console.log('indexChat : ', indexChat)
                    $("div.X7YrQ").each( (indexInHTML, element) =>{

                        console.log('getIndex : ', getIndex(element))
                        if(indexChat == getIndex(element)){
                            console.log("click")
                            simulatedClick(element, {type: 'mousedown'});
                            simulatedClick(element, {type: 'mouseup'});
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