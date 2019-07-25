window.onload = function () {

    const core = require("../js/core.js")
    const watchJS = require("../toolkit/watch-1.4.2.js")
    // const http = require('http')
    const fs = require('fs')
    const { net } = require('electron').remote

    let logStatus = { "status": "offline" }


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
    }else{
        logStatus.status = "online"
        console.log("=======================online=====================================")
        // console.log($("div.login"))
        core.WebToHost({ "logStatus": logStatus })
        core.WebToHost({ "hide": {} })
    }


    $(document).ready(function () {

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