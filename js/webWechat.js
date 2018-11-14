window.onload = function () {

    const core = require("../js/core.js")
    const watchJS = require("../toolkit/watch-1.4.2.js")

    // 微信UserName是ID, RemarkName是给别人取得昵称 NickName是本人的微信名

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

            console.log(objSlide)   
            if(objSlide.length>0){
                // 新来消息
                console.log("----------------------")    
                console.log("new MSG & User : ")    


                    let newMSG = objSlide[objSlide.length-1]
                    let content = newMSG["Content"]
                    let fromUserName = newMSG["FromUserName"]
                    let time = newMSG["MMDigestTime"]
                    let remarkName =''
                    let nickName = ''
                    if(contacts[fromUserName] != undefined){
                        remarkName = (contacts[fromUserName])["RemarkName"]
                        nickName = (contacts[fromUserName])["NickName"]
                    }
                    // 获取有几条未读消息
                    
                    let unread = parseInt($("div.ng-scope div [data-username='"+fromUserName+"'] i").text())
                    if(unread == NaN){
                        unread = 0
                    }

                    console.log("ID :", fromUserName)
                    console.log("Name :", nickName, remarkName)
                    console.log("content :", content)
                    console.log("time :", time)
                    console.log("unread :", unread)                    

            }

            watchJS.watch(objSlide, (prop, action, newMSG) => {
                
                if (action == 'push') {
                    // 消息有更新
                    console.log("----------------------")    
                    console.log("new MSG : ", typeof(newMSG))    
                    
                    let content = newMSG["Content"]
                    let fromUserName = newMSG["FromUserName"]
                    let time = newMSG["MMDigestTime"]

                    let remarkName =''
                    let nickName = ''
                    if(contacts[fromUserName] != undefined){
                        remarkName = (contacts[fromUserName])["RemarkName"]
                        nickName = (contacts[fromUserName])["NickName"]
                    }
                    
                    // 获取有几条未读消息
                    
                    let unread = parseInt($("div.ng-scope div [data-username='"+fromUserName+"'] i").text())
                    if(unread == NaN){
                        unread = 0
                    }

                    console.log("ID :", fromUserName)
                    console.log("Name :", nickName, remarkName)
                    console.log("content :", content)
                    console.log("time :", time)
                    console.log("unread :", unread)


                }


            }, 0, true)
        }, false)

        // 尝试拦截notification
        window.Notification = function(title,ops){
            // title is the title of the notifations, ops is the config object

            console.log('-----notification------')
            console.log(title)
            console.log(ops)
        };

    })

}
