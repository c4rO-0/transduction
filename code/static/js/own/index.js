const electron = require("electron");
let $ = require(process.env.PWD + '/static/js/jQuery/jquery-3.3.1.min.js')
const core = require(process.env.PWD + '/static/js/own/core.js')

function MsgWinResponse(key, arg) {
    let returnValue = null;
  
    if (key == "query") {

    }else if(key == "test"){
      returnValue = "Win test response"
    }else{
      returnValue ="Win request error"
    }
  
    return returnValue
  }

$(document).ready(function () {

    // // 
    let BtnRequestWinID = $('#btn-request-win-id');
    $(BtnRequestWinID).on("click",()=>{

        core.sendToMain({ "query": "winID" }).then((msgReply)=>{
            let IDList = msgReply["query:winID"]
            let txtAdd='ID : title\n'
            for (winID in IDList) {
                txtAdd = txtAdd+ winID.toString() + " : " + IDList[winID] +"\n"
            }
            $("#txt-win-id").text(txtAdd);            
        })

    })

    core.WinReply(MsgWinResponse)
});

