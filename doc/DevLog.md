# 日志

## 2018Oct25
auther : BS
目前用微信做实验. 实现webview和mian通讯.
skype没试, 估计会有问题. 主要原因是skype会对页面进行跳转, 跳转之后preload的脚本就失效了.
所以考虑skype需要搞一套普适的沟通框架.

## 2018Oct24
auther : BS
- 坑爹啊, preload要用绝对路径
``` javascript
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    resizable: true,
    webPreferences: {
      preload: path.resolve("./static/js/own/index_pre.js")
    }
  });
```

- 更加坑爹啊, window的preload死活用不了jquery.
所以建议window禁用preload功能. 全部使用webview技术.

- 目前需要的结构
electron是由窗口构成
一个窗口会对应多个html.
一个html会有一个自己的js脚本
一个html会有多个webview标签, 每个webview会有一个个preload js脚本
```
.
| - 1st window
|   | - html
|   |   | - html.js
|   |   | - webview.1.js
|   |   | - webview.2.js  
| - 2nd window
| - ...
```