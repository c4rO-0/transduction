window.onload = function () {

    const core = require("./core.js")
    const watchJS = require("../toolkit/watch-1.4.2.js")
    // const http = require('http')
    const fs = require('fs')
    const { net } = require('electron').remote
    // window.$ = window.jQuery = require("../toolkit/jquery-3.3.1.min.js")

    console.log("from preload :", process.versions.electron)

    $("#id-send").on('click', ()=>{
        console.log("prepare send from preload")
        core.WebToHost({"test":"从testPreload发送"})
    })
    

}