//  库函数

// ============require=================
const electron = require("electron");
const ipcRender = electron.ipcRenderer
const ipcMain = electron.ipcMain


//  读取本地文件
const fs = require('fs');
const $ = require(process.env.PWD + '/static/js/jQuery/jquery-3.3.1.min.js')

console.log("load core");

    /*--- waitForKeyElements():  A utility function, for Greasemonkey scripts,
        that detects and handles AJAXed content.
        auther : BrockA
        homepage : https://gist.github.com/BrockA/2625891#file-waitforkeyelements-js
        Usage example:

            waitForKeyElements (
                "div.comments"
                , commentCallbackFunction
            );

            //--- Page-specific function to do what we want when the node is found.
            function commentCallbackFunction (jNode) {
                jNode.text ("This comment changed by waitForKeyElements().");
            }

        IMPORTANT: This function requires your script to have loaded jQuery.
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

module.exports = {
    // ==========var====================

    /*--- waitForKeyElements():  A utility function, for Greasemonkey scripts,
        that detects and handles AJAXed content.
        auther : BrockA
        homepage : https://gist.github.com/BrockA/2625891#file-waitforkeyelements-js
        Usage example:

            waitForKeyElements (
                "div.comments"
                , commentCallbackFunction
            );

            //--- Page-specific function to do what we want when the node is found.
            function commentCallbackFunction (jNode) {
                jNode.text ("This comment changed by waitForKeyElements().");
            }

        IMPORTANT: This function requires your script to have loaded jQuery.
    */
    waitForKeyElements : function (
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
    },
    insertReady : function (){
        if ($('#electronReady') ==null || $('#electronReady').length == 0) {
          $("body").append("<p id='electronReady' style='visibility:hidden;'> electronReady </p>")
        }
      },
    // ===========fuction===============
    // 在webview动态插入脚本
    // IDwebview : str : webview id 
    // pathJS : str : 绝对路径
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

    //  发送消息
    //  向main发送异步消息
    //  in : dict msg 要发送的信息
    //  return  Promise
    //  resolve : 返回的消息, 字典
    //  reject : time out
    sendToMain: function (msg) {

        return new Promise((resolve, reject) => {
            ipcRender.send('msg-ipc-asy-to-main', msg);
            // 等待回复
            ipcRender.on('msg-ipc-asy-main-reply', function (event, arg) {
                console.log("main asy reply : ", arg)
                resolve(arg)
            })
            setTimeout(() => {
                reject("time out")
            }, 5000);

        })
    },

    //  向main发送同步消息
    //  return  字典
    sendToMainSync: function (msg) {
        return ipcRender.sendSync('msg-ipc-sy-to-main', msg)
    },


    // main处理消息函数

    // ===========其他窗口消息===============
    // 虽然send后面接非常多的参数(channel,[arg1,arg2,....]) 
    // 但是为了统一接口, 只接受一个object参数
    MainReply: function (fcnResponse) {
        ipcMain.on('msg-ipc-asy-to-main', function (event, arg) {

            console.log("========================")
            console.log("main asy receive from window  ", event.sender.getOwnerBrowserWindow().id)
            console.log("msg is : ", arg)
            let returnValue = new Object;

            for (let key in arg) {
                returnValue[key + ":" + arg[key]] = fcnResponse(key, arg[key])
            }

            event.sender.send('msg-ipc-asy-main-reply', returnValue)

        })
    },

    MainReplySync: function (fcnResponse) {
        ipcMain.on('msg-ipc-sy-to-main', function (event, arg) {

            console.log("========================")
            console.log("main sy receive from window  ", event.sender.getOwnerBrowserWindow().id)
            console.log("msg is : ", arg)
            let returnValue = new Object;

            for (let key in arg) {
                returnValue[key + ":" + arg[key]] = fcnResponse(key, arg[key])
            }

            event.returnValue = returnValue
        })
    },

    sendToWin: function (winID, msg) {

        return new Promise((resolve, reject) => {
            ipcRender.sendTo(winID, 'msg-ipc-asy-to-win', msg);
            // 等待回复
            ipcRender.on('msg-ipc-asy-win-reply', function (event, arg) {
                console.log("main asy reply : ", arg)
                resolve(arg)
            })
            setTimeout(() => {
                reject("time out")
            }, 5000);

        })
    },

    WinReply: function (fcnResponse) {
        ipcRender.on('msg-ipc-asy-to-win', function (event, arg) {

            console.log("========================")
            console.log("msg is : ", arg)
            let returnValue = new Object;

            for (let key in arg) {
                returnValue[key + ":" + arg[key]] = fcnResponse(key, arg[key])
            }

            event.sender.send('msg-ipc-asy-win-reply', returnValue)

        })
    },

    WinSendToWeb : function (winID, webviewID, msg) {
        return new Promise((resolve, reject) => {
            ipcRender.sendTo(winID, 'msg-ipc-asy-to-web', webviewID, msg);
            // 等待回复
            ipcRender.on('msg-ipc-asy-web-reply', function (event, arg) {
                console.log("main asy reply : ", arg)
                resolve(arg)
            })
            setTimeout(() => {
                reject("time out")
            }, 5000);

        })
    },

    WebReplyInWin: function () {
        ipcRender.on('msg-ipc-asy-to-web', function (event, webviewID, arg) {

            let returnValue = new Object;
            let web = document.getElementById(webviewID);

            if(web == undefined){
                for (let key in arg) {
                    returnValue[key + ":" + arg[key]] = undefined
                }
            }else{
                // 
                web.executeJavaScript("WebReplyInWeb()")
            }
            
            ipcRender.on('msg-ipc-asy-from-web-to-win', function (event, webviewID, arg){
                returnValue = arg
            })
            
            event.sender.send('msg-ipc-asy-win-reply', returnValue)

        })



        
    }
};