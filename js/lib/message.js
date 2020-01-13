/**
 * all message passed here
 */

// ====================================
//  require
// ------------------------------------
// 声明和调用electron函数
const electron = require("electron");
const ipcRender = electron.ipcRenderer
const ipcMain = electron.ipcMain

const $ = require('jquery')

const {Basic} = require("basic")


class Message {
    constructor() {

    }
    /**
     * 向Main发送消息
     * @param {Object} msg 要发送的信息, object.length必须为1
     * @returns {Promise}
     * 对方通过调用MainReply返回回来的消息.
     */
    sendToMain(msg) {
        // console.log(Basic.uniqueStr())

        return Promise.race([new Promise((resolve, reject) => {
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

                let uStr = Basic.uniqueStr()
                ipcRender.send('msg-ipc-asy-to-main', uStr, msg);
                // 等待回复
                let listenerRe = ipcRender.once('msg-ipc-asy-main-reply-' + uStr, handleMsg)
                setTimeout(() => {

                    ipcRender.removeListener('msg-ipc-asy-main-reply-' + uStr, handleMsg)
                    reject("HostSendToWeb : time out")

                }, 5000000);
            } else {
                reject("sendToMain : two many msg")
            }
        })]) //,
        // new Promise((resolve, reject) => {
        //     let erTime = setTimeout(() => {
        //         clearTimeout(erTime)
        //         reject("HostSendToWeb : time out")
        //     }, 5000);
        // })])
    }
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
    MainReply(fcnResponse) {
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
                    returnValue[key] = re
                    event.sender.send('msg-ipc-asy-main-reply-' + uStr, returnValue)
                }).catch((error) => {
                    console.log("then : ", error)
                    returnValue[key] = 'error : ' + error
                    event.sender.send('msg-ipc-asy-main-reply-' + uStr, returnValue)
                })
            } else {
                for (key in arg) {
                    returnValue[key] = "error : MainReply two many input"
                }
                event.sender.send('msg-ipc-asy-main-reply-' + uStr, returnValue)
            }
        })
    }

    /**
 * 向某个窗口发送消息
 * @param {Int} winID 
 * 要发送的窗口ID
 * @param {Object} msg 
 * 要发送的信息, object.length必须为1
 * @returns {Promise} 
 * 对方通过调用WinReply返回回来的消息.
 */
    sendToWin(winID, msg) {

        return Promise.race([new Promise((resolve, reject) => {
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

                let uStr = Basic.uniqueStr()
                ipcRender.sendTo(winID, 'msg-ipc-asy-to-win', uStr, msg);
                // 等待回复
                let listenerRe = ipcRender.once('msg-ipc-asy-win-reply-' + uStr, handleMsg)
                setTimeout(() => {

                    ipcRender.removeListener('msg-ipc-asy-win-reply-' + uStr, handleMsg)
                    reject("HostSendToWeb : time out")

                }, 5000000);
            } else {
                reject("sendToWin : two many msg")
            }

        })]) //,
        // new Promise((resolve, reject) => {
        //     let erTime = setTimeout(() => {
        //         clearTimeout(erTime)
        //         reject("HostSendToWeb : time out")
        //     }, 5000);
        // })])
    }
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
    WinReply(fcnResponse) {

        // win to win
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
                    returnValue[key] = re
                    event.sender.send('msg-ipc-asy-win-reply-' + uStr, returnValue)
                }).catch((error) => {
                    console.log("then : ", error)
                    returnValue[key] = 'error : ' + error
                    event.sender.send('msg-ipc-asy-win-reply-' + uStr, returnValue)
                })
            } else {
                for (key in arg) {
                    returnValue[key] = "error : WinReply two many input"
                }
                event.sender.send('msg-ipc-asy-win-reply-' + uStr, returnValue)
            }


        })

        // main to win
        ipcRender.on('msg-ipc-asy-main-to-win', function (event, uStr, arg) {

            console.log("========================")
            console.log("msg is : ", arg)

            let returnValue = new Object;
            if (Object.keys(arg).length == 0) {
                returnValue[":"] = "error : WinReply no opertion input"
                event.sender.send('msg-ipc-asy-win-reply-main-' + uStr, returnValue)
            } else if (Object.keys(arg).length == 1) {
                let key = (Object.keys(arg))[0];
                // console.log(key)
                fcnResponse(key, arg[key]).then((re) => {
                    console.log("then : ", re)
                    returnValue[key + ":" + arg[key]] = re
                    event.sender.send('msg-ipc-asy-win-reply-main-' + uStr, returnValue)
                }).catch((error) => {
                    console.log("then : ", error)
                    returnValue[key] = 'error : ' + error
                    event.sender.send('msg-ipc-asy-win-reply-main-' + uStr, returnValue)
                })
            } else {
                for (key in arg) {
                    returnValue[key] = "error : WinReply two many input"
                }
                event.sender.send('msg-ipc-asy-win-reply-main-' + uStr, returnValue)
            }

        })
    }

    /**
* 向某个窗口发送消息
* @param {} win
* 要发送的窗口ID
* @param {Object} msg 
* 要发送的信息, object.length必须为1
* @returns {Promise} 
* 对方通过调用WinReply返回回来的消息.
*/
    mainSendToWin(win, msg) {

        return Promise.race([new Promise((resolve, reject) => {
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

                let uStr = Basic.uniqueStr()
                win.webContents.send('msg-ipc-asy-main-to-win', uStr, msg);
                // 等待回复
                let listenerRe = ipcMain.once('msg-ipc-asy-win-reply-main-' + uStr, handleMsg)
                setTimeout(() => {

                    ipcMain.removeListener('msg-ipc-asy-win-reply-main-' + uStr, handleMsg)
                    reject("mainSendToWin : time out")

                }, 5000000);
            } else {
                reject("mainSendToWin : two many msg")
            }

        })]) //,
        // new Promise((resolve, reject) => {
        //     let erTime = setTimeout(() => {
        //         clearTimeout(erTime)
        //         reject("HostSendToWeb : time out")
        //     }, 5000);
        // })])
    }

    /**
     * 窗口向该窗口下某个webview发送消息
     * @param {String} webSelector
     * webview的jq selecor 
     * @param {Object} msg 
     * 要发送的信息, object.length必须为1
     * @returns {Promise} 
     * 对方通过调用WebReply返回的消息
     */
    HostSendToWeb(webSelector, msg, timeout = 5000) {

        return Promise.race([new Promise((resolve, reject) => {
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

                        web.removeEventListener('ipc-message', handleMsg)
                    }


                }

                let uStr = Basic.uniqueStr()

                // let web = document.getElementById(webviewID);
                let web = $(webSelector).get(0);
                if (web == undefined) {
                    reject("HostSendToWeb undefined webSelector")
                } else {
                    web.send('msg-ipc-asy-from-host-to-web', uStr, msg)
                }

                web.addEventListener('ipc-message', handleMsg)
                setTimeout(() => {
                    web.removeEventListener('ipc-message', handleMsg)
                    reject("HostSendToWeb : time out")
                }, timeout);
            }

        }),
        new Promise((resolve, reject) => {
            let erTime = setTimeout(() => {
                clearTimeout(erTime)
                reject("HostSendToWeb : time out")
            }, timeout);
        })])
    }

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
    WebReply(fcnResponse) {

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
    }

    /**
     * webview像其所属窗口发送消息
     * @param {Object} msg 
     * 要发送的信息, object.length必须为1
     * @returns {Promise} 
     * 对方通过调用WinReplyWeb返回回来的消息
     */
    WebToHost(msg) {

        return Promise.race([new Promise((resolve, reject) => {
            if (Object.keys(msg).length == 0) {
                reject("WebToHost : no msg")
            } else if (Object.keys(msg).length == 1) {

                // 为了removeListener需要单独封装
                function handleMsg(event, arg) {
                    console.log("win asy reply : ", arg)
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

                let uStr = Basic.uniqueStr()
                ipcRender.sendToHost('msg-ipc-asy-web-to-host', uStr, msg);
                // 等待回复
                let listenerRe = ipcRender.once('msg-ipc-asy-win-reply-web-' + uStr, handleMsg)
                setTimeout(() => {

                    ipcRender.removeListener('msg-ipc-asy-win-reply-web-' + uStr, handleMsg)

                }, 5000000);
            } else {
                reject("WebToHost : two many msg")
            }

        })]) //,
        // new Promise((resolve, reject) => {
        //     let erTime = setTimeout(() => {
        //         clearTimeout(erTime)
        //         reject("HostSendToWeb : time out")
        //     }, 5000);
        // })])
    }

    /**
     * window 处理WebToHost函数发来的消息.
     * 该函数只负责给收到的信息进行分类和将处理结果返回给发送者.
     * 具体对消息进行响应的是fcnResponse
     * @param {String} webSelector
     * webview jq selector
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
    WinReplyWeb(webSelector, fcnResponse) {
        // let web = document.getElementById(webviewID);

        if ($(webSelector).length == 0) {
            console.log(webSelector, ' not exist')
            return
        }
        let web = $(webSelector).get(0);

        web.addEventListener('ipc-message', (event) => {
            console.log("webview-message-listen")
            // console.log(event)
            if (event.channel == 'msg-ipc-asy-web-to-host') {
                let returnValue = new Object;
                let uStr = event.args[0]
                let arg = event.args[1]

                if (Object.keys(arg).length == 0) {
                    returnValue[":"] = "error : WinReplyWeb no opertion input"
                    web.send("msg-ipc-asy-win-reply-web-" + uStr, returnValue)
                } else if (Object.keys(arg).length == 1) {
                    let key = (Object.keys(arg))[0];
                    // console.log(key)
                    fcnResponse(key, arg[key]).then((re) => {
                        console.log("then : ", re)
                        returnValue[key] = re
                        web.send("msg-ipc-asy-win-reply-web-" + uStr, returnValue)
                    }).catch((error) => {
                        console.log("then : ", error)
                        returnValue[key] = 'error : ' + error
                        web.send("msg-ipc-asy-win-reply-web-" + uStr, returnValue)
                    })
                } else {
                    for (key in arg) {
                        returnValue[key] = "error : WinReplyWeb two many input"
                    }
                    web.send("msg-ipc-asy-win-reply-web-" + uStr, returnValue)
                }
            }

        })

    }
}

module.exports = [Message]
