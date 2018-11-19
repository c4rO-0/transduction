# 开发文档

---

## 技术相关
### JSDOC
[JSDOC变量列表](http://usejsdoc.org/index.html)

---

## 日志

### 2018Nov17-19: L
- 头像的链接在刚被插入网页时并不是最终的结果。。。后续大概还需要被attributes捕捉
    - 但是如果刚登录进去就有个新会话的话。。。又好像是一次成型的。。。研究机制也好麻烦啊
- 哈哈哈啊哈哈哈，网页版的skype上的左边没有时间戳
- 测试发现 skype 的
    - 旧会话中的最新消息会触发 childList，替换一个 p
    - 旧会话中的未读计数会触发 characterData，nodeName:"#text"
        - 而这两个触发在{childList, subtree, characterData}的设定下，不在同一个list中
        - 通常是 characterData 先触发
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