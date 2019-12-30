module.exports = {
    action: function () {

        // for index.js
        console.log("start dingtalk action js ...")

        $('#modal-dingtalk-NPUS8Z8RS3').on('show.bs.modal', function (e) {
            
        })

        $('#modal-dingtalk-NPUS8Z8RS3').on('load-commit', function () {

        })
        $('#modal-dingtalk-NPUS8Z8RS3').on('dom-ready', function () {
            this.insertCSS('\
            #layout-main {\
                width:-webkit-fill-available !important;\
                min-width:490px;\
                max-width:1000px;\
            }\
            #content-pannel {\
                flex:1 !important;\
            }\
            #menu-pannel {\
                width:50px !important;\
            }\
            #chat-box > div > div {\
                min-width: 320px;\
            }\
            ')
        })

    }
}