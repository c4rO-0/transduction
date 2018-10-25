// Modules to control application life and create native browser window
const  electron= require('electron')
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;
const ipc = electron.ipcMain

// require('devtron').install()
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow=null
let loadWindow=null


function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    resizable: true
  });
  
  mainWindow.loadFile('./templates/index.html');

  mainWindow.webContents.openDevTools()
  mainWindow.maximize()



  loadWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    resizable: true
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


// ===========其他窗口消息===============
// 虽然send后面接非常多的参数(channel,[arg1,arg2,....]) 
// 但是为了统一接口, 只接受一个字典参数
ipc.on('msg-ipc-asy-to-main', function(event,arg){
  event.sender.send('msg-ipc-asy-main-reply', {'type': 'reply msg from main'})
  console.log("========================")
  console.log("main asy receive from window ", event.sender.getOwnerBrowserWindow().id)
  console.log("msg is : ", arg)
})

ipc.on('msg-ipc-sy-to-main', function(event,arg){
  event.returnValue = {'type': 'reply msg from main'}
  console.log("========================")
  console.log("main sy receive from window  ", event.sender.getOwnerBrowserWindow().id)
  console.log("msg is : ", arg)
})

