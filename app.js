const {
  app,
  BrowserWindow
} = require('electron')

let appWindow

function createWindow () {
  appWindow = new BrowserWindow({
    width: 600,
    height: 600,
    title: 'Hanzi Practice Sheet Generator',
    titleBarStyle: 'hidden',
    ...(process.platform !== 'darwin' ? { titleBarOverlay: true } : {}),
    webPreferences: {
      nodeIntegration: true,
    },
  })

  appWindow.removeMenu();

  appWindow.loadFile('dist/hanzi-practice-sheet-gen/browser/index.html')

  appWindow.on('closed', () => {
    appWindow = null
  })
}

app.whenReady().then(() => createWindow())
