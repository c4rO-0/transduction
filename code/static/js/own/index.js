

$(document).ready(function () {
    $("#goto-skype").on("click",()=>{
        $("#webview-wechat").css("visibility","hidden")
        $("#webview-skype").css("visibility","visible")
    })
    $("#goto-wechat").on("click",()=>{
        $("#webview-wechat").css("visibility","visible")
        $("#webview-skype").css("visibility","hidden")
    })    
});