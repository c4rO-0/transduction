#tdAPI

- 前端的后端函数都在这了.

---

## class: tdAPI

> transduction 的API

### Static Priorities

#### tdAPI.isDebugOn

- type : Bool 
- default : 

程序是否开启了debug模式. debug开启, 可以显示后台.

#### tdAPI.mute

- type : Bool 
- default : False

td是否消息静音.

#### tdAPI.extList

- type : tdList 
- default : 

加载的app/tool的插件列表. 比如firefox send, wechat等. webTag为tdList的key.


#### tdAPI.donwloadList

- type : tdList 
- default : 

下载文件列表. 

#### tdAPI.inputList

- type : tdList 
- default : 

输入栏草稿列表.

#### tdAPI.fileList

- type : tdList 
- default : 

待发送文件列表.


#### tdAPI.FFSendExt

- type : tdExt 
- default : 

firefox send的tdExt. firefox send是td默认安装插件.

#### tdAPI.event

- type : tdExt 
- default : events.EventEmitter()

用来处理listener功能. 
这里没有直接使用tdAPI.emit/tdAPI.on.
因为希望tdAPI使用是个静态类.

### Priorities

#### none

### Static Methods

#### tdAPI.initialize()

初始化.
加载extension, 初始化静态变量.

#### tdAPI.getDebugStatus()

在初始化中调用. 获取`tdAPI.onDebug`值.

#### tdAPI.notifyLocal(flash, sound, notTile, notBody, notCallback)

- flash Bool(opt) default : true. 图标是否闪烁.
- sound Bool(opt) default : true. 发出提示音
- notTile String(opt) default : undefined. 提示的标题.
- notBody String(opt) default : undefined. 提示的内容.
- notCallback Func(opt) default : undefined. 提示后的回调函数.

发出提示通知.

#### tdAPI.sendInput(input, fromHtml)

- input tdInput 要发送的消息.
- fromHtml String(opt) 从外部传递进消息. default:undefined

发送`input`中储存的草稿. 如果给定`fromHtml`消息替换为`fromHtml`.

#### tdAPI.respFuncWinReplyWeb(webTag, key, Obj)

- webTag String 要回复的webviewq标签.
- key String 消息类型
- Obj Object 消息具体内容
- returns Promise

回复从'app'类型的tdExt消息的函数.
key : 'Dialog', 'Convo-new', 'focus'...等


#### tdAPI.respFuncWinReplyWeb(key, Obj)

- key String 消息类型
- Obj Object 消息具体内容
- returns Promise

回复从'main'消息的函数.
key : 'mute', 'downloadUpdated'...等

### Methods

#### none

### event

通过tdAPI.event.on使用.

#### 'Dialog'

- webTag String 
- userID String
- bubbleList tdList(tdBubble)

发现有新的bubble.

#### 'Convo-new'

- webTag String 
- Convo tdConvo

发现有新的convo.

#### 'downloadUpdated'

- downItem tdDownloadItem


发现下载有新的状态. 

---

## class: tdExt

> transduction关于extension的类.

### Static Priorities

#### tdExt.rootPathInStore

- type : String 
- default : 'tdSettings.extList'

ext配置保存位置.

#### tdExt.store

- type : electron-store 
- default : new Store()

在磁盘的位置. 在`config.json`中.

### Priorities

#### 
- constructor : opt
- type : String 
- default : undefined

`ext`的`config.json`代码文件位置.
td会根据`config.json`加载插件.

dir
name
type
unicode
icon
webTag
webview

### Static Methods

### Methods


#### loadExtConfigure()

读取`ext`的`config.json`.

#### loadWebview()

加载webview. 'app'类型的ext.

#### loadTool(urlIn)

- urlIn String(opt) tool加载的url

加载webview. tool类型的ext.

#### enableExtConfigure()

根据config开启ext. 该函数被`installExt`调用.

#### disableExtConfigure()

关闭ext. 该函数在`removeExt`中调用.

#### installExt()

安装ext.

#### removeExt()

卸载ext.

#### isExtLoaded()

判断ext有没有被加载.

#### print(commit)

- commit String 要打印的注释

打印ext信息.

#### saveExtInStore(override, funToJSON)

- override Bool(opt) 覆盖
- funToJSON Func(opt) ext信息转化JSON/Object

保存ext信息到本地.

#### getUserAgent()

- returns String userAgent

返回ext需要的userAgent.