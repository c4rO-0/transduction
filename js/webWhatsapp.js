window.onload = function () {

    const core = require("../js/core.js")
    // const watchJS = require("../toolkit/watch-1.4.2.js")
    // const http = require('http')
    const fs = require('fs')
    const { net } = require('electron').remote
    window.$ = window.jQuery = require("../toolkit/jquery-3.3.1.min.js")

    const wapi = require("../toolkit/wapi.js")

    let logStatus = { "status": "offline" }

    function getIndex(obj){
        var matrix = $(obj).css('transform').replace(/[^0-9\-.,]/g, '').split(',');
        var x = matrix[12] || matrix[4];
        var y = matrix[13] || matrix[5];
        
        return parseInt(y)/72
      };

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
                }, 10);

            }

        }


        $(document).on('click', 'div.X7YrQ', (event)=>{
            let ObjUsr = $(event.target).closest('div.X7YrQ')
            if(ObjUsr){
                console.log('click ', $(ObjUsr), getIndex(ObjUsr))
                console.log((WAPI.getAllChats())[getIndex(ObjUsr)])
            }
        })

    })

}