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

  // hide toolbar tooltips / bar
  win.setMenuBarVisibility(false);

  // load Apple Music site
  win.loadURL("http://beta.music.apple.com");

  // hide iTunes prompt and other random bullshittery by Apple.
  win.webContents.on('did-frame-finish-load', function() {
    win.webContents.executeJavaScript("const elements = document.getElementsByClassName('web-navigation__native-upsell'); while (elements.length > 0) elements[0].remove();");
  });

  // hide iTunes prompt and other random bullshittery by Apple again.
  win.webContents.on('did-stop-loading', function() {
    win.webContents.executeJavaScript("while (elements.length > 0) elements[0].remove();");
  });

}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)
