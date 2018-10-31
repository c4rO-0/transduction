# 日志

## 2018Oct31
author : BS
core中发送消息函数基本都写好了, 现在要写接洽的函数, 并测试一波看看好不好使
- 首先向main发送消息

## 2018Oct29
author : BS
目前存在隐患
如果Host向web连续发送两次信息 msg1, msg2.
但是msg1回复的比msg2要慢, 可能导致Host两个消息都接收不到.

同样, 其他接收消息函数, 如果超时, on监听没有关闭, 因为加了unistr, 虽然不会有什么问题, 但是会导致越来越多的监听.

## 2018Oct27
author : BS
哇, skype坑爹啊. 登录之后那个页面jquery被禁用掉了, 然后整个聊天框被嵌入到了ifram里
导致脚本注入失败....
打算把注入部分也放在preload里好了

## 2018Oct26
author : BS
加载skype始终是个问题. 目前设计的思路.(不仅限于skype)

- webview preload加载的scripte是一直在运行的.
所以如果只是等待页面响应, 向外发送消息, 那么非常好做. 不需要考虑url变换的问题.

- 如果考虑交互
比如我们需要在页面添加一个按钮, 等待用户按.
目前是, 在preload里等待按钮id出现, 出现后添加listen监视被按.
"添加按钮" 功能可以使用动态在页面插入脚本功能.

## 2018Oct25
author : BS
目前用微信做实验. 实现webview和mian通讯.
skype没试, 估计会有问题. 主要原因是skype会对页面进行跳转, 跳转之后preload的脚本就失效了.
所以考虑skype需要搞一套普适的沟通框架.

## 2018Oct24
author : BS
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