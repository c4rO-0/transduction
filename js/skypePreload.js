window.onload=function(){
    window.$ = window.jQuery = require("../toolkit/jquery-3.3.1.min.js")
    console.log($("aside.sideContainer"))
}
// console.log("script working...")
// console.log(document.querySelectorAll("aside.sideContainer span.tileName"))

// let count=0
// function checkElement(selector, callback) {
//     let test = document.querySelectorAll(selector)
//     let limit = 10, t = 1500
//     if (test.length == 0 && count < limit) {
//         setTimeout(() => { checkElement(selector, callback) }, t)
//         count++
//         console.log("tried "+ count +" times")
//     } else if (count < limit) {
//         console.log("got target on "+ count+"th try")
//         count = 0
//         callback()
//     }else if(count >= limit) {
//         console.log("didn't find target")
//     }
// }

// checkElement("aside.sideContainer span.tileName", function(){
//     console.log("funciton is working and it says it worked")
//     document.querySelector("aside.sideContainer span.tileName").forEach(function (ele) {
//         console.log(ele)
//         if (ele.innerText == "Sheng Bi") {
//             ele.click()
//             console.log("clicked and returning...")
//             return
//         }
//     })
// })
