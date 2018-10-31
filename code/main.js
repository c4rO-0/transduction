// Modules to control application life and create native browser window
// var path = require('path');
// global.appRoot = path.resolve(__dirname);

const core = require(process.env.PWD + '/static/js/own/core.js')

const electron = require('electron')
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
// const ipcMain = electron.ipcMain

// =======变量===========
let mainWindow = null
let loadWindow = null


// ========函数===========


// -------Main Msg : 分类函数-----

/**
 * @description Main处理消息/请求的函数
 * @param {String} key 请求的关键词 
 *  - query : 查询
 *  - test : 测试
 * @param {String} arg 具体事件
 *  - winID : 对winID的操作
 * @returns {Promise}
 *  - 如果key和arg和预设不匹配将会返回"error : Main Response"
 */
function MsgMainResponse(key, arg) {

  return new Promise((resolve, reject) => {
    // let returnValue = null;

    if (key == "query") {
      if (arg == "winID") {
        // 获取全部window ID
        ResponseGetWinID().then((res) => {
          resolve(res)
        }).catch((rej) => {
          reject("MsgMainResponse : key=query arg=winID |-> " + rej)
        })
      }
    } else if (key == "test") {
      ResponseTest().then((res) => {
        resolve(res)
      }).catch((rej) => {
        reject("MsgMainResponse : key=test |-> " + rej)
      })
    } else {
      reject("MsgMainResponse : no matched key or arg")
    }

    setTimeout(() => {
      reject("MsgMainResponse : timeout 5000")
    }, 5000);
  })
}


// -------Response:调用的处理函数------
function ResponseGetWinID() {
  // 获取全部window ID
  return new Promise((resolve, reject) => {
    let IDList = new Object;
    for (let win of BrowserWindow.getAllWindows()) {
      IDList[win.id] = win.getTitle();
    }
    resolve(IDList)
  })

}

function ResponseTest() {

  return new Promise((resolve, reject) => {
    resolve("test response")
  })

}


// ============对Window处理===================
function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    resizable: true,
    title: "mainWin"
  });


  mainWindow.loadFile('./templates/index.html');


  mainWindow.webContents.openDevTools()
  mainWindow.maximize()



  // loadWindow = new BrowserWindow({
  //   width: 1024,
  //   height: 768,
  //   resizable: true,
  //   title: "loadWin"
  // });

  // loadWindow.loadFile('./templates/loadWin.html');

  // loadWindow.webContents.openDevTools()
  // loadWindow.maximize()

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null

  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})



// ===========消息处理==========
core.MainReply(MsgMainResponse)




