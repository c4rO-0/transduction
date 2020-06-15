#tdSimulator

> 模拟用户(硬件)输入
> chrome debug函数的封装

---

## class: tdSimulator

> 模拟用户(硬件)输入. chrome debug函数的封装

### Static Priorities

#### none

### Priorities

#### none

### Static Methods

#### tdSimulator.mouseSimulator(webSelector, type, x, y)

- webSelector String  'webview[data-app-name="skype"]'

- type String type nousedown, mouseup, click
- x, y number(integer) : position to left,head

对webview进行鼠标模拟

[chrome debugger for mouse](https://chromedevtools.github.io/devtools-protocol/1-2/Input)


#### tdSimulator.keypressSimulator(webSelector, type, charCode, [shift], [alt], [ctrl], [cmd])

- webSelector `string`  'webview[data-app-name="skype"]'

-  type `string`  type keyup, keydown, keypress

- charCode `int` :  charCode windowsVirtualKeyCode(目前只对字母好使) code列表 https://docs.microsoft.com/en-us/windows/desktop/inputdev/virtual-key-codes

- [shift]  `boolean`(opt) default : false 

- [alt] `boolean default : false

- [ctrl]   `boolean`(opt) default : false

- [cmd] `boolean`(opt) default : false

模拟按键盘

#### tdSimulator.attachInputFile(webSelector, inputSelector, filePath)

向webview input附加文件

- webSelector `string`  'webview[data-app-name="skype"]'

- inputSelector `string` 要附加文件的input的jq selector
- filePath `string` 要附加的文件路径, 必须为绝对路径

### Events

#### none

### Methods

