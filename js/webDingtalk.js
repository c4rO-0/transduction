window.onload = function () {

    const core = require("../js/core.js")
    const watchJS = require("../toolkit/watch-1.4.2.js")
    // const http = require('http')
    const fs = require('fs')
    const { net } = require('electron').remote

    let logStatus = { "status": "offline" }


    function callbackChat(mutationList, observer) {
        console.log('dingtalk left : ', mutationList)
        mutationList.forEach((mutation, index) => {
            if($(mutation.target).is('span.ng-binding.ng-hide')){
                // 未读消息数增加
                console.log('dingtalk convo changed : ', mutation, $(mutation.target).closest('conv-item'))
                // ========爬取左边=========
            }
            if(mutation.type ==  "characterData"){
                if($(mutation.target).parent('span.time').length > 0){
                    // 时间戳发生变化
                    console.log('dingtalk convo text changed : ', mutation)
                }
                

            }

            // mutation.addedNodes.forEach( (node,index) =>{
            //     if($(node).is('conv-item')){
            //         // 添加convo || 从以读到未读 
            //         console.log('dingtalk convo changed : ', $(node))
            //     }
            // })
            // if(mutation.removedNodes.length > 0){
            //     if($(mutation.target).is('span.ng-binding.ng-hide')){
            //         // 未读消息数增加
            //         console.log('dingtalk convo changed : ', mutation, $(mutation.target).closest('conv-item'))
            //     }
            // }
        })
    }

    $(document).ready(function () {


        // 观察左侧消息变动
        let obsChat = new MutationObserver(callbackChat);

        if ($('#menu-pannel').length == 0) {
            console.log("********************offline***************************************")
            logStatus.status = "offline"
            core.WebToHost({ "logStatus": logStatus })
            core.WebToHost({ "show": {} })

            let callbackobsLogin = function (mutationList, observer) {
                // console.log("log status changed : ", mutationList)
                if ($('#menu-pannel').length > 0) {
                    logStatus.status = "online"
                    console.log("=======================online=====================================")
                    // console.log($("div.login"))
                    core.WebToHost({ "logStatus": logStatus })
                    core.WebToHost({ "hide": {} })
                    observer.disconnect()

                    obsChat.observe(document.getElementById('sub-menu-pannel'), {
                        childList: true,
                        subtree: true,
                        characterData: true,
                        characterDataOldValue: true,
                        // attributeFilter: ["data-username"],
                        attributes: false
                        //  attributeOldValue: true
                    });                    
                }
            }
            let obsLogin = new MutationObserver(callbackobsLogin);
            obsLogin.observe($('body')[0], {
                childList: true,
                subtree: false,
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

            obsChat.observe(document.getElementById('sub-menu-pannel'), {
                childList: true,
                subtree: true,
                characterData: false,
                // characterDataOldValue: true,
                // attributeFilter: ["data-username"],
                attributes: false
                // attributeOldValue: true
            });

        }


        core.WebReply((key, arg) => {
            return new Promise((resolve, reject) => {
                if (key == 'queryDialog') {
                    // 索取右侧
                } else if (key == 'sendDialog') {
                    // 键入消息
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

    })

}