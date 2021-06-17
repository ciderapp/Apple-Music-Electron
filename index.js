require('v8-compile-cache');
const { app, nativeTheme, ipcMain, Notification } = require('electron');
const { UpdateMetaDataMpris, PlaybackStateHandler, InitMpris, LoadJSFile, LoadTheme, GetLocale, SetThumbarButtons, Init, InitDevMode, InitDiscordRPC, InitTray, UpdateDiscordActivity, UpdateTooltip, CreatePlaybackNotification, CreateBrowserWindow, WindowHandler } = require('./resources/functions');
const gotTheLock = app.requestSingleInstanceLock();
app.win = '';
app.config = require('./config.json');
if (app.config.preferences.discordRPC) {
    app.discord = {client: false, error: false};
    app.discord.client = require('discord-rich-presence')('749317071145533440');
    console.log("[DiscordRPC] Initializing Client.")
}
app.isQuiting = !app.config.preferences.closeButtonMinimize;
app.config.css.glasstron = app.config.preferences.cssTheme.toLowerCase().split('-').includes('glasstron');
if (app.config.preferences.mprisSupport) {
  try {
    InitMpris()
  } catch(err) {
    console.error(`[Mpris] ${err}`)
  }
}

//########################## NO TOUCHY TY ####################################
let dev = false
//############################################################################

function createWindow() {

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    //      Prevent Multiple Instances
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    if (!gotTheLock && !app.config.advanced.allowMultipleInstances) {
        console.log("[Apple-Music-Electron] Existing Instance is Blocking Second Instance.")
        app.quit();
        return
    } else {
        app.on('second-instance', (_e, argv) => {
            if (argv.indexOf("--force-quit") > -1) {
                app.quit()
            } else if (app.win && !app.config.advanced.allowMultipleInstances) {
                app.win.show()
            }
        })
    }

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    //      Detects if the application has been opened with --force-quit
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    if (app.commandLine.hasSwitch('force-quit')) {
        console.log("[Apple-Music-Electron] User has closed the application via --force-quit")
        app.quit()
        return;
    }
    CreateBrowserWindow() // Create the Window
    SetThumbarButtons() // Set the Inactive Thumbar

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    //      Load the Webpage
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    let locale = GetLocale()
    let url = (app.config.advanced.useBeta) ? `https://beta.music.apple.com/${locale}?l=${locale}` : `https://music.apple.com/${locale}?l=${locale}`;
    let fallback = `https://music.apple.com/${locale}?l=${locale}`

    console.log(`[Apple-Music-Electron] The chosen website is ${url}`)
    app.win.loadURL(url).catch(() => {
        app.win.loadURL(fallback).then(() => console.log(`[Apple-Music-Electron] ${url} was unavailable, falling back to ${fallback}`))
    })

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    //      Load all the JS and CSS for the webpage
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    nativeTheme.themeSource = app.config.systemTheme;
    app.win.webContents.on('did-stop-loading', async () => {
        if (app.config.css.removeAppleLogo) {
            LoadJSFile('removeAppleLogo.js')
        }
        if (app.config.css.removeUpsell) {
            LoadJSFile('removeUpsell.js')
        }
        if (app.config.css.macosWindow) {
            LoadJSFile('macosWindowFrame.js')
        }
        if (app.config.css.macosScrollbar) {
            LoadTheme('macosScrollbar.css')
            app.config.advanced.removeScrollbars = false
        }
        if (app.config.css.glasstron) {
          switch(app.config.preferences.cssTheme.toLowerCase()) {
            case 'glasstron-blurple':
              app.win.webContents.executeJavaScript(`document.getElementsByTagName('body')[0].style = 'background-color: rgb(19 21 25 / 84%) !important;';`).then(() => console.log(`[JS] 'glasstron-blurple' successfully injected.`));
              break;

            default:
              app.win.webContents.executeJavaScript(`document.getElementsByTagName('body')[0].style = 'background-color: rgb(25 24 24 / 84%) !important;';`).then(() => console.log(`[JS] 'glasstron' successfully injected.`));
              break
          }
        }
        if (app.config.preferences.cssTheme) {
            LoadTheme(`${app.config.preferences.cssTheme.toLowerCase()}.css`)
        }
        if (app.config.advanced.removeScrollbars) await app.win.webContents.insertCSS('::-webkit-scrollbar { display: none; }');
        await app.win.webContents.executeJavaScript('MusicKitInterop.init()');
    });

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    //      Create the Tray Icon and Listen for Window Changes
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    InitTray()
    WindowHandler()

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    //      Initialize DiscordRPC and Handle Media/Playback Changes
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    InitDiscordRPC() // Initialize DiscordRPC

    // Define cache for ipcMain
    let cache;
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    //      Playback Change (Pause/Play)
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    let DiscordUpdate = false;
    let TooltipUpdate = false;
    let ThumbarUpdate = false;

    ipcMain.on('playbackStateDidChange', (_item, a) => {
        app.isPlaying = a.status;
        if (!a || a.playParams.id === 'no-id-found' || !cache) return;

        PlaybackStateHandler(a)

        if (a.playParams.id !== cache.playParams.id) { // If it is a new song
            a.startTime = Date.now()
            a.endTime = Number(Math.round(a.startTime + a.durationInMillis));
        } else { // If its continuing from the same song
            a.startTime = Date.now()
            a.endTime = Number(Math.round(Date.now() + a.remainingTime));
        }

        // Thumbar Buttons
        if (process.platform === "win32") {
          while (!ThumbarUpdate) {
            ThumbarUpdate = SetThumbarButtons(a.status)
          }
        }

        // TrayTooltipSongName
        if (app.config.preferences.trayTooltipSongName) {
          while (!TooltipUpdate) {
            TooltipUpdate = UpdateTooltip(a)
          }
        }

        // Discord Update
        if (app.discord.client && app.config.preferences.discordRPC) {
            while (!DiscordUpdate) {
                DiscordUpdate = UpdateDiscordActivity(a)
            }
        }

        // Revert it All because This Runs too many times
        setTimeout(() => {
            if (ThumbarUpdate) ThumbarUpdate = false;
            if (TooltipUpdate) TooltipUpdate = false;
            if (DiscordUpdate) DiscordUpdate = false;
        }, 500) // Give at least 0.5 seconds between ThumbarUpdates/TooltipUpdates/DiscordUpdates
    });

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    //      Song Change
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    let cacheNew = false;
    let MediaNotification = false;
  
    ipcMain.on('mediaItemStateDidChange', (_item, a) => {
        if (!cache) SetThumbarButtons();
        if (!a || a.playParams.id === 'no-id-found') return;

        UpdateMetaDataMpris(a)

        // Generate the First Cache
        if (!cache) {
          console.log('[mediaItemStateDidChange] Generating first Cache.')
          cache = a;
          cacheNew = true;
        }

        // Create Playback Notification on Song Change
        if ((a.playParams.id !== cache.playParams.id || cacheNew) && app.config.preferences.playbackNotifications && Notification.isSupported()) { // Checks if it is a new song
            console.log("we got here")
            if (app.config.preferences.notificationsMinimized && (!app.win.isMinimized() || app.win.isVisible())) return; // Checks if Notifications Minimized is On
            while (!MediaNotification) {
              MediaNotification = CreatePlaybackNotification(a)
            }
            setTimeout(function () {
                MediaNotification = false;
                if (cacheNew) cacheNew = false;
            }, 500);
        }

        // Update the Cache
        while (a.playParams.id !== cache.playParams.id) {
            console.log('[mediaItemStateDidChange] Cached Song is not the same as Attribute Song, updating cache.')
            cache = a
        }
    }); // Playback Notifications
}

