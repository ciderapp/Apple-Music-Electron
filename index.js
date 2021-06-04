require('v8-compile-cache');
const electron = require('electron'), {app} = require('electron'), {
    preferences,
    css,
    advanced
} = require('./config.json'), gotTheLock = app.requestSingleInstanceLock(), {
    LoadJSFile,
    LoadTheme,
    GetLocale,
    GetTheme,
    SetThumbarButtons,
    SetContextMenu,
    Init,
    InitDevMode,
    InitDiscordRPC,
    InitTray,
    UpdateDiscordActivity,
    UpdateTooltip,
    CreatePlaybackNotification,
    CreateBrowserWindow,
    WindowHandler
} = require('./resources/functions');
let client;
if (preferences.discordRPC) {
    client = require('discord-rich-presence')('749317071145533440');
    console.log("[DiscordRPC] Initializing Client.")
} else {
    client = false;
}
app.isQuiting = !preferences.closeButtonMinimize;

//########################## NO TOUCHY TY ####################################
let dev = false
//############################################################################

function createWindow() {
    let isPlaying = false,
        glasstron = preferences.cssTheme.toLowerCase().split('-').includes('glasstron');
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    //      Prevent Multiple Instances
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    if (!gotTheLock && !advanced.allowMultipleInstances) {
        console.log("[Apple-Music-Electron] Existing Instance is Blocking Second Instance.")
        app.quit();
        return
    } else {
        app.on('second-instance', (e, argv) => {
            if (argv.indexOf("--force-quit") > -1) {
                app.quit()
            } else if (win && !advanced.allowMultipleInstances) {
                win.show()
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
    let win = CreateBrowserWindow(!css.macosWindow, glasstron, advanced) // Create the Window
    SetThumbarButtons(win, "inactive", GetTheme(preferences.defaultTheme)) // Set the Inactive Thumbar

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    //      Load the Webpage
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    let locale = GetLocale(advanced.forceApplicationLanguage)
    let url = (advanced.useBeta) ? `https://beta.music.apple.com/${locale}?l=${locale}` : `https://music.apple.com/${locale}?l=${locale}`;
    let fallback = `https://music.apple.com/${locale}?l=${locale}`

    console.log(`[Apple-Music-Electron] The chosen website is ${url}`)
    win.loadURL(url).catch(() => {
        win.loadURL(fallback).then(() => console.log(`[Apple-Music-Electron] ${url} was unavailable, falling back to ${fallback}`))
    })

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    //      Load all the JS and CSS for the webpage
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    electron.nativeTheme.themeSource = GetTheme(preferences.defaultTheme);
    win.webContents.on('did-stop-loading', async () => {
        if (css.removeAppleLogo) {
            LoadJSFile(win, 'removeAppleLogo.js')
        }
        if (css.removeUpsell) {
            LoadJSFile(win, 'removeUpsell.js')
        }
        if (css.macosWindow) {
            LoadJSFile(win, 'macosWindowFrame.js')
        }
        if (glasstron) {
            LoadJSFile(win, 'glasstron.js')
        }
        if (preferences.cssTheme) {
            LoadTheme(win, `${preferences.cssTheme.toLowerCase()}.css`)
        }
        if (advanced.removeScrollbars) await win.webContents.insertCSS('::-webkit-scrollbar { display: none; }');
        await win.webContents.executeJavaScript('MusicKitInterop.init()');
    });

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    //      Create the Tray Icon and Listen for Window Changes
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    let trayIcon = InitTray(win)
    let winHandle = WindowHandler(win, trayIcon, preferences.defaultTheme, css.macosWindow)

    win.on('show', function () {
        SetContextMenu(trayIcon, true, win)
        winHandle.isHidden = false;
        SetThumbarButtons(win, isPlaying, GetTheme(preferences.defaultTheme))
    })

    win.on('hide', function () {
        SetContextMenu(trayIcon, false, win)
        winHandle.isHidden = true;
    })

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    //      Initialize DiscordRPC and Handle Media/Playback Changes
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~//
    InitDiscordRPC(client) // Initialize DiscordRPC
    let cache,
        notify,
        firstSong;

    electron.ipcMain.on('playbackStateDidChange', (item, a) => {
        isPlaying = a.status;
        SetThumbarButtons(win, "inactive", GetTheme(preferences.defaultTheme));
        if (!a || a.playParams.id === 'no-id-found' || !cache) return;

        if (a.playParams.id !== cache.playParams.id) { // If it is a new song
            a.startTime = Date.now()
            a.endTime = Number(Math.round(a.startTime + a.durationInMillis));
        } else { // If its continuing from the same song
            a.startTime = Date.now()
            a.endTime = Number(Math.round(Date.now() + a.remainingTime));
        }

        SetThumbarButtons(win, a.status, GetTheme(preferences.defaultTheme))
        UpdateDiscordActivity(client, a)
        UpdateTooltip(a, trayIcon, preferences.trayTooltipSongName)
    }); // DiscordRPC and Tooltip Update
    electron.ipcMain.on('mediaItemStateDidChange', (item, a) => {
        SetThumbarButtons(win, "inactive", GetTheme(preferences.defaultTheme));
        if (!a || a.playParams.id === 'no-id-found') return;

        while (!cache) {
            firstSong = true
            console.log('[mediaItemStateDidChange] Generating first Cache.')
            cache = a;
        }

        if (a.playParams.id !== cache.playParams.id || firstSong) { // Checks if it is a new song
            if (preferences.notificationsMinimized && (!winHandle.isMinimized && !winHandle.isHidden)) return;
            while (!notify) {
                notify = CreatePlaybackNotification(a, preferences.playbackNotifications)
            }
            setTimeout(function () {
                notify = false;
                firstSong = false;
            }, 500);
        }

        // Update the Cache
        while (a.playParams.id !== cache.playParams.id) {
            console.log('[mediaItemStateDidChange] Cache is not the same as attributes, updating cache.')
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
    let configurationFile = require('./config.json');
    if (dev) InitDevMode(configurationFile);
    Init(configurationFile)
    console.log("[Apple-Music-Electron] Application is Ready.")
    console.log(`[Apple-Music-Electron] Configuration File: `)
    console.log(configurationFile)
    createWindow()
});

app.on('window-all-closed', () => {
    app.quit()
});

app.on('before-quit', function () {
    console.log("---------------------------------------------------------------------")
    console.log("Application Closing...")
    console.log("---------------------------------------------------------------------")
    app.isQuiting = true;
});
