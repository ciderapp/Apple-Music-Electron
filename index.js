
const { app, BrowserWindow, globalShortcut, Tray, Menu} = require('electron')
const electron = require('electron');
const path = require('path')
const fs = require('fs')
const nativeTheme = electron.nativeTheme;
const client = require('discord-rich-presence')('749317071145533440');
const { session } = require('electron')
const isReachable = require('is-reachable');
require('v8-compile-cache');
let pos_atr = {durationInMillis: 0};
let currentPlayBackProgress
let isQuiting
let isMaximized

const playbackStatusPlay = 'Playing';
const playbackStatusPause = 'Paused';
const playbackStatusStop = 'Stopped';

const filter = {
    urls: ['https://beta.music.apple.com/','https://beta.music.apple.com/us/browse']
}

function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    icon: path.join(__dirname, './assets/icon.png'),
    width: 1024,
    height: 600,
    minWidth: 300,
    minHeight: 300,
    frame: false,
    title: "Apple Music",
  // Enables DRM
    webPreferences: {
      plugins: true,
      preload: path.join(__dirname, './assets/MusicKitInterop.js'),
      allowRunningInsecureContent: true,
    }
  })

  // Apply dangerous sandbox patch for Debian/Ubuntu devices and systems. Disabled by default.
  // app.commandLine.appendSwitch('--no-sandbox')

  // Hide toolbar tooltips / bar
  win.setMenuBarVisibility(false);
    
  // Check for Apple Music Sites
  async function betaOnline() {
      return isReachable('https://beta.music.apple.com');
  }

  var appleMusicUrl = "https://music.apple.com"

  if (betaOnline().catch == true)
    {
      var appleMusicUrl = "https://beta.music.apple.com"
    }

  win.loadURL(appleMusicUrl);

  win.on('page-title-updated', function(e) {
    e.preventDefault()
  });

  // hide app instead of quitting 
  win.on('close', function (event) {
    if (!isQuiting) {
      event.preventDefault();
      win.hide();
      event.returnValue = false;
    }
  });


  // Hide iTunes prompt and other external buttons by Apple. Ensure deletion. Create Draggable div to act as title bar. Create close, min, and max buttons. (OSX style since this is *Apple* Music)
  win.webContents.on('did-stop-loading', function() {
    win.webContents.executeJavaScript("const elements = document.getElementsByClassName('web-navigation__native-upsell'); while (elements.length > 0) elements[0].remove();");
    win.webContents.executeJavaScript("while (elements.length > 0) elements[0].remove();");
    win.webContents.executeJavaScript("if(document.getElementsByClassName('web-navigation')[0] && !(document.getElementsByClassName('web-navigation')[0].style.height == 'calc(100vh - 32px)')){ let dragDiv = document.createElement('div'); dragDiv.style.width = '100%'; dragDiv.style.height = '32px'; dragDiv.style.position = 'absolute'; dragDiv.style.top = dragDiv.style.left = 0; dragDiv.style.webkitAppRegion = 'drag'; document.body.appendChild(dragDiv); var closeButton = document.createElement('span'); document.getElementsByClassName('web-navigation')[0].style.height = 'calc(100vh - 32px)'; document.getElementsByClassName('web-navigation')[0].style.bottom = 0; document.getElementsByClassName('web-navigation')[0].style.position = 'absolute'; document.getElementsByClassName('web-chrome')[0].style.top = '32px'; var minimizeButton = document.createElement('span'); var maximizeButton = document.createElement('span'); document.getElementsByClassName('web-navigation')[0].style.height = 'calc(100vh - 32px)'; closeButton.style = 'height: 11px; width: 11px; background-color: rgb(255, 92, 92); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 4px 10px 10px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5); -webkit-app-region: no-drag; '; minimizeButton.style = 'height: 11px; width: 11px; background-color: rgb(255, 189, 76); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 4px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5); -webkit-app-region: no-drag;'; maximizeButton.style = 'height: 11px; width: 11px; background-color: rgb(0, 202, 86); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 10px 10px 4px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5); -webkit-app-region: no-drag;'; closeButton.onclick= window.close; minimizeButton.onclick = ()=>{ipcRenderer.send('minimize')}; maximizeButton.onclick = ()=>{ipcRenderer.send('maximize')}; dragDiv.appendChild(closeButton); dragDiv.appendChild(minimizeButton); dragDiv.appendChild(maximizeButton); closeButton.onmouseenter = ()=>{closeButton.style.filter = 'brightness(50%)'}; minimizeButton.onmouseenter = ()=>{minimizeButton.style.filter = 'brightness(50%)'}; maximizeButton.onmouseenter = ()=>{maximizeButton.style.filter = 'brightness(50%)'}; closeButton.onmouseleave = ()=>{closeButton.style.filter = 'brightness(100%)'}; minimizeButton.onmouseleave = ()=>{minimizeButton.style.filter = 'brightness(100%)'}; maximizeButton.onmouseleave = ()=>{maximizeButton.style.filter = 'brightness(100%)'};}")

  });

  // Fix those ugly scrollbars and also execute MusicKitInterop.
  win.webContents.once('did-stop-loading', async () => {
    await win.webContents.insertCSS('::-webkit-scrollbar { display: none; }')
    await win.webContents.executeJavaScript('MusicKitInterop.init()')
  })

  // create system tray icon
  if(process.platform == 'win32') trayIcon = new Tray(path.join(__dirname, './assets/icon.ico'))
  else trayIcon = new Tray(path.join(__dirname, './assets/icon.png'))

  // right click menu to quit and show app
  var contextMenu = Menu.buildFromTemplate([
    { label: 'Show Window', click:  function(){
        win.show();
    } },
    { label: 'Quit Apple Music', click:  function(){
        app.isQuiting = true;
        app.quit();
    } }
  ]);
  trayIcon.setContextMenu(contextMenu);

  // restore app on normal click
  trayIcon.on('click', ()=>{
    win.show()
  })

  // listen for minimize event
  electron.ipcMain.on('minimize', ()=>{
    win.minimize()
  })

  // listen for maximize event and perform restore/maximize depending on window state
  electron.ipcMain.on('maximize', ()=>{
    if(isMaximized){
      win.restore()
      isMaximized = false
    }
    else{
    win.maximize()
    isMaximized = true
    }
  })

  // Insert Jarek Toros amazing work with MusicKit and Mpris (https://github.com/JarekToro/Apple-Music-Mpris/) (NOTE: Mpris is not enabled in this branch. See mpris-enabled)!

    electron.ipcMain.on('mediaItemStateDidChange', (item, a) => {
        updateMetaData(a)
        updateTooltip(a)
    })

    async function updateTooltip(attributes){
    
        // Update tooltip when audio is playing.
        win.webContents.on('media-started-playing',()=> {
          var tooltip = `Playing ${attributes.name} - ${attributes.albumName} by ${attributes.artistName}`
          trayIcon.setToolTip(tooltip);
        })
        
        // Update tooltip when audio is paused
        win.webContents.on('media-paused', () => {
          var tooltip = `Paused ${attributes.name} on ${attributes.albumName} by ${attributes.artistName}`
          trayIcon.setToolTip(tooltip)
        })

        // Start tooltip with idle name
        var tooltip = `Nothing's playing right now`
        trayIcon.setToolTip(tooltip);
    }

    async function getMusicKitAttributes() {
          return await win.webContents.executeJavaScript(`MusicKitInterop.getAttributes()`);
      }

    async function updateMetaData(attributes) {

          var songlengthstring = Math.round(attributes.durationInMillis + Date.now())
          var songlength = Number(songlengthstring)
          // Update rich presence when audio is playing.
          win.webContents.on('media-started-playing', function() {
            client.updatePresence({
              state: `${attributes.albumName} - ${attributes.artistName}`,
              details: `${attributes.name}`,
              startTimestamp: Date.now(),
              endTimestamp: songlength,
              largeImageKey: 'apple',
              smallImageKey: 'play',
              instance: true,
            });
          });

          // Update rich presence when audio is paused or turned off.
          win.webContents.on('media-paused', function() {
            client.updatePresence({
              state: "(Paused)",
              details: `${attributes.name}`,
              startTimestamp: Date.now(),
              endTimestamp: Date.now(),
              largeImageKey: 'apple',
              smallImageKey: 'pause',
              instance: true,
            });
          });

        // Start rich presence service into idle mode.
        client.updatePresence({
          state: '(Nothing has played)',
          details: 'Music Stopped',
          startTimestamp: Date.now(),
          endTimestamp: Date.now(),
          largeImageKey: 'apple',
          smallImageKey: 'stop',
          instance: true,
        });

      }

}

// This argument is for Linux operating systems that dont support the CSS theme preference.
nativeTheme.themeSource = 'dark';

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
    app.quit()
})

app.on('before-quit', function () {
  isQuiting = true;
});
