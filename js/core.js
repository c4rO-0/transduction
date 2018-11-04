/**
 * 库函数
 * @module 封装的库函数
 */

// ====================================
//  require
// ------------------------------------
// 声明和调用electron函数
const electron = require("electron");
const ipcRender = electron.ipcRenderer
const ipcMain = electron.ipcMain
//  读取本地文件
const fs = require('fs');
// 声明Jquery
const $ = require(process.env.PWD + '/toolkit/jquery-3.3.1.min.js')

// =============================
// local Function
// 库函数需要的一些局域函数
// -----------------------------

/**
 * A utility function that detects and handles AJAXed content. 
 * @author BrockA
 * @see {@link https://gist.github.com/BrockA/2625891#file-waitforkeyelements-js  }
 * @param {String} selectorTxt 
 * The jQuery selector string that specifies the desired element(s).
 * @param {Function} actionFunction 
 * The code to run when elements are found. It is passed a jNode to the matched element.
 * @param {Boolean} [bWaitOnce]
 * If false, will continue to scan for new elements even after the first match is found.
 * @param {String} [iframeSelector]
 * If set, identifies the iframe to search.
 */
function waitForKeyElements(
    selectorTxt,    /* Required: The jQuery selector string that
                    specifies the desired element(s).
                */
    actionFunction, /* Required: The code to run when elements are
                    found. It is passed a jNode to the matched
                    element.
                */
    bWaitOnce,      /* Optional: If false, will continue to scan for
                    new elements even after the first match is
                    found.
                */
    iframeSelector  /* Optional: If set, identifies the iframe to
                    search.
                */
) {
    var targetNodes, btargetsFound;

    if (typeof iframeSelector == "undefined")
        targetNodes = $(selectorTxt);
    else
        targetNodes = $(iframeSelector).contents()
            .find(selectorTxt);

    if (targetNodes && targetNodes.length > 0) {
        btargetsFound = true;
        /*--- Found target node(s).  Go through each and act if they
            are new.
        */
        targetNodes.each(function () {
            var jThis = $(this);
            var alreadyFound = jThis.data('alreadyFound') || false;

            if (!alreadyFound) {
                //--- Call the payload function.
                var cancelFound = actionFunction(jThis);
                if (cancelFound)
                    btargetsFound = false;
                else
                    jThis.data('alreadyFound', true);
            }
        });
    }
    else {
        btargetsFound = false;
    }


    //--- Get the timer-control variable for this selector.
    var controlObj = waitForKeyElements.controlObj || {};
    var controlKey = selectorTxt.replace(/[^\w]/g, "_");
    var timeControl = controlObj[controlKey];

    //--- Now set or clear the timer as appropriate.
    if (btargetsFound && bWaitOnce && timeControl) {
        //--- The only condition where we need to clear the timer.
        clearInterval(timeControl);
        delete controlObj[controlKey]
    }
    else {
        //--- Set a timer, if needed.
        if (!timeControl) {
            timeControl = setInterval(function () {
                waitForKeyElements(selectorTxt,
                    actionFunction,
                    bWaitOnce,
                    iframeSelector
                );
            },
                300
            );
            controlObj[controlKey] = timeControl;
        }
    }
    waitForKeyElements.controlObj = controlObj;
}

/**
 * 返回一个以时间作为种子的唯一字符串.
 * 目前被用在消息传递的时候创建一个独一无二的channel
 * @returns {String} UniqueStr 
 */
function UniqueStr() {

    return (Date.now() + Math.random()).toString()
}

// ====================================
/**
 * core Module Function
 */
