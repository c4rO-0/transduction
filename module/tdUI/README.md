# tdUI

> transduction封装的UI函数

---

## class: tdConvoUI

> convo对应的UI相关函数.

### Static Priorities

#### none

### Priorities

#### none

### Static Methods

#### tdConvoUI.toHTML(valTdConvo)

- valTdConvo tdConvo 要转化的convo
- returns String convo需要的HTML

将tdConvo转化为准备插入到页面的HTML.

#### tdConvoUI.addToPage(valTdConvo, isPretend)

- valTdConvo tdConvo 要显示的convo
- isPretend Bool(opt) 只修改页面已存在的convo

将convo在页面上显示.

### Methods

#### none

### event

#### none

---

## class: tdBubbleUI

> bubble对应的UI相关函数.

### Static Priorities

> bubble模板. 由`iniTemplate`进行初始化赋值. 构词`b+类型+左/右`
> 类型 : Text, Url, Unknown, FSend(firefox send),File, Img

#### tdBubbleUI.bTextL

#### tdBubbleUI.bTextR

#### tdBubbleUI.bUrlL

#### tdBubbleUI.bUrlR

#### tdBubbleUI.bUnknownL

#### tdBubbleUI.bUnknownR

#### tdBubbleUI.bFSendL

#### tdBubbleUI.bFSendR

#### tdBubbleUI.bFileL

#### tdBubbleUI.bFileR

#### tdBubbleUI.bImgL

#### tdBubbleUI.bImgR

### Priorities

#### none

### Static Methods

#### tdBubbleUI.iniTemplate()

初始化bubble模板. 模板被存在`index.html`

#### tdBubbleUI.toHTML(bubble)

- bubble tdBubble 要转化的bubble

将bubble转化为HTML.

---

## class: tdUI

> api配套的UI函数.

### Static Priorities

#### tdUI.inputImgHeightLimit

- type : number(Integer) 
- default : 100

默认显示图片高度.

#### tdUI.inputImgHeightLimit

- type : number(Integer) 
- default : 600

默认显示图片宽度.

### Static Methods

#### tdUI.initialize()

初始化UI. 包括bubble的模板等.

#### tdUI.rightBackToDefault()

右侧还原回default/开始页面.

#### tdUI.webTag2ButtonSelector(webTag, type)

- webTag String webview的tag
- type String(opt) default:'app'
- returns String webTag对应的按钮JQ selector.

获得webTag的JQ selector.

#### tdUI.setSwTray(value)

- value Bool swTray的值

在页面修改swTray的值为`value`.

#### tdUI.getPinCoordFromPage()

- returns Array(number) Pin坐标. [x,y]

获取当前Pin坐标.

#### tdUI.setPin(pinCoord)

- pinCoord Array(number) pin坐标[x,y]

设置页面上Pin坐标.

#### tdUI.followPin()

根据pin位置, 更新面板分割线.

#### tdUI.getInputHTML()

- returns String 返回文字编辑区的HTML.

#### tdUI.resetInput()

重置文字编辑区为空.

#### tdUI.appendInputHTML(html)

- html String 要在文字编辑区附加的内容.

将html附加到文字编辑区.

#### tdUI.getImageSizeFromDataurl(dataUrl)

- dataUrl 图片.
- returns Promise({ width: w, height: h })

从dataURL获取图片大小.

#### tdUI.autoSizeImg(dataUrl, widthLimit, heightLimit)

- dataUrl 图片.
- widthLimit number(integer) 最大宽度限制.
- heightLimit number(integer) 最大高度限制.
- returns Promise({ width: w, height: h })

图片根据最大宽度和高度, 返回按比例调整后的高宽. 该程序不对图片本身改变.

#### tdUI.pasteHtmlAtCaret(html, selector)

- html String 要插入的代码.
- selector String(opt) default: undefined. 预期要插入元素的JQ selector

在光标处插入代码html. 如果指定selector, 当发现光标不在selector的子元素上时, 直接把html附加到selector后面.

#### tdUI.itemToHTML(item)

- item array[{'key':value}] (len == 1)  粘贴或拖拽之后, 经过初步处理的元素.
- returns Promise()

将拖拽等操作初步处理的元素`item`转化为html, 并将html附加在页面上.
key : file text url

#### tdUI.filterDataTransfer(data)

- data DataTransfer 用户粘贴或拖拽的内容.
- returns items array[{'key':value},....] 以数组形式储存初步处理的结果.

将用户粘贴或拖拽的内容初步处理, 为file text url.


#### tdUI.processDataTransfer(data)

- data DataTransfer 用户粘贴或拖拽的内容.
- returns Promise()

将drag/paste data数据转化为Html附加到页面上.

#### tdUI.filterFiles(files)

- files FileList input中的内容.
- returns items array[{'key':value},....] 以数组形式储存初步处理的结果.

key : file text url
读取input元素, 并转化为初步处理的结果.
(input指 : 在点击`附加`按钮添加文件所到的input元素. )

#### tdUI.processFileList(fileList)

- fileList FileList input中的内容.
- returns Promise 

读取input元素, 并显示在页面上.
(input指 : 在点击`附加`按钮添加文件所到的input元素. )

#### tdUI.addConvo(webTag, convo)

- webTag String convo对应的webTag.
- convo tdConvo 要显示的convo.

将convo显示在页面上. 并执行提示等动作.

#### tdUI.addDialog(webTag,userID, bubbleList)

- webTag String convo对应的webTag.
- userID String bubble对应的userID. 
- bubbleList tdList(tdBubble) 要显示的bubbles.

显示bubbleList. 这里要核实当前右侧打开的用户是否为webTag, userID, 不是不会显示.

#### tdUI.updateDownloadBar(downItem)

- downItem tdDownloadItem 要更新的下载元素.

根据downItem更新当前下载状态.




