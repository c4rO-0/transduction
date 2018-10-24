window.onload = function() {
    var script = document.createElement("script");
    // 这地方还不能加载本地文件
    script.src = "https://code.jquery.com/jquery-3.3.1.min.js";
    script.onload = script.onreadystatechange = function() {
      $(document).ready(function() {
        // console.log("hello")
        console.log($("img"))
      });
    };
    document.body.appendChild(script);
};
