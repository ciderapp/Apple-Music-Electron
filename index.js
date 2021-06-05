require('v8-compile-cache');
const { app, nativeTheme, ipcMain } = require('electron');
const { LoadJSFile, LoadTheme, GetLocale, SetThumbarButtons, Init, InitDevMode, InitDiscordRPC, InitTray, UpdateDiscordActivity, UpdateTooltip, CreatePlaybackNotification, CreateBrowserWindow, WindowHandler } = require('./resources/functions');
const gotTheLock = app.requestSingleInstanceLock();
app.discord = {
    client: false,
    error: false
}

app.config = require('./config.json');
if (app.config.preferences.discordRPC) {
    app.discord.client = require('discord-rich-presence')('749317071145533440');
    console.log("[DiscordRPC] Initializing Client.")
}
app.isQuiting = !app.config.preferences.closeButtonMinimize;
app.config.css.glasstron = app.config.preferences.cssTheme.toLowerCase().split('-').includes('glasstron');


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
        app.on('second-instance', (e, argv) => {
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
        if (app.config.css.glasstron) {
            LoadJSFile('glasstron.js')
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
    let cache,
        notify,
        firstSong;

    ipcMain.on('playbackStateDidChange', (item, a) => {
        app.isPlaying = a.status;
        SetThumbarButtons();
        if (!a || a.playParams.id === 'no-id-found' || !cache) return;

        if (a.playParams.id !== cache.playParams.id) { // If it is a new song
            a.startTime = Date.now()
            a.endTime = Number(Math.round(a.startTime + a.durationInMillis));
        } else { // If its continuing from the same song
            a.startTime = Date.now()
            a.endTime = Number(Math.round(Date.now() + a.remainingTime));
        }

        SetThumbarButtons(a.status)
        UpdateDiscordActivity(a)
        UpdateTooltip(a)
    }); // DiscordRPC and Tooltip Update
    ipcMain.on('mediaItemStateDidChange', (item, a) => {
        SetThumbarButtons();
        if (!a || a.playParams.id === 'no-id-found') return;

        while (!cache) {
            firstSong = true
            console.log('[mediaItemStateDidChange] Generating first Cache.')
            cache = a;
        }

        if (a.playParams.id !== cache.playParams.id || firstSong) { // Checks if it is a new song
            if (app.config.preferences.notificationsMinimized && (!app.win.isMinimized() && app.win.isVisible())) return;
            while (!notify) {
                notify = CreatePlaybackNotification(a)
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
    if (dev) InitDevMode();
    Init()
    console.log("[Apple-Music-Electron] Application is Ready.")
    console.log(`[Apple-Music-Electron] Configuration File: `)
    console.log(app.config)
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
