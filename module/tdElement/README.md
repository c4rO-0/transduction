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

> transduction下载文件的类, 在下载列表中使用.


### Static Priorities

#### rootPathInStore

- type : String 
- default : 'donwloadList'

下载列表在Store中储存的路径.

### Priorities

msgID, 
webTag, 
userID, 
type = undefined, 
url = undefined, 
savePath = undefined, 
progress = undefined,
totalBytes = undefined, 
receivedBytes = undefined, 
startTime = undefined, 
speed = undefined, 
leftTime = undefined
