const { app, BrowserWindow, globalShortcut } = require('electron')
const electron = require('electron');
const path = require('path')
const fs = require('fs')
const nativeTheme = electron.nativeTheme;
const client = require('discord-rich-presence')('749317071145533440');
const { session } = require('electron')
let pos_atr = {durationInMillis: 0};
let currentPlayBackProgress

const playbackStatusPlay = 'Playing';
const playbackStatusPause = 'Paused';
const playbackStatusStop = 'Stopped';

const filter = {
    urls: ['https://music.apple.com/','https://music.apple.com/us/browse']
}

function createWindow () {
  // Create the browser window.
  const win = new BrowserWindow({
    icon: path.join(__dirname, './assets/icon.png'),
    width: 1024,
    height: 600,
    minWidth: 300,
    minHeight: 300,
    frame: true,
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

  // Load Apple Music site
  win.loadURL("https://music.apple.com");

  // Hide iTunes prompt and other external buttons by Apple.
  win.webContents.on('did-frame-finish-load', function() {
    win.webContents.executeJavaScript("const elements = document.getElementsByClassName('web-navigation__native-upsell'); while (elements.length > 0) elements[0].remove();");
  });

  // Hide iTunes prompt and other external buttons by Apple. Ensure deletion.
  win.webContents.on('did-stop-loading', function() {
    win.webContents.executeJavaScript("while (elements.length > 0) elements[0].remove();");
  });

  // Fix those ugly scrollbars and also execute MusicKitInterop.
  win.webContents.once('did-stop-loading', async () => {
    await win.webContents.insertCSS('::-webkit-scrollbar { display: none; }')
    await win.webContents.executeJavaScript('MusicKitInterop.init()')
  })


  // Insert Jarek Toros amazing work with MusicKit and Mpris (https://github.com/JarekToro/Apple-Music-Mpris/) (NOTE: Mpris is not enabled in this branch. See mpris-enabled)!

    electron.ipcMain.on('mediaItemStateDidChange', (item, a) => {
        updateMetaData(a)
    })

    electron.ipcMain.on('playbackStateDidChange', (item, a) => {
        // updateMetaData(a)
        switch (a) {
            case 0:
                console.log("NONE")
                setPlaybackIfNeeded(playbackStatusPause);
                break;
            case 1:
                console.log("loading")
                setPlaybackIfNeeded(playbackStatusPause);
                break;
            case 2:
                console.log("playing")
                setPlaybackIfNeeded(playbackStatusPlay);
                break;
            case 3:
                console.log("paused")
                setPlaybackIfNeeded(playbackStatusPause);
                break;
            case 4:
                console.log("stopped")
                setPlaybackIfNeeded(playbackStatusStop);
                break;
            case 5:
                console.log("ended")
                break;
            case 6:
                console.log("seeking")
                break;
            case 7:
                console.log("waiting")
                break;
            case 8:
                console.log("stalled")
                break;
            case 9:
                console.log("completed")
                break;

        }

    })

    async function getMusicKitAttributes() {
          return await win.webContents.executeJavaScript(`MusicKitInterop.getAttributes()`);
      }

    async function updateMetaData(attributes) {

          // Update rich presence when audio is playing.
          win.webContents.on('media-started-playing', function() {
            client.updatePresence({
              state: `${attributes.albumName}`,
              details: `${attributes.name}`,
              startTimestamp: Date.now(),
              endTimestamp: 1337,
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
              endTimestamp: 1337,
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
          endTimestamp: 1337,
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