//----------------------------------------------------------------------------------------------------
// Done
//----------------------------------------------------------------------------------------------------

// This method will be called when Electron has finished initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    if (dev) InitDevMode();
    Init()
    console.log("[Apple-Music-Electron] Application is Ready.")
    console.log(`[Apple-Music-Electron] Configuration File: `)
    console.log(app.config)
    console.log("[Apple-Music-Electron] Creating Window...")
    if (app.config.css.glasstron) { setTimeout(createWindow, process.platform === "linux" ? 1000 : 0); } else createWindow() // Electron has a bug on linux where it won't initialize properly when using transparency. To work around that, it is necessary to delay the window spawn function.
});

app.on('window-all-closed', () => {
    if (app.mpris) {
      mpris.metadata = {'mpris:trackid': '/org/mpris/MediaPlayer2/TrackList/NoTrack'}
      mpris.playbackStatus = 'Stopped';
    }
    app.quit()
});

app.on('before-quit', function () {
    if (app.mpris) {
      mpris.metadata = {'mpris:trackid': '/org/mpris/MediaPlayer2/TrackList/NoTrack'}
      mpris.playbackStatus = 'Stopped';
    }
    if (app.config.preferences.discordRPC) app.discord.client.disconnect()
    console.log("[DiscordRPC] Disconnecting from Discord.")
    console.log("---------------------------------------------------------------------")
    console.log("Application Closing...")
    console.log("---------------------------------------------------------------------")
    app.isQuiting = true;

});