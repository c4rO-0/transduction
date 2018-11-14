window.onload = function () {

    const core = require("../js/core.js")
    const watchJS = require("../toolkit/watch-1.4.2.js")
    const http = require('http')
    const fs = require('fs')


    let wechatMSGType ={
        MSGTYPE_TEXT: 1,
        MSGTYPE_IMAGE: 3,
        MSGTYPE_VOICE: 34,
        MSGTYPE_VIDEO: 43,
        MSGTYPE_MICROVIDEO: 62,
        MSGTYPE_EMOTICON: 47,
        MSGTYPE_APP: 49,
        MSGTYPE_VOIPMSG: 50,
        MSGTYPE_VOIPNOTIFY: 52,
        MSGTYPE_VOIPINVITE: 53,
        MSGTYPE_LOCATION: 48,
        MSGTYPE_STATUSNOTIFY: 51,
        MSGTYPE_SYSNOTICE: 9999,
        MSGTYPE_POSSIBLEFRIEND_MSG: 40,
        MSGTYPE_VERIFYMSG: 37,
        MSGTYPE_SHARECARD: 42,
        MSGTYPE_SYS: 1e4
    }


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

    /**
     * 
     * @param {Object} MSG 微信单条消息
     * @returns {Object} 拿到我们关系的内容
     */
    function grepMSG(contacts,MSG){

        let fromUserName = MSG["FromUserName"]
        let toUserName = MSG["ToUserName"]
        let time = MSG["MMDigestTime"]
        let remarkName =''
        let nickName = ''
        if(contacts[fromUserName] != undefined){
            remarkName = (contacts[fromUserName])["RemarkName"]
            nickName = (contacts[fromUserName])["NickName"]
        }
        // 获取有几条未读消息
        let strUnread = $("div.ng-scope div [data-username='"+fromUserName+"'] i").text()
        let unread = strUnread == '' ? 0 : parseInt(strUnread)
        let type = MSG["MsgType"]
        let content = MSG["MMDigest"]
        let MSGID = MSG["MsgId"] 

        return {"fromUserName":fromUserName,
                "toUserName":toUserName,
                "MSGID":MSGID,
                "time":time,
                "remarkName":remarkName,
                "nickName":nickName,
                "unread":unread,
                "type":type,
                "content":content
                }


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
                    let MSG = grepMSG(contacts,newMSG)


                    console.log("ID :", MSG.fromUserName, "->", MSG.toUserName)
                    console.log("type :", MSG.type)
                    console.log("Name :", MSG.nickName, MSG.remarkName)
                    console.log("type :", MSG.type)
                    console.log("content :", MSG.content)
                    console.log("time :", MSG.time)
                    console.log("unread :", MSG.unread)               

            }

            watchJS.watch(objSlide, (prop, action, newMSG) => {
                
                if (action == 'push') {
                    // 消息有更新
                    console.log("----------------------")    
                    console.log("new MSG : ", typeof(newMSG))    
                    
                    let MSG = grepMSG(contacts,newMSG)
                    console.log("ID :", MSG.fromUserName, "->", MSG.toUserName)
                    console.log("type :", MSG.type)
                    console.log("Name :", MSG.nickName, MSG.remarkName)
                    console.log("type :", MSG.type)
                    console.log("content :", MSG.content)
                    console.log("time :", MSG.time)
                    console.log("unread :", MSG.unread)         



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

        $("div.header").append("<button id='e-testButton'> test</button>")
        $("#e-testButton").click(()=>{
            
                console.log("---获取用户聊天记录----")
                // 下面开始模拟点击
                let ID = 'filehelper'
                // console.log($("div.ng-scope div [data-username='"+ID+"']"))
                $("div.ng-scope div [data-username='"+ID+"']").click();
            setTimeout(() => {
                // 获取内容
                let objSlide = chatContent[ID]
                for (let indexMSG in objSlide){
                    console.log(indexMSG,"---->")    
                    // console.log(objSlide[indexMSG])
                    let MSG = grepMSG(contacts, objSlide[indexMSG])
    
                    if(MSG.type == wechatMSGType.MSGTYPE_TEXT){
                        // 正常输出
                        console.log("ID :", MSG.fromUserName, "->", MSG.toUserName)
                        console.log("type :", MSG.type)
                        console.log("Name :", MSG.nickName, MSG.remarkName)
                        console.log("type :", MSG.type)
                        console.log("content :", MSG.content)
                        console.log("time :", MSG.time)
                        console.log("unread :", MSG.unread)                           
                    }else if(MSG.type == wechatMSGType.MSGTYPE_IMAGE){
                        // 缓存图片
                        console.log($("div [data-cm*='"+MSG.MSGID+"'] img.msg-img"))
    
                        let options = {
                            host: window.location.href.substring(0, window.location.href.lastIndexOf('/'))
                          ,  port: window.location.port || (window.location.protocol.replace(/:/g,'') === 'https' ? '443' : '80')
                          , path: $("div [data-cm*='"+MSG.MSGID+"'] img.msg-img").attr("src")
                        }
                        console.log(options)
                        let request = http.get(options, function(res){
                            let imagedata = ''
                            res.setEncoding('binary')
                        
                            res.on('data', function(chunk){
                                imagedata += chunk
                            })
                        
                            res.on('end', function(){
                                console.log(imagedata)
                                fs.writeFile('../cache/test.png', imagedata, 'binary', function(err){
                                    if (err) throw err
                                    console.log('File saved.')
                                })
                            })
                        
                        })                    
    
                    }
                }                
            }, 100);


        })


    })

}
