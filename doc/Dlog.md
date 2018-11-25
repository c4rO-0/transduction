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