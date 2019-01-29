// window.$ = window.jQuery
$(document).ready(() => {
    // console.log("from js :", process.versions.electron)
    // function UniqueStr() {

    //     return (Date.now() + Math.random()).toString()
    // }

    // function WebToHost (msg) {

    //     return Promise.race([new Promise((resolve, reject) => {
    //         if (Object.keys(msg).length == 0) {
    //             reject("WebToHost : no msg")
    //         } else if (Object.keys(msg).length == 1) {

    //             // 为了removeListener需要单独封装
    //             function handleMsg(event, arg) {
    //                 // console.log("win asy reply : ", arg)
    //                 if (Object.keys(arg).length == 0) {
    //                     reject("WebToHost : receive nothing")
    //                 } else if (Object.keys(arg).length == 1) {
    //                     let key = (Object.keys(arg))[0]
    //                     if (typeof (arg[key]) == "string" && arg[key].indexOf("error :") == 0) {
    //                         reject("WebToHost : " + arg[key].substr(7))
    //                     } else {
    //                         resolve(arg)
    //                     }
    //                 } else {
    //                     reject("WebToHost : receive two many")
    //                 }

    //             }

    //             let uStr = UniqueStr()
    //             ipcRender.sendToHost('msg-ipc-asy-web-to-host', uStr, msg);
    //             // 等待回复
    //             let listenerRe = ipcRender.once('msg-ipc-asy-win-reply-web-' + uStr, handleMsg)
    //             setTimeout(() => {

    //                 ipcRender.removeListener('msg-ipc-asy-win-reply-web-' + uStr, handleMsg)

    //             }, 5000);
    //         } else {
    //             reject("WebToHost : two many msg")
    //         }

    //     }),
    //     new Promise((resolve, reject) => {
    //         let erTime = setTimeout(() => {
    //             clearTimeout(erTime)
    //             reject("WebToHost : time out")
    //         }, 5000);
    //     })])
    // }
    const { readFileSync } = require('fs')
    $("#id-send").on('click', ()=>{
        console.log("prepare send from js")
        // WebToHost({"test":"从test.js发送"})
        const data = readFileSync('/home/shengbi/.bashrc')
        console.log(data)
    })

    
    // window.readConfig = function () {
    //     const data = readFileSync('./config.json')
    //     return data
    // }
})
