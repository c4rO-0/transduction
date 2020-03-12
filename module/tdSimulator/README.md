#tdSimulator

- 模拟用户(硬件)输入
- chrome debug函数的封装

---

## class: tdSimulator

### Static Priorities

### Static Methods

#### mouseSimulator(webSelector, type, x, y)

对webview进行鼠标模拟

[chrome debugger for mouse](https://chromedevtools.github.io/devtools-protocol/1-2/Input)

##### Input

-  webSelector `string`  'webview[data-app-name="skype"]'

- type `string` type nousedown, mouseup, click
- x, y `int` : position to left,head

#### keypressSimulator(webSelector, type, charCode, [shift], [alt], [ctrl], [cmd])

模拟按键盘

- webSelector `string`  'webview[data-app-name="skype"]'

-  type `string`  type keyup, keydown, keypress

- charCode `int` :  charCode windowsVirtualKeyCode(目前只对字母好使) code列表 https://docs.microsoft.com/en-us/windows/desktop/inputdev/virtual-key-codes

- [shift]  `boolean` default : false 

- [alt] `boolean default : false

- [ctrl]   `boolean`default : false

- [cmd] `boolean` default : false

#### attachInputFile(webSelector, inputSelector, filePath)

向webview input附加文件

- webSelector `string`  'webview[data-app-name="skype"]'

- inputSelector `string` 要附加文件的input的jq selector
- filePath `string` 要附加的文件路径, 必须为绝对路径

### Instance Events

### Instance Methods

### Instance priorities

