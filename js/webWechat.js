window.onload = function () {

    const core = require("../js/core.js")
    const watchJS = require("../toolkit/watch-1.4.2.js")


    // 通过RemarkName查找用户ID
    function getUsernameByRemarkName(remarkName) {
        let contact = window._contacts
        for (let username in contact) {
            // console.log(contact[username])
            // console.log((contact[username]))
            if ((contact[username])["RemarkName"] == remarkName) {
                return username
            }

        }

        return undefined
    }

    $(document).ready(function () {

        let contacts = window._contacts
        let chatContent = window._chatContent

        // let remarkName = "乐宏昊"


        // 等待拉取联系人
        core.waitForKeyElements("div.contact_item ", () => {


            console.log("----------contact change----------")

            // 联系人有变化
            if ($("#navContact").scrollTop() + $("#navContact")[0].clientHeight != $("#navContact")[0].scrollHeight) {
                $("#navContact").scrollTop(0)
                $("#navContact").scrollTop($("#navContact")[0].scrollHeight)

                // 更新联系人
                contacts = window._contacts
                // 更新对话
                chatContent = window._chatContent

                // 临时放在这
                // let username = getUsernameByRemarkName(remarkName)

            }


        }, false)


        core.waitForKeyElements("div.chat_item.slide-left.ng-scope", (chatSlide) => {
            console.log("chat slide added : ", $(chatSlide).attr("data-username"))
            let objSlide = chatContent[$(chatSlide).attr("data-username")]
            watchJS.watch(objSlide, (prop, action) => {

                if (action == 'push') {
                    // 消息有更新
                    console.log("MSG update : ")
                    console.log(objSlide)

                }


            }, 0, true)
        }, false)

        // 监控chat content

    })

}