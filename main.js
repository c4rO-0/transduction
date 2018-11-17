const { app, BrowserWindow } = require('electron')

const debug = /--debug/.test(process.argv[2])


function createWindow() {
    win = new BrowserWindow({ width: 1000, height: 700 })
    win.loadFile('./html/index.html')
    if (debug) {
        win.webContents.openDevTools()
    }

    if (process.platform == "win32") {
        win.setMenu(null)
    }

}

app.on('ready', createWindow)
