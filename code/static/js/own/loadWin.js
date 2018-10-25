const electron = require("electron");
const ipc = electron.ipcRenderer

//  读取本地文件
const fs = require('fs');

const path = require('path')

// 在webview动态插入脚本
// IDwebview : str : webview id 
// pathJS : str : 绝对路径
function webviewDynamicInsertJS(IDwebview,pathJS){

    let elementWebview = document.getElementById(IDwebview)
    // 发现URL变化
    elementWebview.addEventListener('did-navigate-in-page', (event) => {
        // console.log("url change : ", event.isMainFrame, event.url)

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
        // 注入指定脚本
        var script = fs.readFileSync(pathJS, 'utf8')
        elementWebview.executeJavaScript("if(document.getElementById('webviewJS')==undefined){\
        var el = document.createElement('script'); \
        el.id='webviewJS';\
        el.innerHTML = "+ script + ";\
        document.body.appendChild(el);}")
    })

}
// =========等待消息==============
//  main消息
ipc.on('msg-ipc-asy-main-reply', function (event, arg) {
    console.log("main asy reply : ", arg)

})
// 其他消息


$(document).ready(function () {
    $("#goto-skype").on("click", () => {
        $("#webview-wechat").css("visibility", "hidden")
        $("#webview-skype").css("visibility", "visible")
    })
    $("#goto-wechat").on("click", () => {
        $("#webview-wechat").css("visibility", "visible")
        $("#webview-skype").css("visibility", "hidden")
    })


    // =========向main发送消息==============
    let ASobjBtn = document.getElementById('asynchronous-messageBtn')

    let SobjBtn = document.getElementById('synchronous-messageBtn')

    ASobjBtn.addEventListener('click', function () {
        console.log("index : msg 1");
        ipc.send('msg-ipc-asy-to-main', { "type": "msg from index" })
    })

    SobjBtn.addEventListener('click', function () {
        console.log("index : msg 2");
        let msgReply = ipc.sendSync('msg-ipc-sy-to-main', { "type": "msg from index" })
        console.log("main sy reply : ", msgReply)
    })

    // 监测webview, 像页面注入脚本
    webviewDynamicInsertJS("webview-skype", path.resolve('./static/js/own/skype_webview.js'))

});

