// function start() {
    // for index.js

    console.log("start action js ...")

    

    $('#modal-wechat').on('show.bs.modal', function (e) {
        console.log("show modal")
        document.getElementById('modal-wechat').querySelector('webview').insertCSS('.login.ng-scope{min-width: unset;}')
        $(this).css('left', '')
    })

    document.getElementById('modal-wechat').querySelector('webview').addEventListener('load-commit', function () {
        this.insertCSS('.login.ng-scope{min-width: unset;}')
    })
    document.getElementById('modal-wechat').querySelector('webview').addEventListener('dom-ready', function () {
        this.insertCSS('.login.ng-scope{min-width: unset;}')
    })



// }