module.exports = {
    action: function () {

        // for index.js
        console.log("start wechat action js ...")

        $('#modal-wechat-01T7UUBCR2').on('show.bs.modal', function (e) {
            // console.log("show modal")
            document.getElementById('modal-wechat-01T7UUBCR2').querySelector('webview').insertCSS('.login.ng-scope{min-width: unset;}')
            $(this).css('left', '')
        })

        document.getElementById('modal-wechat-01T7UUBCR2').querySelector('webview').addEventListener('load-commit', function () {
            this.insertCSS('.login.ng-scope{min-width: unset;}')
        })
        document.getElementById('modal-wechat-01T7UUBCR2').querySelector('webview').addEventListener('dom-ready', function () {
            this.insertCSS('.login.ng-scope{min-width: unset;}')
        })

    }
}