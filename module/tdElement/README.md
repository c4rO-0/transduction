#tdElement

---

## class: tdList

> transduction指定的List格式.


``` javascript
let list = new tdList()
```

### Static Priorities

#### none

### Priorities

#### this.list

- constructor : no 
- default : {}

用来储存`list`的变量. 实际上该变量为`Object`. 

``` javascript
this.list = {'key':element}
```

#### pathInStore

- constructor : opt 
- default : undefined

list可以储存在本地硬盘. `storeIn`用来指定`electron-store`变量, 文件的包含硬盘路径.
变量在`electron-store`中是以`JSON`的形式储存在硬盘里.
`pathInStore`指定在`JSON`中的索引路径, 不是硬盘路径.

#### storeIn

- constructor : opt 
- default : new Store()

list可以储存在本地硬盘. `storeIn`用来指定`electron-store`变量, 文件的包含硬盘路径.
变量在`electron-store`中是以`JSON`的形式储存在硬盘里.
`pathInStore`指定在`JSON`中的索引路径, 不是硬盘路径.
`storeIn`如果不指定, 将会使用默认`electron-store`文件`config.json`.

### Static Methods

#### none

### Methods

#### addListFromSub(subList)

- `subList` tdList 要合并的子List

将子List合并到当前List中. 

#### addListFromEle(key, element)

- `key` String 添加元素的索引关键字, 要有唯一属性.
- `element` Any 要添加的元素.

将`element`添加到当前list中, 索引关键字为`key`. 如果list中已存在`element`有相同的`key`, 之前的`element`将会被覆盖.

#### deleteEleByKey(key)

- `key` String 要删除元素的索引关键字.

将list中`key`对应的`element`删除.

#### deleteEleByIndex(index)

- `index` Integer 索引位置.

不推荐使用该函数.
删除List中顺位为`index`的`element`. 

#### hasEle(key)

- `key` String 要查询的索引关键字.
- returns Bool 

查询`key`是否存在在List中.

#### getLen()

- returns Integer 

返回List长度.

#### getList()

- returns Object

返回裸List变量. 如果需要直接对Object操作, 可使用该函数

#### getKeys()

- returns Array(String)

返回List中所有关键字索引, 并储存在数组中.

#### getValues()

- returns Array(Any)

返回List中所有`element`, 并储存在数组中.

#### getValues()

- returns Array(Any)

返回List中所有`element`, 并储存在数组中.

#### getValueByKey(key)

- `key` String 要获取element对应的索引关键字.
- returns Any 返回element

获取`key`对应的`element`. 如果key不存在, 返回`undefined`.

##### getSubByKeys(...keys)

- `keys` Array(String) 要获取多个element对应的索引关键字数组.
- returns Array(Any) 返回element数组

获取`keys`对应的`element`数组. 如果key不存在, 返回的数组中对应的`element`为`undefined`.

##### getValueByIndex(index)

- `index` Integer 索引位置.
- returns Any 返回element

不推荐使用该函数.
返回list中顺位为`index`的`element`.

#### updateEleValue(key, value)

- `key` String 添加元素的索引关键字, 要有唯一属性.
- `value` Any 要添加的元素.

索引关键字为`key`的`element`更新为`value`, 之前的`element`将会被覆盖.

#### print(commit)

- `commit` String(opt) 要输出的注释.

输出list

#### toJSONList(funToJSON)

- `funToJSON` Func(opt) `element`变成JSON的转化函数
- returns Array(JSON)

把list变成JSON格式的Array.funToJSON默认调用`JSON.stringify`.

#### fromJSONList(pList, funFromJSON)

- `pList` Array(JSON) JSON格式的数组
- `funFromJSON` Func(opt) JSON转化为`element`函数.

把JSON形式的数组转化为tdList.

##### getPathInStore()

- returns String pathInStore

返回pathInStore.

#### hasPathInSore()

