const { app, BrowserWindow } = require('electron')
const Config = require('electron-store')
const config = new Config()

const debug = /--debug/.test(process.argv[2])


function createWindow() {

    let opts = {}
    Object.assign(opts, config.get('winBounds'))    
    win = new BrowserWindow(opts)
    win.loadFile('./html/index.html')
    if (debug) {
        win.webContents.openDevTools()
    }

    if (process.platform == "win32") {
        win.setMenu(null)
    }

    win.on('close', () => {
        config.set('winBounds', win.getBounds())
    })

}

app.on('ready', createWindow)

