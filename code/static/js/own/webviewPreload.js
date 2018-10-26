//  为避免加载的网页会有跳转, 所以所有的webview采用一样的脚本
// 仅仅是为了解决不能加载Jquery的问题. 
// 其他对页面操作的功能将会使用webview.javascript的方法注入脚本

window.onload = function () {
  let $ = require(process.env.PWD + '/static/js/jQuery/jquery-3.3.1.min.js')
  const core = require(process.env.PWD + '/static/js/own/core.js')

    var script = document.createElement("script");
    script.src = "https://code.jquery.com/jquery-3.3.1.min.js";
    script.onload = script.onreadystatechange = function () {
      $(document).ready(function () {
        
      });
    };
    document.body.appendChild(script);

    core.waitForKeyElements("#asynchronous-messageBtn",()=>{
      $("#asynchronous-messageBtn").on("click",()=>{
        console.log("click !")
        core.sendToMain({"test":"test"})
      })
    },false)

  };