- returns Bool 是否有pathInStore

查询是否有pathInStore.

#### setPathInStore(pathInStore)

- `pathInStore` String pathInStore

设置pathInStore.

#### getListInSore(funFromObj)

- `funFromObj` Func(opt)

从`store`中读取list. funFromObj默认返回JSON.

#### saveListInStore(override, funToJSON)

- `override` Bool(opt) 是否覆盖. 默认`true`
- `funToJSON` Func(opt) `element`转化函数. 默认`JSON.stringify`.

将list保存在本地文件中.

#### saveEleInStore(key, override, funToJSON)

- `key` String  索引关键字. 
- `override` Bool(opt) 是否覆盖. 默认`true`.

将`key`指定的`element`写在本地文件中.

#### resetListInStore()

重设本地存储的list.

#### deleteListInStore()

删除本地存储的list.

#### hasListInStore()

- returns Bool 

判断本地储存里是否有`pathInStore`指定的list

### event

#### none


---

## class: tdConvo

> transduction convocation(Convo) 类型. 一般出现在页面左边.

``` javascript
let convo = new tdConvo(webTag, action, userID, nickName, time, avatar, message, counter, index, muted)
```

### Static Priorities

#### none

### Priorities

#### this.webTag

- constructor : yes
- type : String
- default : 

convo所属webview的tag

#### this.action

- constructor : yes
- type : String 
- default : 

convo要执行的动作. 'a':add, 'r':remove, 'c':change.

#### this.userID

- constructor : yes
- type : String 
- default : 

convo对应user的ID. 为String, 对应同一个'webTag'应该具有唯一属性.


#### this.nickName

- constructor : yes
- type : String 
- default : 

用户显示的昵称. 

#### this.time

- constructor : yes
- type : String
- default : 

convo显示的时间. 可接受`number`, `string`. 会被转化为`13:01`形式.

#### this.avatar

- constructor : yes
- type : String url
- default : 

convo显示头像的地址链接.

#### this.message

- constructor : yes
- type : String 
- default : 

convo显示最近的消息.

#### this.counter

- constructor : yes
- type : Integer 
- default : 

convo未读消息数.

#### this.index

- constructor : yes
- type : Integer 
- default : 

convo在原生web上显示的顺序数.

#### this.muted

- constructor : yes
- type : Bool 
- default : 

convo是否被静音.

### Static Methods

#### none

### Methods

#### print()

在终端输出convo.

### event

#### none


---

## class: tdBubble

> transduction bubble 类型. 一般出现在页面右边.

``` javascript
let bubble = new tdBubble(msgID)
```

### Static Priorities

#### none

### Priorities

#### this.msgID

- constructor : yes
- type : String
- default : 

bubble的id.

#### this.time

- constructor : opt
- type : Date
- default : new Date

bubble的时间.

#### this.status

- constructor : opt
- type : String
- default : undefined

bubble发送中的状态. 'sending' 'done' 'failed'

#### this.type

- constructor : opt
- type : String
- default : undefined

bubble类型. 'text' 'img' 'url' 'file' 'unknown' undefined

#### this.from

- constructor : opt
- type : String
- default : undefined

发送bubble的人的昵称, 如果是本人发送的消息为`undefined`.

#### this.avatar

- constructor : opt
- type : String url
- default : undefined

发送bubble的人的头像, 如果是本人发送的消息为`undefined`.

#### this.message

- constructor : opt
- type : String 
- default : undefined

消息内容. 
img'和'url'类型的bubble, 该处为对应的链接.

#### this.fileName

- constructor : opt
- type : String 
- default : undefined

'file'类型的bubble, 该处为文件名.

#### this.fileSize

- constructor : opt
- type : Integer 
- default : undefined

'file'类型的bubble, 该处为文件大小, 单位为B.

#### this.oldMsgID

- constructor : opt
- type : String 
- default : undefined

