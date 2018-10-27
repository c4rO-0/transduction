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

    $("body").append("<button id='msgBtnMain'> send to Main </button>")
    $("body").append("<button id='msgBtnWin'> send to Window </button>")

    $("body").append("<textarea id='txt-msg' rows='5' cols='100' style='background-color:red'>")
    
    $("#msgBtnMain").on("click", () => {
      core.sendToMain({ "test": "msgMain" }).then((arg) => {
        $("#txt-msg").text("Main : ", arg["test:msgMain"])
      })
    })

    $("#msgBtnWin").on("click", () => {
      core.sendToWin(1,{ "test": "msgWin" }).then((arg) => {
        $("#txt-msg").text("Win : ", arg["test:msgWin"])
      })
    })

    // ===============================

  }, false)

};