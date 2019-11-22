window.onload = function () {

    const core = require("../js/core.js")
    // const watchJS = require("../toolkit/watch-1.4.2.js")
    // const http = require('http')
    const fs = require('fs')
    const { net } = require('electron').remote
    window.$ = window.jQuery = require("../toolkit/jquery-3.3.1.min.js")


    const _ = require("../toolkit/underscore-min-1.9.1.js")


    let logStatus = { "status": "offline" }

    var modules
    var Store = {};
    var createFromData_id = 0;
    var prepareRawMedia_id = 0;
    var store_id = 0;
    var chat_id = 0;

    function getAllModules() {
        return new Promise((resolve) => {
            const id = _.uniqueId("fakeModule_");
            window["webpackJsonp"](
                [],
                {
                    [id]: function(module, exports, __webpack_require__) {
                        resolve(__webpack_require__.c);
                    }
                },
                [id]
            );
        });
    }

    function _requireById(id) {
        return new Promise((resolve) => {
            resolve(window["webpackJsonp"]([], null, [id]));
        })
    }

    function fixBinary (bin) {
        var length = bin.length;
        var buf = new ArrayBuffer(length);
        var arr = new Uint8Array(buf);
        for (var i = 0; i < length; i++) {
          arr[i] = bin.charCodeAt(i);
        }
        return buf;
    }

    function init() {
        getAllModules().then((val)=>{
            modules = val
            console.log("===get modules===")
            // console.log(modules)
            for (var key in modules) {
                if (modules[key].exports) {
                    if (modules[key].exports.createFromData) {
                        createFromData_id = modules[key].i.replace(/"/g, '"');
                    }
                    if (modules[key].exports.prepRawMedia) {
                        prepareRawMedia_id = modules[key].i.replace(/"/g, '"');
                    }
                    if (modules[key].exports.default) {
                        
                        if (modules[key].exports.default.Wap) {
                            console.log(modules[key].exports.default.Wap)
                            store_id = modules[key].i.replace(/"/g, '"');
                        }
                    }
                    if (modules[key].exports.sendTextMsgToChat) {
                        chat_id = modules[key].i.replace(/"/g, '"');
                    }
                }
            }

            console.log("===get Store===")
            // console.log(store_id,chat_id)

            console.log("===require by store_ID : ", store_id)
            _requireById(store_id).then((val)=>{
                console.log(val)
            }).catch(err =>{
                console.log(err)
            })

            // Store.sendTextMsgToChat = _requireById(chat_id).sendTextMsgToChat;
            // console.log("Store is ready");
            // console.log(window.Store);

        });
        // window.send_media("91xxxxxxxxxx@c.us", "data:image/png;base64,iVBORw0KG..........sda=", "test messsage", null, null);
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
        }else{


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

                    init()
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

            init()

        }




        }

    })

}