如果`oldMsgID`不为`undefined`, 那么`oldMsgID`对应的bubble要更新ID为`msgID`.


### Static Methods

#### none

### Methods

#### none

### event

#### none


---

## class: tdDownloadItem

> transduction下载文件的类, 在下载列表中使用. `tdDownloadItem`一般会对应一个tdBubble.


### Static Priorities

#### tdDownloadItem.rootPathInStore

- type : String 
- default : 'donwloadList'

下载列表在Store中储存的路径.

### Priorities

#### this.unicode

- constructor : no
- type : String 
- default : uniqueStr()

`tdDownloadItem`对应的惟一的一个代码.

#### this.msgID

- constructor : yes
- type : String 
- default : 

`tdDownloadItem`对应的bubble的msgID.

#### this.webTag

- constructor : yes
- type : String 
- default : 

`tdDownloadItem`对应的bubble的webview tag.

#### this.userID

- constructor : yes
- type : String 
- default : 

`tdDownloadItem`对应的bubble的userID.

#### this.type

- constructor : opt
- type : String 
- default : undefined

区分图片或者其它格式文件. 'img' 'file'.

#### this.url

- constructor : opt
- type : String 
- default : undefined

下载文件的地址.

#### this.savePath

- constructor : opt
- type : String 
- default : undefined

保存到本地的地址. 默认不用分配, 会有弹窗让用户选择.

#### this.progress

- constructor : opt
- type : Float 
- default : undefined

下载进度. 0-1.

#### this.totalBytes

- constructor : opt
- type : Integer 
- default : undefined

要下载的文件大小.单位B

#### this.receivedBytes

- constructor : opt
- type : Integer 
- default : undefined

已经接收到的文件大小.单位B

#### this.startTime

- constructor : opt
- type : Integer 
- default : undefined

开始下载文件的时间.单位秒.

#### this.speed

- constructor : opt
- type : Float 
- default : undefined

预估的下载速度. 单位B/s.

#### this.leftTime

- constructor : opt
- type : Float 
- default : undefined

预估剩余时间. 单位s.

### Static Methods

#### tdDownloadItem.fromObj(obj)

- `obj` object/JSON 

从`obj`中导入数据到`this`.

### Methods

#### toObj()

- returns object/JSON 

将`this`转化为Object/JSON格式变量.
目前只包含 : 

> 'url''unicode' 'webTag' 'userID' 'msgID' 'type' this.type 'savePath'

#### isSame(webTag, userID, msgID)

- `webTag` String
- `userID` String
- `msgID` String
- returns Bool

通过当前`downloadItem`是否为`webTag`,`userID`,`msgID`.

### event

#### none

---

## class: tdFileSend

> transduction发送文件类, 上传文件的时候使用.

### Static Priorities

#### none

### Priorities

##### this.name

- constructor : yes
- type : String 
- default : 

文件名.

##### this.path

- constructor : yes
- type : String 
- default : 

文件路径.

##### this.webkitRelativePath

- constructor : yes
- type : String 
- default : 

附加的文件可能从浏览器拖拽, 地址是一个url

##### this.size

- constructor : opt
- type : Integer 
- default : undefined

文件大小.

##### this.type

- constructor : opt
- type : String 
- default : undefined

