#tdBasic

all basic classes and functions are here

---

## class: tdBasic

> 不依赖其他tdClass的基础操作

### Static Priorities

#### none

### Priorities

#### none

### Static Methods

#### tdBasic.uniqueStr()

- returns String 具有唯一性的字符串

返回一个以时间作为种子的唯一字符串.
目前被用在消息传递的时候创建一个独一无二的channel

#### tdBasic.timeAny2Obj(timeAny)

- timeAny number/string/object 要识别的时间
- returns Date 

将`timeAny`转化为Date()格式. new Date(timeAny)

#### tdBasic.timeObj2Str(timeObj)

- timeObj Date 要转化的时间
- returns String 转化后的String

将`timeObj`td中需要使用的时间格式. 比如 `12:30`

#### tdBasic.size2Str(size)

- size number(Integer) 文件大小. 单位B
- returns String 易读的文件大小

将`size`变为以`KB`, `MB`, `GB`, `TB`易读的单位.

#### tdBasic.getFileNameFromUrl(url)

- url String 链接
- returns String 文件名

从`url`中提取文件名. 比如`http://www.test.com/example.txt?en`得到`example.txt`.

###  Methods

#### none

### Events

#### none

---

## class: tdBasicPage

> 不依赖其他tdClass的关于页面的基础操作.

### Static Priorities

#### tdBasicPage.toolboxSelector

- type : String 
- default : 

#### tdBasicPage.toolboxSelector 

- type : String 
- default : 

#### tdBasicPage.chatLogSelector 

- type : String 
- default : 

#### tdBasicPage.inputboxSelector 

- type : String 
- default : 

#### tdBasicPage.goBackSelector 

- type : String 
- default : 

#### tdBasicPage.sendSelector 

- type : String 
- default : 

#### tdBasicPage.imgChooseSelector 

- type : String 
- default : 

#### tdBasicPage.imgSendSelector 

- type : String 
- default : 

#### tdBasicPage.imgCancelSelector 

- type : String 
- default : 

#### tdBasicPage.imgRotateSelector 

- type : String 
- default : 

### Priorities

#### none

### Static Methods

##### tdBasicPage.webTag2Selector

- webTag String 要查询的`webTag`
- type String(opt) `webTag`对应的类型. 默认值为`app`
- returns String webview的selector

返回`webTag`对应的`webview`的JQ selector.

#### tdBasicPage.htmlEntities(str)

- str String 要转化的字符串
- returns String 去HTML化的字符串

给`str`进行编码转化为纯文本. 防止在网页插入文本变成插入HTML代码.

#### tdBasicPage.waitForKeyElements(selectorTxt, actionFunction, bWaitOnce, iframeSelector)

- selectorTxt String The jQuery selector string that specifies the desired element(s).
- actionFunction Function The code to run when elements are found. It is passed a jNode to the matched element.
- bWaitOnce Bool(opt) If false, will continue to scan for new elements even after the first match is found.
- iframeSelector String(opt) If set, identifies the iframe to search.

A utility function that detects and handles AJAXed content. 
(该函数不建议使用, 推荐使用observation)

#### tdBasicPage.insertReady()

在页面插入<p id=electronReady>来标记页面已经加载好.
(不推荐使用)


#### tdBasicPage.webviewDynamicInsertJS(IDwebview, pathJS)

- IDwebview String webview的ID
- pathJS String 插入脚本的路径. 该处为绝对路径.

在webview页面插入一段JS代码.(不推荐使用)

#### tdBasicPage.setEndOfContenteditable(contentEditableElement)

- contentEditableElement Object 可编辑文本的元素.

将光标移动到可编辑文本的元素的最后. 比如input输入框, 想把光标移动到最后一个字符.

### Methods

#### none

### event

#### none

---

## class: tdMath

> 和数学有关的换算

### Static Priorities

#### none

#### Priorities

#### none

### Static Methods

#### tdMath.periodicPos(index, length)

- index number(Integer) : 非周期位置(可以是负数), 0代表开始位置
- length number(Integer) : 圆环长度 > 0 
- returns number(Integer) 实际位置 0~(length-1)

给定长度length的周期点环, 从0位开始计数. 返回第index个节点对应实际圆环的节点.

例如 : 圆环长度为3. index=5. 实际是圆环第2个点.


### Events

#### none
