const { app, BrowserWindow } = require('electron')
const Config = require('electron-store')
const config = new Config()

const debug = /--debug/.test(process.argv[2])

const os = require('os');
const path = require('path');
const fs = require('fs');
const URL = require('url').URL

const core = require("./js/core.js")

function createWindow() {

    let opts = { icon: './res/pic/ico.png' }
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

    win.on('close', () => {
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
    })


    win.webContents.session.on('will-download', (event, item, webContents) => {
        // Set the save path, making Electron not to prompt a save dialog.
        // item.setSavePath('/tmp/save.pdf')

        item.on('updated', (event, state) => {
          if (state === 'interrupted') {
            console.log('Download is interrupted but can be resumed')
          } else if (state === 'progressing') {
            if (item.isPaused()) {
              console.log('Download is paused')
            } else {
              console.log(`Received bytes: ${item.getReceivedBytes()}`)
            }
          }
        })
        item.once('done', (event, state) => {
          if (state === 'completed') {
            console.log('Download successfully')
          } else {
            console.log(`Download failed: ${state}`)
          }
        })
      })
    //   win.webContents.downloadURL('https://trello-attachments.s3.amazonaws.com/5a4a24ad70082d09dedb3653/5cb2e3b37bd6da33a7570e19/bed48319600bb7979717b7e86c8b09d2/7RQwoJ8z83Zi65NDMvmHKVU0WxBJIrh9szeW_v63iawFYoRE7Ay499ylT0cvNrQJXKaYMxiB2PyOZKnR82h0yxAghk5JFmQ0uefdqFruKB4BMoMKE-JdDvD5FYDX6Y73GSz40nCj%3Ds0.png');      

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
        if (key == 'Download') {
            console.log("download : ", Obj)
            let strDownload = Obj["url"]
            win.webContents.downloadURL(Obj["url"]);      
        }
    })])
}

core.MainReply((key, arg) => {
    return respFuncMainReply(key, arg)
})