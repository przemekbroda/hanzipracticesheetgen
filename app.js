const {
  app,
  BrowserWindow
} = require('electron')

let appWindow

function createWindow () {
  appWindow = new BrowserWindow({
    width: 800,
    height: 600,
  })

  appWindow.loadFile('dist/hanzi-practice-sheet-gen/browser/index.html')

  appWindow.on('closed', () => {
    appWindow = null
  })
}

app.whenReady().then(() => createWindow())
