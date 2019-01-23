# 开发文档

---

## 技术相关
### JSDOC
[JSDOC变量列表](http://usejsdoc.org/index.html)

### request
不要使用nodejs request module. 
既不要在程序里使用require(request).
原因是chrome里面集成的环境不全, 在preload会提示`setimmediate undefined`, 然后拿不到数据.

使用`electron`里`net`模块替代
``` javascript
// main
const { net } = require('electron')
// render
const { net } = require('electron').remote
```

---

## 日志

## 2019Jan23: BS
前台已经可以识别拖入文件, url. 和识别粘贴文件.
前台还需要解决 :
- inputbox渲染.
  - 图片加载
  - 文件加载
- 整体删除元素
  当用户拖入文件之后, 按backspace会把文件对应的html删除掉

## 2019Jan18: L
- 疑点，焦点总会莫名奇妙地跑回到webview上
- 为什么skypePreload.js r250 总是执行两次
- 目前的判断update结束的标准还不够稳定，可能出现点一下没反应的情况，多点一下

## 2019Jan16-17: L
- 灰色可能需要更深一点，如果想统一的改需要把pin，image都改成svg
- 提醒自己，自己定义一套td-row, td-col，还有常用的类，比如transparency, position

## 2019Jan03: L
- 似乎发现一个bug，运行主程序，不登录，不打开webview，等一段时间，再去打开webview登录
    - npm ERR! code ELIFECYCLE
    - npm ERR! errno 3221225477
    - npm ERR! transduction@1.0.0 debug: `electron . --debug`
    - npm ERR! Exit status 3221225477
    - npm ERR!
    - npm ERR! Failed at the transduction@1.0.0 debug script.
    - npm ERR! This is probably not a problem with npm. There is likely additional logging output above.
    - npm ERR! A complete log of this run can be found in:
    - npm ERR!     C:\Users\walker\AppData\Roaming\npm-cache\_logs\2019-01-03T03_44_33_077Z-debug.log

## 2019Jan02: L
- 左侧加上appLogo以区分app
- 目前我认为的appName的命名标准是全部小写，但是现在只有skype和wechat，理解成驼峰命名法也可
- 可能出现分歧的app比如说WhatsApp，官方写法是第每个单词开头大写，驼峰写法whatsApp，全部小写whatsapp
- appName的命名标准可能需要讨论
- 另外，appLogo的标准是，任意大小正方形的png图片，图形内容尽量占满正方形区域，底部的右侧可以留空，背景为透明

## 2018Dec09: BS
对于非标准化的消息, 一律提示用户打开专有app(网页版或手机)进行查看
index对于该消息以按钮形式呈现, 点击打开app网页版

针对微信
- 微信自己有一套emoji表情, 和国际标准不一样. 进行字符串替换
- 微信语音无法显示, 要求用户打开微信app进行查看


## 2018Dec06: BS
- 实现点击左侧convo获取dialog
- core中, 超时用promise.race功能实现
- 存在bug, 需要进一步调查
在程序运行之后第一次点击convo之后, 后台会弹出 
``` javascript
index.html:1 Uncaught (in promise) HostSendToWeb : time out
```

## 2018Dec04: BS
- 实现插入convo, 并去掉重复
    - convo html模板添加`app-name`, 方便查找
    - counter添加display判断, 在counter为0时去掉小红点
- 实现对change动作的处理
- bug :
    skype对于emoji反应迟缓一个消息.
    例如连续发送emoji表情, 前台message只能收到前一个convo.message. 
    
### 2018Dec03-04：L
- skype 传到前台的 timestamp 改为 Date.now() 即一个 number 型，前台用 new Date(time) 即可转回 date 型
    - index.js r11-r13
    - skypePreload.js r56
- skype 传到前台的 counter 改为 number 型
    - skypePreload.js r59
- 。。。。。。。的 message 已兼容表情符
    -skypePreload.js r58
- 前台 convo ui 微调

- date 类型没有正确传到前台，得绕一下，建议传数字，就是毫秒数那个，好像很容易转回date
- 主要需要改的地方：
    - index.js r24
    - index.js r82-r84

### 2018Nov15: BS
程序结构(临时)
在index统一显示消息内容.
- 查询某个用户的消息
index向webview发送请求
``` javascript
// 发送请求
core.HostSendToWeb("webview ID", { "get": "userID" })
// 接收返回消息
core.WinReplyWeb("webview ID", (key, arg) => {
})
```
`userID`替换为要查寻的用户对应号码.


### 2018Nov25: L
- 昨天睡前想到的新机制
    - 所谓的 action，a 表示 add，也就是新消息，是不是新插入的其实无所谓
    - c 表示change，其实就可以用来表示，src的变化，nickname的变化，p.small的变化，不再拘泥于在一次抓取中完成所有的消息
    - 然后在前台作判断，如果一个c操作的目标userID在前台没有，就忽略这个操作，只有a操作能在前台添加新会话

### 2018Nov23：L
- 我决定再再改机制
    - id 用 时间+随机数生成
    - 再也tmd的不从url读id了
- 所以剩下要考虑的是
    - 区分刚加载时，与加载完成后，的新插入消息
    - 加载完成后，多于1条新消息时。。。p.small 还要更新。。。是个后续的childList
    - 加载完成后，新插入的群组消息（机器人也是群组），nickName 第一次是untitled conversation，第二次需要一个characterData

- 如何判断用户是否有头像：
    - skype 刚加载时，默认都先放带 id 的 src，然后去 get 这个地址，如果 get 不到，报错，后面才会触发 mutation 修改成默认的头像
        - 运行中的新加入群组先放默认src，然后如果有头像会改成正确src，没有头像就无法获得id，王德王德发
    - 如此一来，我觉得 skype 这边就没必要做第二次检查，因为前台也是要去访问这 src，如果报错换成我们的默认头像就行了
        - 但还是需要将userID记在html里，如果没头像的话，除了第一次加载，将来是没有机会获得id的
    - 如果还是老思路的话，第一次检查是没办法判断是否有头像的（除非去 get src），那么就必定要安排第二次检查，但是第二次检查又不一定会触发，so
    - 依然需要二次检查的信息
        - fxxk...来新消息的话。。。p.small 还要更新。。。是个后续的childList
        - 刚加载时，新插入的群组消息（机器人也是群组），nickName 第一次是untitled conversation，第二次需要一个characterData
- 再修正一下机制
    - 网页第一次加载时，就应该把所有会话的id处理一遍，如果已经加载好了后续来新消息估计也是拿不到id了
    - 后来运行时的新来会话当然也要处理一下id

### 2018Nov20: L
- 考虑修改判断标准
    - 新会话，或旧会话0-1，在一个list中先有 span.counter 插入（可以不看），然后会有 span.circle > p 的 characterData 变化，从 1 变成 1
        - 此时如果用户没有头像，可以从 img.Avatar-image 的 src 中读到用户 id
        - 如果是无头用户，后续跟一个list只有一个元素是 attributes，修改 img.Avatar-image 的 src
        - 其余信息向上爬父节点
    - 旧会话新消息1-n，只有 span.circle > p 的 characterData 变化，从 1 变成 2
        - 后续跟一个list中 div.message > p.small 的 childList 插入，内容被替换成最新消息
    - 会话已读，整个 span.counter 被删除，先一个list删子 span.counter 内的三个元素（target: span.counter），再一个list删父 div.unseenNotification（target: div.text）
        - 其他终端的操作也会引发会话已读，不一定是鼠标点击引起，但是观察效果是一样的
    - 会话删除，childList; target: div.recents.scrollViewport-inner; removedNode[0]:swx-recent-item.list-selectable
    - 新群组会话，好像和用户是反的。。。src先放skype默认的，第二次才改成真实的。。。。王德发
    - 昨天的群组会话来新消息，实际效果类似新会话，有新元素插入到靠上的区域，排序了，src本来就有，第一次就能读到，当然这两种是有头像的群组的情况
    - 无头群组，直接skype默认头像，没有可以拿来当id的东西
- 如何处理连续的两个list
    - 第一个list时将必要信息（无头用户的id，连续标记）全部存在网页上，第二个list时爬取全部信息
        - 已实验可行，就这么办吧
    - 第一个list时将信息（主要是目标节点）存在脚本里，作为全局变量让callback可以访问
        - 已经实验可行，隐患是observer的callback是异步的，如果全局变量只给一个可能会数据竞争
        - 如果给动态数组，感觉有点费事
    - 第一个list时就地开一个新的observer，callback 结束时 disconnect
        - 未实验，observer 的 callback 函数不能改，而且 callback 需要访问之前存下的 conversation，欸。。。好像可以没有全局变量
        - 那么一个主observer一直存在，只需要 characterData，外加一个会话会有另外两个observer一个childList一个attributes，间歇性打开
        - 隐患是，怕新开observer比后一个list反应慢

- 从 url 提取 id
    - f https://avatar.skype.com/v1/avatars/live%3Ac4ro-0/public?returnDefaultImage=false&cacheHeaders=true
    - t https://avatar.skype.com/v1/avatars/live%3Aruc.bs.plu?auth_key=-433087155&returnDefaultImage=false&cacheHeaders=true
    - t https://swx.cdn.skype.com/v/1.125.40/assets/images/avatars/default-avatar-contact.svg
    - t https://swx.cdn.skype.com/v/1.125.40/assets/images/avatars/default-avatar-group.svg
    - t https://api.asm.skype.com/v1/objects/0-ea-d5-9a6333808267e69430ece7ca63129a1b/views/avatar_fullsize
    - tf https://api.asm.skype.com/v1/objects/0-weu-d11-12d27192bc5c9967b18b43b8ebf1850c/views/avatar_fullsize
        - 最后这一个是能看到的图片，但是图片src地址指向禁止访问403，很奇怪，难道因为是机器人

### 2018Nov17-19: L
- 头像的链接在刚被插入网页时并不是最终的结果。。。后续大概还需要被attributes捕捉
    - 但是如果刚登录进去就有个新会话的话。。。又好像是一次成型的。。。研究机制也好麻烦啊
- 哈哈哈啊哈哈哈，网页版的skype上的左边没有时间戳
- 测试发现 skype 的
    - 旧会话中的最新消息会触发 childList，替换一个 p ，内容是最新的消息
    - 旧会话中的未读计数会触发 characterData，nodeName:"#text"，内容是计数增加
        - 而这两个触发在{childList, subtree, characterData}的设定下，不在同一个list中
        - 通常是 characterData 计数增加 先触发
    - online 和 away 的状态切换会触发 childList
- 从id找元素，左边 id="timelineComponent"，右边 id="chatComponent"

### 2018Nov13: L
- 由于优秀的文件夹结构，和不同操作系统 process 变量的各向异性，决定推广相对路径

### 2018Nov12：L
- 神奇的 window.onload=function(){}
- skype 网页左侧大框 aside.sideContainer; 右侧大框 div.chatContainer
- 对方的名字全部写在 span.tileName 里，左右都有
- 聊天记录在 div.content

### 2018Nov04: BS
发现linux下不能调用`BrowserWindow.setMenu(null)`.
目前做一个平台识别.

### 2018Nov04: L

经过短暂学习，开始正式开发。
基本是将L的学习代码原样搬过来，但是不用担心，代码只在hello world的基础上做了一点点修改。  
包括：
- 带Devtool运行：npm run debug
- 调用了 bootstrap 和 jquery 的一个按钮 switch
- 两个 webview，全部默认设置
- 不显示窗口的菜单

 起码还存在以下需要修改的地方：
- package.json 文件中没有写 repository 和 license，导致运行时报 warning
- main.js 基本上是最精简版，官方其实有提供更完备一点的例子可参考
- 为保证每个文件夹中有文件，在 res/pic 中放了一个无关图片