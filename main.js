const { app, BrowserWindow, Tray, Menu, MenuItem } = require('electron')
const Store = require('electron-store')
const config = new Store()
const store = new Store()

const debug = /--debug/.test(process.argv[2])

const os = require('os');
const path = require('path');
const fs = require('fs');
const URL = require('url').URL

const core = require("./js/core.js")

const { download } = require('electron-dl');
require('electron-reload')(__dirname)


let win = undefined
let tray = null
let isQuitting = false

function createWindow() {

  //让windows能弹notification
  app.setAppUserModelId("com.aaronlenoir.gnucash-reporter"); // set appId from package.json
  // autoUpdater.checkForUpdatesAndNotify();


  let opts = {
    icon: path.join(__dirname, '/res/pic/ico.png'), webPreferences: {
      nodeIntegration: true, webviewTag: true
    }
  }
  Object.assign(opts, config.get('winBounds'))
  // console.log(opts)  
  win = new BrowserWindow(opts)
  win.loadFile('./html/index.html')
  if (debug) {
    win.webContents.openDevTools()
  }

  if (process.platform == "win32") {
    win.setMenu(null)
  }


  win.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {

    let isAllowed = true
    
    console.log("PermissionRequest ")
    console.log('from : ', webContents.getURL())
    console.log('permission : ', permission)

    if(webContents.getURL().startsWith("file:///")){

    }else{
      if (permission === 'notifications') {
        isAllowed = false
      }
    }

    console.log('allowed : ', isAllowed)
    callback(isAllowed)
    console.log("-----------------------")
  })
  win.webContents.session.setPermissionCheckHandler((webContents, permission, callback) => {

    let isAllowed = true

    console.log("PermissionCheck ")
    console.log('from : ', webContents.getURL())
    console.log('permission : ', permission)

    if(webContents.getURL().startsWith("file:///")){

    }else{
      if (permission === 'notifications') {
        isAllowed = false
      }
    }

    console.log('allowed : ', isAllowed)
    callback(isAllowed)
    console.log("-----------------------")
  })

  win.on('close', (event) => {

    if (!store.has('tdSettings.swTray') || !store.get('tdSettings.swTray')) {
      isQuitting = true
    }

    if (!isQuitting) {
      event.preventDefault();
      win.hide();
    } else {
      // 清理temp文件夹
      console.log("cleaning temp folder...")
      function removeDir(dir) {
        if (fs.existsSync(dir)) {
          let files = fs.readdirSync(dir)
          for (var i = 0; i < files.length; i++) {
            let childPath = path.join(dir, files[i]);
            let stat = fs.statSync(childPath)
            if (stat.isDirectory()) {
              // 递归
              // console.log("children : ", childPath)
              removeDir(childPath);
            } else {
              //删除文件
              // console.log("del file : ", childPath)
              fs.unlinkSync(childPath);
            }
          }

          fs.rmdirSync(dir)
        }
      }

      console.log(path.join(os.tmpdir(), 'transduction'))
      removeDir(path.join(os.tmpdir(), 'transduction'))

      // 储存窗口位置
      console.log("saving configurations...")
      config.set('winBounds', win.getBounds())
    }


  })

  tray = new Tray(path.join(__dirname, '/res/pic/ico.png'))


  const contextMenu = Menu.buildFromTemplate([
    { id: 'main', label: 'main window', click() { win.show() } },
    {
      id: 'quit', label: 'quit', click() {
        isQuiting = true;
        app.quit();
      }
    },
    { type: 'separator' }
  ])
  tray.setContextMenu(contextMenu)

  // console.log(contextMenu)
  tray.setToolTip('transduction')

  tray.on('click', () => {
    win.isVisible() ? win.hide() : win.show()
  })

  win.on('focus', () => {
    tray.setImage(path.join(__dirname, '/res/pic/ico.png'))
  })


  // win.webContents.session.on('will-download', (event, item, webContents) => {

  //   item.on('updated', (event, state) => {
  //     if (state === 'interrupted') {
  //       console.log('Download is interrupted but can be resumed')
  //     } else if (state === 'progressing') {
  //       if (item.isPaused()) {
  //         console.log('Download is paused')
  //       } else {
  //         console.log(`Received bytes: ${item.getReceivedBytes()}`)
  //       }
  //     }
  //   })
  //   item.once('done', (event, state) => {
  //     if (state === 'completed') {
  //       console.log('Download successfully')
  //       console.log("save path : ", item.getSavePath())
  //     } else {
  //       console.log(`Download failed: ${state}`)
  //     }
  //   })

  // })

}

app.on('ready', createWindow)
//------------------------
// 处理消息
/**
 * core.MainReply 处理消息的函数
 * @param {String} key MSG的类别 : 
 * MSG-Log : 收到右侧窗口聊天记录
 * MSG-new : 左侧提示有新消息
 * @param {Object} Obj 收到的具体消息
 */
function respFuncMainReply(key, Obj) {
  return Promise.race([new Promise((resolve, reject) => {
    if (key == 'download') {
      /*
      * obj -> url
      */
      // console.log("download : ", Obj)
      let item = undefined
      download(win, Obj.url,
        {
          saveAs: true,
          onStarted: (it => {
            item = it
          }),
          onProgress: (pg => {
            // console.log("progress :", pg)
            let totalBytes = 0, receivedBytes = 0,
              startTime = 0, leftTime = -1
            speed = 0,
              duration = 0


            if (item !== undefined) {
              startTime = item.getStartTime()
              duration = new Date().getTime() / 1000. - startTime
              totalBytes = item.getTotalBytes()
              receivedBytes = item.getReceivedBytes()
              speed = duration > 0 ? receivedBytes / duration : 0
              leftTime = speed == 0 ? -1 : (totalBytes - receivedBytes) / speed
            }

            core.mainSendToWin(win, {
              'downloadUpdated':
              {
                ...Obj,
                "progress": pg,
                "totalBytes": totalBytes,
                'receivedBytes': receivedBytes,
                "startTime": startTime,
                "speed": speed,
                "leftTime": leftTime
              }
            }).then(reply => {
              // console.log('downloadUpdated reply : ', reply)
            }).catch(er => {
              console.log('downloadUpdated reply error : ', er)
            })
          }),
          showBadge: true,
          openFolderWhenDone: false
        })
        .then(dl => {
          resolve({
              ...Obj,
              'savePath': dl.getSavePath()
            })
        }).catch(er => {
          reject({"download":{
            ...Obj,
            'error': er
          }})
        })

    } else if (key == 'flash') {
      if (!win.isFocused()) {
        // win.showInactive();
        win.flashFrame(true);
        // win.setIcon('./res/pic/ico_count.png')
        tray.setImage(path.join(__dirname, '/res/pic/ico_count.png'))
      }
    } else if (key == 'trayMenu') {
      if (Obj.action == 'update') {
        contextMenu.append(new MenuItem(Obj.item))
      } else if (Obj.action == 'delete') {

      }
    } else if (key == 'focus') {
      win.focus()
    } else if (key == 'show') {
      win.show()
    }
  })])
}


app.on('before-quit', function () {
  isQuitting = true;
});

core.MainReply((key, arg) => {
  return respFuncMainReply(key, arg)
})
