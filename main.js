const { app, BrowserWindow } = require('electron')
  
const debug = /--debug/.test(process.argv[2])

  function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({ width: 800, height: 600})
    
    win.loadFile('./html/index.html')
    // win.loadURL("https://web.skype.com/en/")
    if(debug){
      win.webContents.openDevTools()
    }
    win.setMenu(null)
    // win.setProgressBar(0.5)
  }
  
  
  app.on('ready', createWindow)
