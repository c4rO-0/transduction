#tdMessage

> 在不同js/进程/ipcRenderer/ipcMain之间传递消息.

---

## class: tdMessage

> 在不同js/进程/ipcRenderer/ipcMain之间传递消息.

该类有两种函数:

- `*sendTo*`是发送消息, 会有`msg`作为输入, `promise`为返回.

`msg`是要发送的信息, 为`Object`类型.
``` javascript
msg = {'key':vale}

```
`msg`中只看可以含有一个`key`, value为任意类型变量.

- `*Reply*` 相对`send`函数, 在收到消息之后作出响应.
具体响应根据`fcnResponse(key,msg[key])`处理. 处理后返回`promise`.


### Static Priorities

#### none

### Priorities

#### none

### Static Methods

#### tdMessage.sendToMain(msg)

- msg Object 发送的消息.
- returns Promise

从任意地方向`ipcMain`/`Main`进程/`main.js`发送消息.

#### tdMessage.MainReply(fcnResponse)

- fcnResponse Func 处理函数.
- returns Promise

在`ipcMain`/`Main`进程/`main.js`中收到消息, 对消息进行处理并回复发送者.

#### tdMessage.sendToWin(winID,msg)

- winID BrowserWindow.id
- msg Object 发送的消息.
- returns Promise

从`ipcRemote`/某个窗口向窗口`winID`对应的窗口发送消息.

#### tdMessage.WinReply(fcnResponse)

- fcnResponse Func 处理函数.
- returns Promise

BrowserWindow收到消息后, 对消息进行处理并回复发送者.

#### tdMessage.mainSendToWin(win,msg)

- win BrowserWindow.id
- msg Object 发送的消息.
- returns Promise

从`ipcMain`/`Main`进程/`main.js`向窗口`win`对应的窗口发送消息.

#### tdMessage.HostSendToWeb(webSelector, msg, timeout)

- webSelector String webview的JQ selector
- msg Object 发送的消息.
- timeout number(integer)(opt) 超时判断. 默认值5000
- returns Promise

从`ipcRemote`/某个窗口向其下`webSelector`的webview发送消息.

#### tdMessage.WebReply(fcnResponse)

- fcnResponse Func 处理函数.
- returns Promise

webview收到消息后, 对消息进行处理并回复发送者(`ipcRemote`/某个窗口).

#### tdMessage.WebToHost(msg)

- msg Object 发送的消息.
- returns Promise

从webview向其所属的`ipcRemote`/某个窗口发送消息.

#### tdMessage.WinReplyWeb(webSelector, fcnResponse)

- webSelector String webview的JQ selector
- fcnResponse Func 处理函数.
- returns Promise

处理WebToHost函数发来的消息.

### Methods

#### none

### events

#### none