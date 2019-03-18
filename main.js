const { app, BrowserWindow } = require('electron')
const Config = require('electron-store')
const config = new Config()

const debug = /--debug/.test(process.argv[2])

const os = require('os');
const path = require('path');
const fs = require('fs');
const URL = require('url').URL

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

}

app.on('ready', createWindow)


// 尝试禁止mainWindow加载url
// app.on('web-contents-created', (event, contents) => {

//     contents.on('will-navigate', (event, navigationUrl, isInPlace, isMainFrame) => {

//         const parsedUrl = new URL(navigationUrl)

//         if (parsedUrl.origin !== './html') {
//             event.preventDefault()
//         }

//     })

// })