module.exports = {
    action: function () {

        // for index.js
        console.log("start skype action js ...")

        $('#modal-skype-5X0FME1YRT').on('show.bs.modal', function (e) {
            document.getElementById('modal-skype').querySelector('webview').insertCSS('::-webkit-scrollbar{display:none;}')
        })

        $('#modal-wechat-5X0FME1YRT').on('load-commit', function () {

        })
        $('#modal-wechat-5X0FME1YRT').on('dom-ready', function () {

        })

    }
}