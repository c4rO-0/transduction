const { app, BrowserWindow, BrowserView } = require('electron')
  
  function createWindow () {
    // Create the browser window.
    win = new BrowserWindow({ width: 800, height: 600})
    
    win.loadFile('./html/index.html')
    // win.loadURL("https://web.skype.com/en/")
    win.webContents.openDevTools()
    win.setMenu(null)
    let view = new BrowserView({
      webPreferences:{
        nodeIntegration:false
      }
    })
    win.setBrowserView(view)
    view.setBounds({x:10,y:10,width:800,height:600})
    view.webContents.loadURL("https://web.skype.com/en/")
    // win.setProgressBar(0.5)
  }
  
  
  app.on('ready', createWindow)
