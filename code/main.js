// Modules to control application life and create native browser window
// var path = require('path');
// global.appRoot = path.resolve(__dirname);

const core = require(process.env.PWD + '/static/js/own/core.js')

const electron = require('electron')
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
// const ipcMain = electron.ipcMain

// require('devtron').install()
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow = null
let loadWindow = null


function MsgMainResponse(key, arg) {
  let returnValue = null;

  if (key == "query") {
    if (arg == "winID") {
      // 获取全部window ID
      let IDList = new Object;
      for (let win of BrowserWindow.getAllWindows()) {
        IDList[win.id] = win.getTitle();
      }
      returnValu =  IDList
    }
  }

  return returnValue
}


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



  loadWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    resizable: true,
    title: "loadWin"
  });

  loadWindow.loadFile('./templates/loadWin.html');

  loadWindow.webContents.openDevTools()
  loadWindow.maximize()

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


core.MainReply(MsgMainResponse)
core.MainReplySync(MsgMainResponse)
