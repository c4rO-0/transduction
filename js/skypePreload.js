window.onload = function () {
    console.log("runing skype preload")
    console.log(process.versions.electron)
    console.log(process.env.PWD)
    console.log(process.cwd())
    window.$ = window.jQuery = require("../toolkit/jquery-3.3.1.min.js")
    const core = require("../js/core")

    class conversation {
        constructor(action, userID, nickName, timestamp, avatar, message, counter, index, muted) {
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
        extract(aNode) {
            // this.action=
            this.userID = aNode.dataset.userID
            this.nickName = aNode.querySelector('h4 > span.topic').title
            this.timestamp = new Date()
            this.avatar = aNode.querySelector('img.Avatar-image').src
            this.message = aNode.querySelector('div.message > p').innerText
            this.counter = aNode.querySelector('span.circle > p').innerText
            this.index = Array.prototype.indexOf.call(
                aNode.closest('div.recents.scrollViewport-inner').querySelectorAll(
                    'swx-recent-item.list-selectable'),
                aNode.closest('swx-recent-item.list-selectable'))
            // this.muted= 
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

    function extractID(url) {
        // https://avatar.skype.com/v1/avatars/live%3Ac4ro-0/public?returnDefaultImage=false&cacheHeaders=true
        // https://avatar.skype.com/v1/avatars/live%3Aruc.bs.plu?auth_key=-433087155&returnDefaultImage=false&cacheHeaders=true
        // https://swx.cdn.skype.com/v/1.125.40/assets/images/avatars/default-avatar-contact.svg
        // https://swx.cdn.skype.com/v/1.125.40/assets/images/avatars/default-avatar-group.svg
        // https://api.asm.skype.com/v1/objects/0-ea-d5-9a6333808267e69430ece7ca63129a1b/views/avatar_fullsize
        // https://api.asm.skype.com/v1/objects/0-weu-d11-12d27192bc5c9967b18b43b8ebf1850c/views/avatar_fullsize
        let id
        if (url.includes('https://avatar.skype.com/v1/avatars/')) {
            id = url.replace('https://avatar.skype.com/v1/avatars/', '')
            id = id.replace(/\/.+/, '')
            id = id.replace(/\?auth.+/, '')
            return id
        } else if (url.includes('https://api.asm.skype.com/v1/objects/')) {
            id = url.replace('https://api.asm.skype.com/v1/objects/', '')
            id = id.replace(/\/.+/, '')
            return id
        }
        return false
    }

    let observer = new MutationObserver(function (list, obs) {
        console.log("-------------------------fire in the hole--------------------------")
        console.log(list)

        // processFollowup(list)
        // let conv = isNewCVS(list)
        // if (conv) {
        //     conv.print()
        // }
        let id, node
        for (let i in list) {
            //检查小圈圈
            if (list[i].type == 'characterData' && list[i].target.parentNode.matches('span.counter > span.circle > p')) {
                console.log('new message')
                console.log(list[i].target.parentNode.closest('a').querySelector('img.Avatar-image').src)
                node = list[i].target.parentNode.closest('a')
                id = extractID(node.querySelector('img.Avatar-image').src)
                node.dataset.userID = id
                console.log('id: ' + id)
                node.dataset.waitFor = 'avatarUrl'
                // if (id) {
                //     console.log('id: ' + id)
                // } else {

                // }
            }
            //二次检查
            if (list[i].type == 'attributes' && list[i].attributeName == 'src' && list[i].target.closest('a').dataset.waitFor == 'avatarUrl') {
                list[i].target.closest('a').dataset.waitFor = 'nothing'
                let convo = new conversation()
                console.log('seconde check')
                convo.extract(list[i].target.closest('a'))
                convo.print()
            }
        }

    })

    observer.observe(document.getElementById("timelineComponent"),
        {
            subtree: true, childList: true, characterData: true, attributes: true,
            attributeFilter: ["src"], attributeOldValue: true, characterDataOldValue: true
        })

}