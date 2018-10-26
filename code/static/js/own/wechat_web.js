//  存在隐患, 会不会导致jquery加了好多遍
var script = document.createElement("script");
script.src = "https://code.jquery.com/jquery-3.3.1.min.js";
script.onload = script.onreadystatechange = function () {
  $(document).ready(function () {

    // 检查脚本是否执行
    // console.log("skype_web :" , $('#electronReady'))
    insertReady()
    let v = setInterval(()=>{
      console.log("check")
      insertReady()
    },5000);
  });
};
document.body.appendChild(script);


function insertReady(){
  if ($('#electronReady') ==null || $('#electronReady').length == 0) {
    $("body").append("<p id='electronReady' style='visibility:hidden;'> electronReady </p>")
    whatUdo()
  }
}

function whatUdo(){

    //===================页面操作=======================

    console.log("active")

    $("div.lang").append("<button id='asynchronous-messageBtn'> asynchronous </button>")

    

    // ==================操作结束=======================
}