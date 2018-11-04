# 开发文档

## 2018Nov04: BS
发现linux下不能调用`BrowserWindow.setMenu(null)`.
目前做一个平台识别.

## 2018Nov04: L

经过短暂学习，开始正式开发。
基本是将L的学习代码原样搬过来，但是不用担心，代码只在hello world的基础上做了一点点修改。  
包括：
- 带Devtool运行：npm run debug
- 调用了 bootstrap 和 jquery 的一个按钮 switch
- 两个 webview，全部默认设置
- 不显示窗口的菜单

 起码还存在以下需要修改的地方：
- package.json 文件中没有写 repository 和 license，导致运行时报 warning
- main.js 基本上是最精简版，官方其实有提供更完备一点的例子可参考
- 为保证每个文件夹中有文件，在 res/pic 中放了一个无关图片