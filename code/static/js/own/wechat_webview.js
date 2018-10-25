const electron = require("electron");
const ipc = electron.ipcRenderer


window.onload = function () {

  // =========等待消息==============
  //  main消息
  ipc.on('msg-ipc-asy-main-reply', function (event, arg) {
    console.log("main asy reply : ", arg)

  })
  // 其他消息

  var script = document.createElement("script");
  // 这地方还不能加载本地文件 
  script.src = "https://code.jquery.com/jquery-3.3.1.min.js";
  script.onload = script.onreadystatechange = function () {
    $(document).ready(function () {
      // console.log("hello")
      $("div.lang").append("<button id='asynchronous-messageBtn'> asynchronous </button>")
      $("div.lang").append("<button id='synchronous-messageBtn'> synchronous </button>")

      // =========向main发送消息==============
      let ASobjBtn = document.getElementById('asynchronous-messageBtn')

      let SobjBtn = document.getElementById('synchronous-messageBtn')

      ASobjBtn.addEventListener('click', function () {
        console.log("webview : msg 1");
        ipc.send('msg-ipc-asy-to-main', { "type": "msg from webview" })
      })

      SobjBtn.addEventListener('click', function () {
        console.log("webview : msg 2");
        let msgReply = ipc.sendSync('msg-ipc-sy-to-main', { "type": "msg from webview" })
        console.log("main sy reply : ", msgReply)
      })


    });
  };
  document.body.appendChild(script);




};