文件类型, 格式为(`MIME 类型`)[https://developer.mozilla.org/zh-CN/docs/Web/HTTP/Basics_of_HTTP/MIME_types]

##### this.fileID

- constructor : opt
- type : String 
- default : ''

文件的ID, 具有唯一性.

##### this.dataUrl

- constructor : opt
- type : String 
- default : undefined

图片文件的话, 会转化到`dataUrl`格式.

### Static Methods

#### tdFileSend.fromFile(file)

- `file` File 从<input>中拿到的元素.
- returns tdFileSend

将`file`转化为`tdFileSend`

### Methods

#### updateFromFile(file)

- `file` File 从<input>中拿到的元素.

将`file`的信息更新到`this`中.

#### isImg()

- returns Bool

从`this.type`判断是否为图片.

#### addDataUrl(dataUrl)

- dataUrl String

添加`dataUrl`到`this`中. 如果`isImg()`返回`True`, 该函数会被调用.

#### localSave()

- returns Promise

将文件异步保存到临时文件夹, 防止文件在发送前丢失. 保存结束后, 返回`Promise`.

#### clear()

清除临时文件夹中的文件. 退出transduction的时候会调用. 防止临时文件夹越来越大.

---

## class: tdSettings

> transduction用来储存用户设置的类.

### Static Priorities

#### tdSettings.rootPathInStore

- type : String 
- default : 'tdSettings'

在`store`中存储设置的路径.

#### tdSettings.store

- type : electron-store 
- default : new Store()

具体指向的`store`变量, 文件储存在`config.json`中.

###  Priorities

#### none

### Static Methods

#### tdSettings.getAllSettings()

- returns Object/JSON

从本地文件读取用户全部设置.

#### tdSettings.getSettings(property)

- `property` String 要获取的某项设置.
- returns Object/JSON

从本地文件读取用户指定为`property`的设置.

#### tdSettings.resetSettings(value)

- `value` Object/JSON(opt) 重置设置的值. 默认为`undefined`.

重置用户的设置为`value`.

#### setSettings(property, value, reset)

- `property` String 要设置的关键字
- `value` Object/JSON 关键字对应的值
- `reset` Bool(opt) 是否覆盖. 默认不覆盖.

将`property`所指向值设置为`value`并在本地储存. 

### Methods

#### none

### event

#### none

---

## class: tdInput

> transduction用来处理输入框的类. 

### Static Priorities

#### none

### Priorities

#### this.webTag

- constructor : opt
- type : String 
- default : undefined

该输入框内容对应的`webTag`.

#### this.userID

- constructor : opt
- type : String 
- default : undefined

该输入框内容对应的`userID`.

#### this.draftHTML

- constructor : opt
- type : String 
- default : undefined

该输入框内容. 可以理解为: 给`webTag`中用户`userID`发送消息的草稿.

### Static Methods

#### tdInput.genKey()

- returns String 生成的`key`.

生成`key`, 用来储存在tdList中. 每个`webTag`下的用户拥各自的`tdInput`.

#### tdInput.simpleInput(fileList, HTML)

- `fileList` tdList 用户已经添加过的文件列表. 
- `HTML` String 要发送的内容(HTML格式). 一般是从输入框直接拿过来的.
- returns Array(String/File) 返回初步处理过的要发送的消息, 以数组形式储存.

将HTML格式的输入, 初步转化为数组形式储存. 该函数需要被`getInputFromHtml`调用.
文字类消息以String形式储存在数组中, 文件类消息以`File`格式储存.

#### tdInput.getInputFromHtml(fileList, innerHTML)

- `fileList` tdList 用户已经添加过的文件列表. 
- `innerHTML` String 要发送的内容(HTML格式). 一般是从输入框直接拿过来的.
- returns Array(String/File) 返回可以发送的消息, 以数组形式储存.

将HTML格式的输入, 初步转化为可以发送的消息, 并储存在数组中. 该函数需要调用`simpleInput`.
文字类消息以String形式储存在数组中, 文件类消息以`File`格式储存.
`getInputFromHtml`和`simpleInput`的区别:
`getInputFromHtml`在调用`simpleInput`之后会将文字类消息进行合并, 减少发送次数.

### Methods

#### getKey()

- returns String `key`.

返回`key`.  `key`用来储存在tdList中. 每个`webTag`下的用户拥各自的`tdInput`.

#### getDraftHTML()

- returns String `draftHTML`.

返回`this.draftHTML`. 可以理解返回要给`webTag`中用户`userID`发送消息的草稿.

