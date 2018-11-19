window.onload = function () {
    console.log("runing skype preload")
    console.log(process.versions.electron)
    console.log(process.env.PWD)
    console.log(process.cwd())
    window.$ = window.jQuery = require("../toolkit/jquery-3.3.1.min.js")
    const core = require("../js/core")

    class conversation {
        constructor(action = "default", userID = "default", nickName = "default", timestamp = 0,
            avatar = "default", message = "default", counter = 0, index = 0, muted = false) {
            this.action = action
            this.userID = userID
            this.nickName = nickName
            this.timestamp = timestamp
            this.avatar = avatar
            this.message = message
            this.counter = counter
            this.index = index
            this.muted = muted
        }
        log() {
            for (let property in this) {
                console.log(property + ": " + this[property])
            }
        }
    }

    let nextTarget = {
        targetNode: undefined,
        mutationType: undefined,
        targetProperty: undefined,
        targetConversation: undefined
    }

    function isNewCVS(list) {
        let conv = new conversation("a")
        let flag = 0
        for (let i in list) {
            if (list[i].type == "childList" &&//增减事件
                list[i].addedNodes.length != 0 &&//增事件
                list[i].addedNodes[0].nodeType == 1) {//增的是一般元素
                console.log(list[i])
                if (list[i].addedNodes[0].matches("a.recent.unread.message")) {
                    flag |= 0b001
                    conv.nickName = list[i].addedNodes[0].querySelector("span.topic").innerText
                    conv.message = list[i].addedNodes[0].querySelector("div.message > p").innerText
                } else if (list[i].addedNodes[0].matches("span.counter")) {
                    flag |= 0b010
                    conv.counter = list[i].addedNodes[0].querySelector("span.circle > p").innerText
                } else if (list[i].addedNodes[0].matches("div.Avatar")) {
                    flag |= 0b100
                    console.log("checking avatar url: "+ list[i].addedNodes[0].querySelector("img.Avatar-image").src)
                    conv.avatar = "waiting for modification"
                    nextTarget.targetNode = list[i].addedNodes[0].querySelector("img.Avatar-image")
                    nextTarget.mutationType = "attributes"
                    nextTarget.targetProperty = "src"
                    nextTarget.targetConversation = conv
                }
            }
        }
        if (flag == 0b111) {
            return conv
        } else {
            return false
        }
    }

    let observer = new MutationObserver(function (list, obs) {
        console.log("fire in the hole")
        // console.log(list)
        if (nextTarget.targetNode !== undefined) {
            for (let i in list) {
                if (list[i].type == "attributes" &&
                    list[i].attributeName == "src" &&
                    list[i].target.isSameNode(nextTarget.targetNode)) {
                    // console.log("watch this:")
                    // console.log(nextTarget.targetNode.src)
                    nextTarget.targetConversation.avatar = nextTarget.targetNode.src
                    nextTarget.targetConversation.log()
                    nextTarget.targetNode = undefined
                    nextTarget.mutationType = undefined
                    nextTarget.targetProperty = undefined
                    nextTarget.targetConversation = undefined
                    break
                }
            }
        }

        let conv = isNewCVS(list)
        if (conv) {
            conv.log()
        }


        // console.log(obs)
        // for (let i in list) {
        //     //判断是新增node，且不是白字Text，也就是实实在在地添加的网页元素
        //     if (list[i].addedNodes.length != 0 && list[i].addedNodes[0].nodeType != 3) {
        //         if (list[i].addedNodes[0].matches("a.recent.unread.message")) {
        //             console.log(list[i].addedNodes[0])
        //             console.log("from: " + list[i].addedNodes[0].querySelector("span.topic").innerText)
        //             console.log("said: " + list[i].addedNodes[0].querySelector("div.message > p").innerText)
        //         } else if (list[i].addedNodes[0].matches("span.counter")) {
        //             console.log(list[i].addedNodes[0])
        //             console.log("total: " + list[i].addedNodes[0].querySelector("span.circle > p").innerText + " new")
        //         } else if (list[i].addedNodes[0].matches("div.Avatar")) {
        //             console.log(list[i].addedNodes[0])
        //         }
        //     }
        // }
    })

    observer.observe(document.getElementById("timelineComponent"),
        { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["src"] })

}