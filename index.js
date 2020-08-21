const { app, BrowserWindow, globalShortcut } = require('electron')
var path = require('path')

function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    icon: path.join(__dirname, './assets/icon.png'),
    width: 800,
    height: 600,
    minWidth: 300,
    minHeight: 300,
  // Enables DRM
    webPreferences: {
      plugins: true
    }
  })
  
  // hide toolbar
  win.setMenuBarVisibility(false);

  // and load Apple Music
  win.loadURL("http://beta.music.apple.com");
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)