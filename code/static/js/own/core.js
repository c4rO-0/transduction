//  库函数

// ============require=================
const electron = require("electron");
const ipcRender = electron.ipcRenderer
const ipcMain = electron.ipcMain

//  读取本地文件
const fs = require('fs');

console.log("load core");

module.exports = {
// ==========var====================


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
            elementWebview.executeJavaScript("if(document.getElementById('webviewJS')==undefined){\
        var el = document.createElement('script'); \
        el.id='webviewJS';\
        el.innerHTML = "+ script + ";\
        document.body.appendChild(el);}")
        })
        // 等待页面加载完成
        elementWebview.addEventListener('dom-ready', () => {
            console.log(IDwebview, "dom-ready")
            // 注入指定脚本
            var script = fs.readFileSync(pathJS, 'utf8')
            elementWebview.executeJavaScript("if(document.getElementById('webviewJS')==undefined){\
        var el = document.createElement('script'); \
        el.id='webviewJS';\
        el.innerHTML = "+ script + ";\
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
        ipcMain.on('msg-ipc-asy-to-win', function (event, arg) {

            console.log("========================")
            console.log("main asy receive from window  ", event.sender.getOwnerBrowserWindow().id)
            console.log("msg is : ", arg)
            let returnValue = new Object;

            for (let key in arg) {
                returnValue[key + ":" + arg[key]] = fcnResponse(key, arg[key])
            }
       
            event.sender.send('msg-ipc-asy-win-reply', returnValue)

        })
    }
};