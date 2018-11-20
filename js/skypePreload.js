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
        print() {
            for (let property in this) {
                console.log(property + ": " + this[property])
            }
        }
    }

    let followupCheck = {
        node: undefined,
        mutationType: undefined,
        property: undefined,
        conversation: undefined,
        stash(targetNode, mutationType, targetProperty, targetConversation) {
            this.node = targetNode
            this.mutationType = mutationType
            this.property = targetProperty
            this.conversation = targetConversation
        },
        pop() {
            this.node = undefined
            this.mutationType = undefined
            this.property = undefined
            this.conversation = undefined
        },
        print() {
            for (let property in this) {
                if (typeof this[property] !== 'function')
                    console.log(property + ": " + this[property])
            }
        }
    }

    function isNewCVS(list) {
        let conv = new conversation("a")
        let flag = 0
        for (let i in list) {
            if (list[i].type == "childList" &&//增减事件
                list[i].addedNodes.length != 0 &&//增事件
                list[i].addedNodes[0].nodeType == 1) {//增的是一般元素
                if (list[i].addedNodes[0].matches("a.recent.unread.message")) {
                    console.log("message and nickname hit at: " + i)
                    flag |= 0b001
                    conv.nickName = list[i].addedNodes[0].querySelector("span.topic").innerText
                    conv.message = list[i].addedNodes[0].querySelector("div.message > p").innerText
                } else if (list[i].addedNodes[0].matches("span.counter")) {
                    console.log("counter hit at: " + i)
                    flag |= 0b010
                    conv.counter = list[i].addedNodes[0].querySelector("span.circle > p").innerText
                } else if (list[i].addedNodes[0].matches("div.Avatar")) {
                    console.log("avatar and id hit at: " + i)
                    flag |= 0b100
                    console.log("checking avatar url: " + list[i].addedNodes[0].querySelector("img.Avatar-image").src)
                    conv.avatar = "waiting for modification"
                    followupCheck.stash(
                        list[i].addedNodes[0].querySelector("img.Avatar-image"),
                        "attributes",
                        "src",
                        conv)
                    followupCheck.print()
                }
            }
            if (flag == 0b111) {
                return conv
            }
        }
        return false
    }

    function processFollowup(list) {
        if (followupCheck.node !== undefined) {
            followupCheck.print()
            for (let i in list) {
                if (list[i].type == followupCheck.mutationType &&
                    list[i].attributeName == followupCheck.property &&
                    list[i].target.isSameNode(followupCheck.node)) {
                    followupCheck.conversation.avatar = followupCheck.node.src
                    followupCheck.conversation.print()
                    followupCheck.pop()
                    return
                }
            }
        }
    }

    let observer = new MutationObserver(function (list, obs) {
        console.log("fire in the hole")
        console.log(list)

        processFollowup(list)

        let conv = isNewCVS(list)
        if (conv) {
            conv.print()
        }

    })

    observer.observe(document.getElementById("timelineComponent"),
        { subtree: true, childList: true, characterData: true, attributes: true, 
            attributeFilter: ["src"], attributeOldValue:true, characterDataOldValue:true })

}