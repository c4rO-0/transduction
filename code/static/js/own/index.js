const electron = require("electron");
let $ = require(process.env.PWD + '/static/js/jQuery/jquery-3.3.1.min.js')
const core = require(process.env.PWD + '/static/js/own/core.js')


/**
 * @description Main处理消息/请求的函数
 * @param {String} key 请求的关键词 
 *  - query : 查询
 *  - test : 测试
 * @param {any} arg 具体事件
 *  - winID : 对winID的操作
 * @returns {Promise}
 *  - 如果key和arg和预设不匹配将会返回"error : Main Response"
 */
function MsgWinResponse(key, arg) {

    return new Promise((resolve, reject) => {
        // let returnValue = null;

        if (key == "change") {
            if (arg == "output") {


            }
        } else if (key == "test") {
            ResponseTest().then((res) => {
                resolve(res)
            }).catch((rej) => {
                reject("MsgWinResponse : key=test |-> " + rej)
            })
        } else {
            reject("MsgWinResponse : no matched key or arg")
        }

        setTimeout(() => {
            reject("MsgWinResponse : timeout 5000")
        }, 5000);
    })
}

// -------Response:调用的处理函数------


function ResponseTest() {

    return new Promise((resolve, reject) => {
        resolve("test response")
    })

}

$(document).ready(function () {

    // // 
    let BtnRequestWinID = $('#btn-request-win-id');
    $(BtnRequestWinID).on("click", () => {

        core.sendToMain({ "query": "winID" }).then((msgReply) => {
            let IDList = msgReply["query:winID"]
            let txtAdd = 'ID : title\n'
            for (winID in IDList) {
                txtAdd = txtAdd + winID.toString() + " : " + IDList[winID] + "\n"
            }
            $("#txt-win-id").text(txtAdd);
        })

    })

    core.WinReply(MsgWinResponse)
});