module.exports = {
    /**
     * A utility function that detects and handles AJAXed content. 
     * @author BrockA
     * @see {@link https://gist.github.com/BrockA/2625891#file-waitforkeyelements-js  }
     * @param {String} selectorTxt 
     * The jQuery selector string that specifies the desired element(s).
     * @param {Function} actionFunction 
     * The code to run when elements are found. It is passed a jNode to the matched element.
     * @param {Boolean} [bWaitOnce]
     * If false, will continue to scan for new elements even after the first match is found.
     * @param {String} [iframeSelector]
     * If set, identifies the iframe to search.
     */
    waitForKeyElements: function (
        selectorTxt,    /* Required: The jQuery selector string that
                    specifies the desired element(s).
                */
        actionFunction, /* Required: The code to run when elements are
                    found. It is passed a jNode to the matched
                    element.
                */
        bWaitOnce,      /* Optional: If false, will continue to scan for
                    new elements even after the first match is
                    found.
                */
        iframeSelector  /* Optional: If set, identifies the iframe to
                    search.
                */
    ) {

        waitForKeyElements(selectorTxt, actionFunction, bWaitOnce, iframeSelector)

    },
    /**
     * 在webview页面插入<p id=electronReady>来标记页面已经加载好.
     * 可以通过该手段在页面发生跳转后重新执行脚本.
     */
    insertReady: function () {
        if ($('#electronReady') == null || $('#electronReady').length == 0) {
            $("body").append("<p id='electronReady' style='visibility:hidden;'> electronReady </p>")
        }
    },
    /**
     * 在webview页面插入一段JS代码.
     * @param {String} IDwebview 
     * 要插入webview对应tag的ID
     * @param {String} pathJS 
     * 要插入的脚本存放的路径. 该处为绝对路径.
     */
    webviewDynamicInsertJS: function (IDwebview, pathJS) {

        let elementWebview = document.getElementById(IDwebview)

        console.log(elementWebview)
        // 发现URL变化
        elementWebview.addEventListener('did-navigate-in-page', (event) => {
            console.log(IDwebview, "url change : ", event.isMainFrame, event.url)

            // 注入指定脚本
            var script = fs.readFileSync(pathJS, 'utf8')
            script = script.replace(/\\/g, '\\\\');
            script = script.replace(/'/g, '\\\'');
            script = script.replace(/"/g, '\\\"');
            script = script.replace(/\n/g, '\\n');
            script = script.replace(/\r/g, '\\r');
            script = script.replace(/\t/g, '\\t');
            // script = script.replace(/\b/g, '\\b');   
            script = script.replace(/\f/g, '\\f');

            elementWebview.executeJavaScript("if(document.getElementById('webviewJS')==undefined){\
var el = document.createElement('script'); \
el.id='webviewJS';\
el.innerHTML = '"+ script + "';\
document.body.appendChild(el);}")
        })
        // 等待页面加载完成
        elementWebview.addEventListener('dom-ready', () => {
            console.log(IDwebview, "dom-ready")
            // 注入指定脚本
            var script = fs.readFileSync(pathJS, 'utf8')
            script = script.replace(/\\/g, '\\\\');
            script = script.replace(/'/g, '\\\'');
            script = script.replace(/"/g, '\\\"');
            script = script.replace(/\n/g, '\\n');
            script = script.replace(/\r/g, '\\r');
            script = script.replace(/\t/g, '\\t');
            // script = script.replace(/\b/g, '\\b');   
            script = script.replace(/\f/g, '\\f');
            elementWebview.executeJavaScript("if(document.getElementById('webviewJS')==undefined){\
var el = document.createElement('script'); \
el.id='webviewJS';\
el.innerHTML = '"+ script + "';\
document.body.appendChild(el);}")
        })

    },
    /**
     * 向Main发送消息
     * @param {Object} msg 要发送的信息, object.length必须为1
     * @returns {Promise}
     * 对方通过调用MainReply返回回来的消息.
     */
    sendToMain: function (msg) {
        // console.log(UniqueStr())

        return new Promise((resolve, reject) => {
            if (Object.keys(msg).length == 0) {
                reject("sendToMain : no msg")
            } else if (Object.keys(msg).length == 1) {

                /**
                 * 接收到Main回复后的处理函数
                 * @param {Event} event ipcRender Event
                 * @param {*} arg 返回的结果
                 */
                function handleMsg(event, arg) {
                    console.log("main asy reply : ", arg)
                    if (Object.keys(arg).length == 0) {
                        reject("sendToMain : receive nothing")
                    } else if (Object.keys(arg).length == 1) {
                        let key = (Object.keys(arg))[0]
                        if (typeof (arg[key]) == "string" && arg[key].indexOf("error :") == 0) {
                            reject("sendToMain : " + arg[key].substr(7))
                        } else {
                            resolve(arg)
                        }
                    } else {
                        reject("sendToMain : receive two many return arg")
                    }

                }

                let uStr = UniqueStr()
                ipcRender.send('msg-ipc-asy-to-main', uStr, msg);
                // 等待回复
                let listenerRe = ipcRender.once('msg-ipc-asy-main-reply-' + uStr, handleMsg)
                setTimeout(() => {

                    ipcRender.removeListener('msg-ipc-asy-main-reply-' + uStr, handleMsg)
                    reject("sendToMain : time out 10000")

                }, 10000);
            } else {
                reject("sendToMain : two many msg")
            }

        })
    },    
    /**
     * main process 处理消息并返回处理结果.
     * 例如 : 查询全部窗口的id
     * 该函数只负责给收到的信息进行分类和将处理结果返回给发送者.
     * 具体对消息进行响应的是fcnResponse
     * 
     * @function fcnResponse(key,arg)
     * @param {String} key
     * 发送数据的标识 query, execute...
     * @param {any} arg
     * 实际要传递的内容
     * return Promise
     */
    MainReply: function (fcnResponse) {
        ipcMain.on('msg-ipc-asy-to-main', function (event, uStr, arg) {

            console.log("========================")
            console.log("main asy receive from window  ", event.sender.getOwnerBrowserWindow().id)
            console.log("msg is : ", arg, Object.keys(arg).length)

            let returnValue = new Object;
            if (Object.keys(arg).length == 0) {
                returnValue[":"] = "error : MainReply no opertion input"
                event.sender.send('msg-ipc-asy-main-reply-' + uStr, returnValue)
            } else if (Object.keys(arg).length == 1) {
                let key = (Object.keys(arg))[0];
                // console.log(key)
                fcnResponse(key, arg[key]).then((re) => {
                    console.log("then : ", re)
                    returnValue[key + ":" + arg[key]] = re
                    event.sender.send('msg-ipc-asy-main-reply-' + uStr, returnValue)
                }).catch((error) => {
                    console.log("then : ", error)
                    returnValue[key + ":" + arg[key]] = 'error : ' + error
                    event.sender.send('msg-ipc-asy-main-reply-' + uStr, returnValue)
                })
            } else {
                for (key in arg) {
                    returnValue[key + ":" + arg[key]] = "error : MainReply two many input"
                }
                event.sender.send('msg-ipc-asy-main-reply-' + uStr, returnValue)
            }
        })
    },
    /**
     * 向某个窗口发送消息
     * @param {String} winID 
     * 要发送的窗口ID
     * @param {Object} msg 
     * 要发送的信息, object.length必须为1
     * @returns {Promise} 
     * 对方通过调用WinReply返回回来的消息.
     */    
    sendToWin: function (winID, msg) {

        return new Promise((resolve, reject) => {
            if (Object.keys(msg).length == 0) {
                reject("sendToWin : no msg")
            } else if (Object.keys(msg).length == 1) {

                // 为了removeListener需要单独封装
                function handleMsg(event, arg) {
                    // console.log("win asy reply : ", arg)
                    if (Object.keys(arg).length == 0) {
                        reject("sendToWin : receive nothing")
                    } else if (Object.keys(arg).length == 1) {
                        let key = (Object.keys(arg))[0]
                        if (typeof (arg[key]) == "string" && arg[key].indexOf("error :") == 0) {
                            reject("sendToWin" + arg[key].substr(7))
                        } else {
                            resolve(arg)
                        }
                    } else {
                        reject("sendToWin : receive two many")
                    }

                }

                let uStr = UniqueStr()
                ipcRender.sendTo(winID, 'msg-ipc-asy-to-win', uStr, msg);
                // 等待回复
                let listenerRe = ipcRender.once('msg-ipc-asy-win-reply-' + uStr, handleMsg)
                setTimeout(() => {

                    ipcRender.removeListener('msg-ipc-asy-win-reply-' + uStr, handleMsg)
                    reject("sendToWin : time out")

                }, 10000);
            } else {
                reject("sendToWin : two many msg")
            }

        })
    },
    /**
     * window 处理sendToWin函数发来的消息.
     * 该函数只负责给收到的信息进行分类和将处理结果返回给发送者.
     * 具体对消息进行响应的是fcnResponse
     * @param {Function} fcnResponse 
     * 实际处理的处理函数.
     * @returns {null}
     * 
     * @function fcnResponse(key,arg)
     * @param {String} key
     * 发送数据的标识 query, execute...
     * @param {any} arg
     * 实际要传递的内容
     * return Promise
     */      
    WinReply: function (fcnResponse) {
        ipcRender.on('msg-ipc-asy-to-win', function (event, uStr, arg) {

            console.log("========================")
            console.log("msg is : ", arg)

            let returnValue = new Object;
            if (Object.keys(arg).length == 0) {
                returnValue[":"] = "error : WinReply no opertion input"
                event.sender.send('msg-ipc-asy-win-reply-' + uStr, returnValue)
            } else if (Object.keys(arg).length == 1) {
                let key = (Object.keys(arg))[0];
                // console.log(key)
                fcnResponse(key, arg[key]).then((re) => {
                    console.log("then : ", re)
                    returnValue[key + ":" + arg[key]] = re
                    event.sender.send('msg-ipc-asy-win-reply-' + uStr, returnValue)
                }).catch((error) => {
                    console.log("then : ", error)
                    returnValue[key + ":" + arg[key]] = 'error : ' + error
                    event.sender.send('msg-ipc-asy-win-reply-' + uStr, returnValue)
                })
            } else {
                for (key in arg) {
                    returnValue[key + ":" + arg[key]] = "error : WinReply two many input"
                }
                event.sender.send('msg-ipc-asy-win-reply-' + uStr, returnValue)
            }


        })
    },
    /**
     * 窗口向该窗口下某个webview发送消息
     * @param {String} winID 
     * 要发送的窗口ID
     * @param {Object} msg 
     * 要发送的信息, object.length必须为1
     * @returns {Promise} 
     * 对方通过调用WebReply返回的消息
     */    
    HostSendToWeb: function (webviewID, msg) {

        return new Promise((resolve, reject) => {
            if (Object.keys(msg).length == 0) {
                reject("HostSendToWeb no msg")
            } else if (Object.keys(msg).length == 1) {

                // 为了removeListener需要单独封装
                function handleMsg(event) {
                    if (event.channel == 'msg-ipc-asy-web-reply-to-host-' + uStr) {
                        let arg = event.args[0]
                        if (Object.keys(arg).length == 0) {
                            reject("HostSendToWeb : receive nothing")
                        } else if (Object.keys(arg).length == 1) {
                            let key = (Object.keys(arg))[0]
                            if (typeof (arg[key]) == "string" && arg[key].indexOf("error :") == 0) {
                                reject("HostSendToWeb : " + arg[key].substr(7))
                            } else {
                                resolve(arg)
                            }
                        } else {
                            reject("HostSendToWeb : receive two many")
                        }
                    }


                }

                let uStr = UniqueStr()

                let web = document.getElementById(webviewID);
                if (web == undefined) {
                    reject("HostSendToWeb undefined webviewID")
                } else {
                    web.send('msg-ipc-asy-from-host-to-web', uStr, msg)
                }
                web.addEventListener('ipc-message', handleMsg, { once: true })
                setTimeout(() => {
                    web.removeEventListener('ipc-message', handleMsg)
                    reject("HostSendToWeb : time out")
                }, 5000);
            }

        })
    },
    /**
     * webview 处理HostSendToWeb函数发来的消息.
     * 该函数只负责给收到的信息进行分类和将处理结果返回给发送者.
     * 具体对消息进行响应的是fcnResponse
     * @param {Function} fcnResponse 
     * 实际处理的处理函数.
     * @returns {null}
     * 
     * @function fcnResponse(key,arg)
     * @param {String} key
     * 发送数据的标识 query, execute...
     * @param {any} arg
     * 实际要传递的内容
     * return Promise
     */         
    WebReply: function (fcnResponse) {

        ipcRender.on('msg-ipc-asy-from-host-to-web', function (event, uStr, arg) {

            console.log("========================")
            console.log("msg is : ", arg)
            let returnValue = new Object;

            if (Object.keys(arg).length == 0) {
                returnValue[":"] = "error : WinReply no opertion input"
                event.sender.sendToHost('msg-ipc-asy-web-reply-to-host-' + uStr, returnValue)
            } else if (Object.keys(arg).length == 1) {
                let key = (Object.keys(arg))[0];
                // console.log(key)
                fcnResponse(key, arg[key]).then((re) => {
                    console.log("then : ", re)
                    returnValue[key + ":" + arg[key]] = re
                    event.sender.sendToHost('msg-ipc-asy-web-reply-to-host-' + uStr, returnValue)
                }).catch((error) => {
                    console.log("then : ", error)
                    returnValue[key + ":" + arg[key]] = 'error : ' + error
                    event.sender.sendToHost('msg-ipc-asy-web-reply-to-host-' + uStr, returnValue)
                })
            } else {
                for (key in arg) {
                    returnValue[key + ":" + arg[key]] = "error : WinReply two many input"
                }
                event.sender.sendToHost('msg-ipc-asy-web-reply-to-host-' + uStr, returnValue)
            }

        })
    },
    /**
     * webview像其所属窗口发送消息
     * @param {Object} msg 
     * 要发送的信息, object.length必须为1
     * @returns {Promise} 
     * 对方通过调用WinReplyWeb返回回来的消息
     */        
    WebToHost: function (msg) {

        return new Promise((resolve, reject) => {
            if (Object.keys(msg).length == 0) {
                reject("WebToHost : no msg")
            } else if (Object.keys(msg).length == 1) {

                // 为了removeListener需要单独封装
                function handleMsg(event, arg) {
                    // console.log("win asy reply : ", arg)
                    if (Object.keys(arg).length == 0) {
                        reject("WebToHost : receive nothing")
                    } else if (Object.keys(arg).length == 1) {
                        let key = (Object.keys(arg))[0]
                        if (typeof (arg[key]) == "string" && arg[key].indexOf("error :") == 0) {
                            reject("WebToHost : " + arg[key].substr(7))
                        } else {
                            resolve(arg)
                        }
                    } else {
                        reject("WebToHost : receive two many")
                    }

                }

                let uStr = UniqueStr()
                ipcRender.sendToHost('msg-ipc-asy-web-to-host', uStr, msg);
                // 等待回复
                let listenerRe = ipcRender.once('msg-ipc-asy-win-reply-web-' + uStr, handleMsg)
                setTimeout(() => {

                    ipcRender.removeListener('msg-ipc-asy-win-reply-web-' + uStr, handleMsg)
                    reject("WebToHost : time out")

                }, 5000);
            } else {
                reject("WebToHost : two many msg")
            }

        })
    },
    /**
     * window 处理WebToHost函数发来的消息.
     * 该函数只负责给收到的信息进行分类和将处理结果返回给发送者.
     * 具体对消息进行响应的是fcnResponse
     * @param {String} webviewID
     * 响应具体的webview ID
     * @param {Function} fcnResponse 
     * 实际处理的处理函数.
     * @returns {null}
     * 
     * @function fcnResponse(key,arg)
     * @param {String} key
     * 发送数据的标识 query, execute...
     * @param {any} arg
     * 实际要传递的内容
     * return Promise
     */     
    WinReplyWeb: function (webviewID, fcnResponse) {
        let web = document.getElementById(webviewID);
        web.addEventListener('ipc-message', (event) => {
            console.log("webview-message-listen")
            // console.log(event)
            if (event.channel == 'msg-ipc-asy-web-to-host') {
                let returnValue = new Object;
                let uStr = event.args[0]
                let arg = event.args[1]

                let returnValue = new Object;

                if (Object.keys(arg).length == 0) {
                    returnValue[":"] = "error : WinReplyWeb no opertion input"
                    web.send("msg-ipc-asy-win-reply-web-" + uStr, returnValue)
                } else if (Object.keys(arg).length == 1) {
                    let key = (Object.keys(arg))[0];
                    // console.log(key)
                    fcnResponse(key, arg[key]).then((re) => {
                        console.log("then : ", re)
                        returnValue[key + ":" + arg[key]] = re
                        web.send("msg-ipc-asy-win-reply-web-" + uStr, returnValue)
                    }).catch((error) => {
                        console.log("then : ", error)
                        returnValue[key + ":" + arg[key]] = 'error : ' + error
                        web.send("msg-ipc-asy-win-reply-web-" + uStr, returnValue)
                    })
                } else {
                    for (key in arg) {
                        returnValue[key + ":" + arg[key]] = "error : WinReplyWeb two many input"
                    }
                    web.send("msg-ipc-asy-win-reply-web-" + uStr, returnValue)
                }
            }

        })

    }      

}