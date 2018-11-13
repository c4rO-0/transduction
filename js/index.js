console.log(process.versions.electron)
let status = "webviewSkype"
$(document).ready(function () {
    $("#switch").on("click", function () {
        if (status == "webviewSkype") {
            $("#webviewSkype").hide()
            $("#webviewWechat").show()
            status = "webviewWechat"
        } else if (status == "webviewWechat") {
            $("#webviewSkype").show()
            $("#webviewWechat").hide()
            status = "webviewSkype"
        }
    })
    let webWechat = document.getElementById("webviewSkype").openDevTools();
    // webWechat.addEventListener("dom-ready", function () { webWechat.openDevTools(); });
})

