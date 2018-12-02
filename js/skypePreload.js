window.onload = function () {
    console.log("running skype preload")
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
        /**
         * 发送消息到Win
         */
        send() {
            core.WebToHost({ "Convo-new": this }).then((res) => {
                console.log("debug : ---Win reply---")
                console.log(res)
            }).catch((error) => {
                throw error
            });
        }
        extractAll(aNode) {
            // this.action=
            console.log(aNode)
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
            this.muted = false
        }
        extract(aNode, property) {
            console.log(aNode)
            this.userID = aNode.dataset.userID
            if (property === 'nickName') {
                this.nickName = aNode.querySelector('h4 > span.topic').title
            } else if (property === 'avatar') {
                this.avatar = aNode.querySelector('img.Avatar-image').src
            } else if (property === 'message') {
                this.message = aNode.querySelector('div.message > p').innerText
            }
        }
    }

    function uniqueStr() {
        return Math.random().toString().slice(2) + Date.now().toString()
    }

    let observer = new MutationObserver(function (list, obs) {
        console.log("-------------------------fire in the hole--------------------------")
        console.log(list)

        let convo
        for (let i in list) {
            //初始化所有id，所有，新插入的也会被初始化
            if (list[i].type === 'childList' &&
                list[i].target.matches('swx-recent-item.list-selectable') &&
                list[i].addedNodes.length !== 0 &&
                list[i].addedNodes[0].nodeType === 1 &&
                list[i].addedNodes[0].matches('a')) {
                console.log("hit at: " + i + " initializing userID...")
                // console.log(list[i].addedNodes[0])
                list[i].addedNodes[0].dataset.userID = uniqueStr()
            }

            //检查小圈圈
            if (list[i].type === 'characterData' &&
                list[i].target.parentNode.matches('span.counter > span.circle > p')) {
                console.log('hit at: ' + i + ' 检查小圈圈')
                convo = new conversation('a')
                convo.extractAll(list[i].target.parentNode.closest('a'))
                convo.print()
                convo.send()
                convo = undefined
            }

            //检查src
            if (list[i].type === 'attributes' &&
                list[i].attributeName === 'src' &&
                list[i].target.matches('img.Avatar-image')) {
                console.log('hit at: ' + i + ' 检查头像src')
                let convo = new conversation('c')
                convo.extract(list[i].target.closest('a'), 'avatar')
                convo.print()
                convo.send()
                convo = undefined
            }

            //检查 p.small
            if (list[i].type === 'childList' &&
                list[i].target.matches('p.small') &&
                list[i].addedNodes.length !== 0 &&
                list[i].addedNodes[0].nodeType === 3) {
                console.log('hit at: ' + i + ' 检查消息更新')
                let convo = new conversation('c')
                convo.extract(list[i].target.closest('a'), 'message')
                convo.print()
                convo.send()
                convo = undefined
            }

            //检查 nickName
            if (list[i].type === 'characterData' &&
                list[i].target.parentNode.matches('span.tileName span.topic')) {
                console.log('hit at: ' + i + ' 检查 nickName')
                let convo = new conversation('c')
                convo.extract(list[i].target.parentNode.closest('a'), 'nickName')
                convo.print()
                convo.send()
                convo = undefined
            }
        }

    })
    //观察左边
    observer.observe(document.getElementById("timelineComponent"),
        {
            subtree: true, childList: true, characterData: true, attributes: true,
            attributeFilter: ["src"], attributeOldValue: true, characterDataOldValue: true
        })


    // 等待win发来消息
    core.WebReply((key, arg) => {
        return new Promise((resolve, reject) => {
            //  收到消息进行处理
        })
    })

}