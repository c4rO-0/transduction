#tdBasic

all basic classes and functions are here

---

## class: tdBasic

### Static Priorities

### Static Methods

#### uniqueStr()
返回一个以时间作为种子的唯一字符串.
目前被用在消息传递的时候创建一个独一无二的channel

##### Input
`none`

##### Output
- `String` uniqueStr : 具有唯一性的字符串

### Instance Events

### Instance Methods

### Instance priorities

---

## class: tdMath

和数学有关的换算

### Static Priorities

### Static Methods

#### periodicPos(index, length)

给定长度length的周期点环, 从0位开始计数. 返回第index个节点对应实际圆环的节点.

例如 : 圆环长度为3. index=5. 实际是圆环第2个点.

##### Input

- index `Int` : 非周期位置(可以是负数), 0代表开始位置
- length `Int` : 圆环长度 > 0 

##### Output

- `int` 实际位置 0~(length-1)

### Instance Events

### Instance Methods

### Instance priorities

---

## class: tdPage

对html页面的相关操作

### Static Priorities

### Static Methods

#### htmlEntities(str)

HTML encode

##### Input

- str `String` : html正常编码(包含\t等)

##### output

- `string` : 编码转还后. (包含`&lt;`等)

#### insertReady()

页面插入<p id=electronReady>来标记页面已经加载好.

#### waitForKeyElements(selectorTxt, actionFunction, [bWaitOnce], [iframeSelector])

A utility function that detects and handles AJAXed content. 

author : [BrockA](https://gist.github.com/BrockA/2625891#file-waitforkeyelements-js)

##### Input

- selectorTxt `String` : The jQuery selector string that specifies the desired element(s).

- actionFunction  `Function` : The code to run when elements are found. It is passed a jNode to the matched element.

- [bWaitOnce] `Boolean` : If false, will continue to scan for new elements even after the first match is found.

- [iframeSelector] `String`  If set, identifies the iframe to search.

#### webviewDynamicInsertJS(IDwebview, pathJS)

在指定webview页面插入一段JS代码.

##### Input

- IDwebview `String` : 要插入webview对应tag的ID

- pathJS `String`: 要插入的脚本存放的路径. 该处为绝对路径.

### Instance Events

### Instance Methods

### Instance priorities