(function () {
    // for index.js

    loadWebview("wechat", "https://wx2.qq.com", core.strUserAgentWin)



    $('.modal').on('show.bs.modal', function (e) {
        document.getElementById('modal-wechat').querySelector('webview').insertCSS('.login.ng-scope{min-width: unset;}')
        $(this).css('left', '')
    })

    document.getElementById('modal-wechat').querySelector('webview').addEventListener('load-commit', function () {
        this.insertCSS('.login.ng-scope{min-width: unset;}')
    })
    document.getElementById('modal-wechat').querySelector('webview').addEventListener('dom-ready', function () {
        this.insertCSS('.login.ng-scope{min-width: unset;}')
    })


    // wechat
    core.WinReplyWeb(webTag2Selector("wechat"), (key, arg) => {
        return respFuncWinReplyWeb("wechat", key, arg)
    })
})