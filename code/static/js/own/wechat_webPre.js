window.onload = function () {
  let $ = require(process.env.PWD + '/static/js/jQuery/jquery-3.3.1.min.js')
  const core = require(process.env.PWD + '/static/js/own/core.js')

  var script = document.createElement("script");
  script.src = "https://code.jquery.com/jquery-3.3.1.min.js";
  script.onload = script.onreadystatechange = function () {
    $(document).ready(function () {
      core.insertReady()
    });
  };
  document.body.appendChild(script);

  let v = setInterval(()=>{
    console.log("check")
    core.insertReady()
  },5000);

  core.waitForKeyElements("#electronReady", () => {
    // 页面加载完成=====================

    $("body").append("<button id='asynchronous-messageBtn'> asynchronous </button>")

    $("body").append("<textarea id='txt-msg' rows='5' cols='100' style='background-color:red'>")
    
    $("#asynchronous-messageBtn").on("click", () => {
      core.sendToMain({ "test": "msg from wechat" }).then((arg) => {
        // console.log("add:", arg["test:msg"])
        $("#txt-msg").text(arg["test:msg"])
      })
    })


    // ===============================

  }, false)

};