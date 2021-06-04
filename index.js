require('v8-compile-cache');
// Electron
const electron = require('electron');
const {app, BrowserWindow, Tray, Menu, Notification} = require('electron')
const {autoUpdater} = require("electron-updater");
// Configuration
const {preferences, css, advanced} = require('./config.json');
// Languages / Localisation
const languages = require('./assets/languages.json')
// Code Resources
const path = require('path')
const isSingleInstance = app.requestSingleInstanceLock(); // Instance
const {readFile} = require('fs');

// Other
const TaskList = [
    {
        program: process.execPath,
        arguments: '--force-quit',
        iconPath: process.execPath,
        iconIndex: 0,
        title: 'Quit Apple Music'
    }
]
let win = '',
    AppleMusicWebsite,
    AppleMusicListenNow,
    trayIcon = null,
    iconPath = path.join(__dirname, `./assets/icon.ico`),
    isQuiting = !preferences.closeButtonMinimize,
    isWin = process.platform === "win32",
    isMaximized,
    isHidden,
    isMinimized,
    isPlaying = false,
    glasstron,
    client;

if (preferences.discordRPC) {
    client = require('discord-rich-presence')('749317071145533440');
    console.log("[DiscordRPC] Initializing Client.")
}

// Set a user tasks list
if (isWin) app.setUserTasks(TaskList);

// Set proper cache folder
app.setPath("userData", path.join(app.getPath("cache"), app.name))

// Disable Cors because Cryptofyre gets angry
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

function LoadCSSFile(cssPath) {
    readFile(path.join(__dirname, cssPath), "utf-8", function (error, data) {
        if (!error) {
            let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
            win.webContents.insertCSS(formattedData).then(() => console.log(`[CSS] '${cssPath}' successfully injected.`));
        }
    });
}

function LoadJSFile(jsPath) {
    readFile(path.join(__dirname, jsPath), "utf-8", function (error, data) {
        if (!error) {
            let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
            win.webContents.executeJavaScript(formattedData).then(() => console.log(`[JS] '${jsPath}' successfully injected.`));
        }
    });
}

//---------------------------------------------------------------------
//  Start the Creation of the Window
//---------------------------------------------------------------------

function createWindow() {
    //---------------------------------------------------------------------
    // Thumbar Presets
    //---------------------------------------------------------------------
    let ThumbarInactive = [
            {
                tooltip: 'Previous',
                icon: path.join(__dirname, './assets/media/previous-inactive.png')
            },
            {
                tooltip: 'Play',
                icon: path.join(__dirname, './assets/media/play-inactive.png')
            },
            {
                tooltip: 'Next',
                icon: path.join(__dirname, './assets/media/next-inactive.png')
            }
        ],
        ThumbarMediaPlaying = [
            {
                tooltip: 'Previous',
                icon: path.join(__dirname, './assets/media/previous.png'),
                click() {
                    console.log('[setThumbarButtons] Previous song button clicked.')
                    win.webContents.executeJavaScript("MusicKit.getInstance().skipToPreviousItem()").then(() => console.log("[ThumbarPaused] skipToPreviousItem"))
                }
            },
            {
                tooltip: 'Pause',
                icon: path.join(__dirname, './assets/media/pause.png'),
                click() {
                    console.log('[setThumbarButtons] Play song button clicked.')
                    win.webContents.executeJavaScript("MusicKit.getInstance().pause()").then(() => console.log("[ThumbarPaused] pause"))
                }
            },
            {
                tooltip: 'Next',
                icon: path.join(__dirname, './assets/media/next.png'),
                click() {
                    console.log('[setThumbarButtons] Pause song button clicked.')
                    win.webContents.executeJavaScript("MusicKit.getInstance().skipToNextItem()").then(() => console.log("[ThumbarPaused] skipToNextItem"))
                }
            }
        ],
        ThumbarMediaPaused = [
            {
                tooltip: 'Previous',
                icon: path.join(__dirname, './assets/media/previous.png'),
                click() {
                    console.log('[setThumbarButtons] Previous song button clicked.')
                    win.webContents.executeJavaScript("MusicKit.getInstance().skipToPreviousItem()").then(() => console.log("[ThumbarPlaying] skipToPreviousItem"))
                }
            },
            {
                tooltip: 'Play',
                icon: path.join(__dirname, './assets/media/play.png'),
                click() {
                    console.log('[setThumbarButtons] Play song button clicked.')
                    win.webContents.executeJavaScript("MusicKit.getInstance().play()").then(() => console.log("[ThumbarPlaying] play"))
                }
            },
            {
                tooltip: 'Next',
                icon: path.join(__dirname, './assets/media/next.png'),
                click() {
                    console.log('[setThumbarButtons] Pause song button clicked.')
                    win.webContents.executeJavaScript("MusicKit.getInstance().skipToNextItem()").then(() => console.log("[ThumbarPlaying] skipToNextItem"))
                }
            }
        ];
    //---------------------------------------------------------------------
    // Enable Logging
    //---------------------------------------------------------------------
    if (advanced.enableLogging) {
        const log = require("electron-log");
        console.log('---------------------------------------------------------------------')
        console.log('Apple-Music-Electron application has started.');
        console.log("---------------------------------------------------------------------")
        console.log = log.log; // Overwrite the function because i cba to change all the console.logs
    }
    //---------------------------------------------------------------------
    // Prevent Multiple Instances
    //---------------------------------------------------------------------
    if (!isSingleInstance && !advanced.allowMultipleInstances) {
        console.log("[Apple-Music-Electron] Preventing second instance.")
        app.quit();
        return
    } else {
        app.on('second-instance', (event, argv) => {
            app.setUserTasks(TaskList)
            if (argv.indexOf("--force-quit") > -1) {
                app.quit()
            } else {
                if (win && !advanced.allowMultipleInstances) {
                    win.show()
                }
            }
        })
    }
    if (app.commandLine.hasSwitch('force-quit')) {
        app.quit()
        return;
    }
    //---------------------------------------------------------------------
    // Create the Window
    //---------------------------------------------------------------------
    if (preferences.cssTheme.toLowerCase().split('-').includes('glasstron')) { // Glasstron Theme Window Creation
        glasstron = require('glasstron');

        app.commandLine.appendSwitch("enable-transparent-visuals");
        win = new glasstron.BrowserWindow({
            icon: iconPath,
            width: 1024,
            height: 600,
            minWidth: 300,
            minHeight: 300,
            frame: !css.macosWindow,
            title: "Apple Music",
            // Enables DRM
            webPreferences: {
                plugins: true,
                preload: path.join(__dirname, './assets/MusicKitInterop.js'),
                allowRunningInsecureContent: advanced.allowRunningInsecureContent,
                contextIsolation: false,
                webSecurity: false,
                sandbox: true
            }
        })
        win.blurType = "blurbehind";
        win.setBlur(true);
    } else {
        win = new BrowserWindow({ // Standard Window Creation
            icon: iconPath,
            width: 1024,
            height: 600,
            minWidth: 300,
            minHeight: 300,
            frame: !css.macosWindow,
            title: "Apple Music",
            // Enables DRM
            webPreferences: {
                plugins: true,
                preload: path.join(__dirname, './assets/MusicKitInterop.js'),
                allowRunningInsecureContent: advanced.allowRunningInsecureContent,
                contextIsolation: false,
                webSecurity: false,
                sandbox: true
            }
        })
    }

    // Generate the ThumbarButtons that are inactive
    if (isWin) win.setThumbarButtons(ThumbarInactive);
    // Hide toolbar tooltips / bar
    win.setMenuBarVisibility(advanced.menuBarVisible);
    // Prevent users from being able to do shortcuts
    if (!advanced.allowSetMenu) win.setMenu(null);

    //----------------------------------------------------------------------------------------------------
    //  Check for updates and prompt user
    //----------------------------------------------------------------------------------------------------

    autoUpdater.logger = require("electron-log")
    if (advanced.autoUpdaterBetaBuilds) {
        autoUpdater.allowPrerelease = true
        autoUpdater.allowDowngrade = false
    }

    console.log("[AutoUpdater] Checking for updates...")
    autoUpdater.checkForUpdatesAndNotify().then(() => console.log("[AutoUpdater] Finished checking for updates."))

    //----------------------------------------------------------------------------------------------------
    //  Check if the Beta is Available and Load it
    //----------------------------------------------------------------------------------------------------
    if (advanced.useBeta) {
        if (advanced.siteDetection) {
            const isReachable = require("is-reachable");

            // Function to Load the Website if its reachable.
            async function LoadBeta() {
                const web = await isReachable('https://beta.music.apple.com')
                if (web) {
                    AppleMusicWebsite = 'https://beta.music.apple.com';
                } else {
                    AppleMusicWebsite = 'https://music.apple.com';
                }
            }

            LoadBeta().then(() => console.log(`[Apple-Music-Electron] LoadBeta has chosen ${AppleMusicWebsite}`))
        } else {    // Skips the check if sitedetection is turned off.
            AppleMusicWebsite = 'https://beta.music.apple.com';
        }
    } else {
        AppleMusicWebsite = 'https://music.apple.com';
    }

    //----------------------------------------------------------------------------------------------------
    //  Get the System Language and Change URL Appropriately
    //----------------------------------------------------------------------------------------------------
    const SystemLang = app.getLocaleCountryCode().toLowerCase()
    let localeAs = SystemLang;
    if (advanced.forceApplicationLanguage) {
        const targetLocaleAs = advanced.forceApplicationLanguage;
        for (let key in languages) {
            if (languages.hasOwnProperty(key)) {
                key = key.toLowerCase()
                if (targetLocaleAs === key) {
                    console.log(`[Language] Found: ${key} | System Language: ${SystemLang}`)
                    localeAs = key;
                }
            }
        }
    }

    AppleMusicWebsite = `${AppleMusicWebsite}/${localeAs}?l=${localeAs}`
    AppleMusicListenNow = `${AppleMusicWebsite}/${localeAs}/listen-now?l=${localeAs}`

    //----------------------------------------------------------------------------------------------------
    //  Load the Webpage
    //----------------------------------------------------------------------------------------------------

    console.log(`[Apple-Music-Electron] The chosen website is ${AppleMusicWebsite}`)
    win.loadURL(AppleMusicWebsite).then(() => console.log(`[Apple-Music-Electron] Website has been loaded!`))

    //----------------------------------------------------------------------------------------------------
    //  Prevents the Window Being Updated and Changes how close works to hide the window
    //----------------------------------------------------------------------------------------------------

    // Prevents the Window Title from being Updated
    win.on('page-title-updated', function (event) {
        event.preventDefault()
    });

    // Hide the App if isQuitting is not true
    win.on('close', function (event) {
        if (!isQuiting) {
            event.preventDefault();
            win.hide();
        } else {
            event.preventDefault();
            win.destroy();
        }
    });

    //----------------------------------------------------------------------------------------------------
    // Load all the JS and CSS for the webpage
    //----------------------------------------------------------------------------------------------------
    if (preferences.defaultTheme) electron.nativeTheme.themeSource = preferences.defaultTheme.toLowerCase();

    win.webContents.on('did-stop-loading', () => {
        if (css.removeAppleLogo) {
            LoadJSFile('./assets/js/removeAppleLogo.js')
        }
        if (css.removeUpsell) {
            LoadJSFile('./assets/js/removeUpsell.js')
        }
        if (css.macosWindow) {
            LoadJSFile('./assets/js/macosWindowFrame.js')
        }
        if (glasstron) {
            LoadJSFile('./assets/js/glasstron.js')
        }
        if (preferences.cssTheme) {
            console.log(`[Themes] Activating theme: ${preferences.cssTheme.toLowerCase()}`)
            LoadCSSFile(`./assets/themes/${preferences.cssTheme.toLowerCase()}.css`)
        }
    });

    // Executes the Interop and Scrollbar Remover
    win.webContents.on('did-stop-loading', async () => {
        if (advanced.removeScrollbars) await win.webContents.insertCSS('::-webkit-scrollbar { display: none; }');
        await win.webContents.executeJavaScript('MusicKitInterop.init()');
    });

    // Handles Unresponsive Window
    win.webContents.on('unresponsive', function () {
        console.log("[Apple-Music-Electron] Application has become unresponsive and has been closed..")
        app.exit();
    });

    // Prevent a new window from being created for hrefs, redirect to open in browser.
    win.webContents.setWindowOpenHandler(({url}) => {
        if (url.startsWith('https://apple.com/') || url.startsWith('https://www.apple.com/') || url.startsWith('https://support.apple.com/')) { // for security (pretty pointless ik)
            electron.shell.openExternal(url).then(() => console.log(`[Apple-Music-Electron] User has opened ${url} which has been redirected to browser.`));
            return {action: 'deny'}
        }
        console.log(`[Apple-Music-Electron] User has attempted to open ${url} which was blocked.`)
        return {action: 'deny'}
    })

    //----------------------------------------------------------------------------------------------------
    // Checks for Window Actions (when using MacOS theme)
    //----------------------------------------------------------------------------------------------------

    electron.ipcMain.on('minimize', () => { // listen for minimize event
        win.minimize()
    })

    electron.ipcMain.on('maximize', () => { // listen for maximize event and perform restore/maximize depending on window state
        if (isMaximized) {
            win.restore()
            isMaximized = false
        } else {
            win.maximize()
            isMaximized = true
        }
    })

    electron.ipcMain.on('close', () => { // listen for close event
        win.close();
    })

    //----------------------------------------------------------------------------------------------------
    //  Create the Tray Icon
    //----------------------------------------------------------------------------------------------------

    if (!isWin) {
        iconPath = path.join(__dirname, `./assets/icon.png`)
    }
    trayIcon = new Tray(iconPath)

    // Context Menu for when the App is Hidden
    const ClosedContextMenu = Menu.buildFromTemplate([
        {
            label: 'Show Apple Music', click: function () {
                win.show();
            }
        },
        {
            label: 'Check for Updates', click: function () {
                autoUpdater.checkForUpdatesAndNotify()
            }
        },
        {
            label: 'Quit', click: function () {
                app.isQuiting = true
                app.quit();
            }
        }
    ]);

    // Context Menu for when the App is not Hidden
    const OpenContextMenu = Menu.buildFromTemplate([
        {
            label: 'Minimize to Tray', click: function () {
                win.hide();
            }
        },
        {
            label: 'Check for Updates', click: function () {
                autoUpdater.checkForUpdatesAndNotify()
            }
        },
        {
            label: 'Quit', click: function () {
                app.isQuiting = true
                app.quit();
            }
        }
    ]);

    trayIcon.setToolTip('Apple Music Electron');
    trayIcon.setContextMenu(OpenContextMenu);

    trayIcon.on('double-click', () => {
        win.show()
    })

    win.on('hide', function () {
        trayIcon.setContextMenu(ClosedContextMenu);
        isHidden = true;
    })

    win.on('show', function () {
        trayIcon.setContextMenu(OpenContextMenu);
        isHidden = false;
        if (isPlaying) {
            if (isWin) win.setThumbarButtons(ThumbarMediaPlaying);
        } else {
            if (isWin) win.setThumbarButtons(ThumbarMediaPaused);
        }
    })

    win.on('minimize', function () {
        isMinimized = true;
    })

    win.on('restore', function () {
        isMinimized = false;
    })

    //----------------------------------------------------------------------------------------------------
    //  Discord Rich Presence / Tooltip Setup
    //----------------------------------------------------------------------------------------------------
    let DiscordRPCError = false;

    if (client) {
        // Connected to Discord
        client.on("connected", () => {
            console.log("[DiscordRPC] Successfully Connected to Discord!");
            if (DiscordRPCError) DiscordRPCError = false;
        });

        // Error Handler
        client.on('error', err => {
            console.log(`[DiscordRPC] Error: ${err}`);
            if (!DiscordRPCError) DiscordRPCError = true;
            console.log(`[DiscordRPC] Disconnecting from Discord.`)
        });
    }

    function UpdatePausedPresence(a) {
        console.log(`[DiscordRPC] Updating Pause Presence for ${a.name}`)
        if (preferences.trayTooltipSongName) {
            trayIcon.setToolTip(`Paused ${a.name} by ${a.artistName} on ${a.albumName}`);
        }
        client.updatePresence({
            details: `Playing ${a.name}`,
            state: `By ${a.artistName}`,
            largeImageKey: 'apple',
            largeImageText: a.albumName,
            smallImageKey: 'pause',
            smallImageText: 'Paused',
            instance: false,
        });
    }

    function UpdatePlayPresence(a) {
        console.log(`[DiscordRPC] Updating Play Presence for ${a.name}`)
        console.log(`[DiscordRPC] Current startTime: ${a.startTime}`)
        console.log(`[DiscordRPC] Current endTime: ${a.endTime}`)
        if (preferences.trayTooltipSongName) {
            trayIcon.setToolTip(`Playing ${a.name} by ${a.artistName} on ${a.albumName}`);
        }
        client.updatePresence({
            details: `Playing ${a.name}`,
            state: `By ${a.artistName}`,
            startTimestamp: a.startTime,
            endTimestamp: a.endTime,
            largeImageKey: 'apple',
            largeImageText: a.albumName,
            smallImageKey: 'play',
            smallImageText: 'Playing',
            instance: true,
        });
    }

    //----------------------------------------------------------------------------------------------------
    //  Song Notifications
    //----------------------------------------------------------------------------------------------------

    if (isWin) app.setAppUserModelId("Apple Music");

    function CreatePlaybackNotification(a) {
        console.log(`[CreatePlaybackNotification] Notification Generating | Function Parameters: SongName: ${a.name} | Artist: ${a.artistName} | Album: ${a.albumName}`)
        let NOTIFICATION_TITLE = a.name;
        let NOTIFICATION_BODY = `${a.artistName} - ${a.albumName}`;
        new Notification({
            title: NOTIFICATION_TITLE,
            body: NOTIFICATION_BODY,
            silent: true,
            icon: path.join(__dirname, './assets/icon.png')
        }).show()
        return true
    }

    //----------------------------------------------------------------------------------------------------
    //  Do stuff
    //----------------------------------------------------------------------------------------------------

    let cache,
        notify,
        firstSong;

    //----------------------------------------------------------------------------------------------------
    //  When the Song is Paused/Played (DiscordRPC)
    //----------------------------------------------------------------------------------------------------

    electron.ipcMain.on('playbackStateDidChange', (item, a) => {
        if (a === null || !a || a.playParams.id === 'no-id-found') {
            if (isWin) win.setThumbarButtons(ThumbarInactive);
            return
        }

        isPlaying = a.status;

        if (a.status) { // If the song is Playing
            // Update the Thumbar Buttons
            if (isWin) win.setThumbarButtons(ThumbarMediaPlaying);
        } else {
            // Update the Thumbar Buttons
            if (isWin) win.setThumbarButtons(ThumbarMediaPaused);
        }

        if (!cache || !preferences.discordRPC) return;

        if (a.playParams.id !== cache.playParams.id) { // If it is a new song
            a.startTime = Date.now()
            a.endTime = Number(Math.round(a.startTime + a.durationInMillis));
        } else { // If its continuing from the same song
            a.startTime = Date.now()
            a.endTime = Number(Math.round(Date.now() + a.remainingTime));
        }

        if (a.status) { // If the Song is Playing
            UpdatePlayPresence(a)
        } else { // If the Song is Paused
            UpdatePausedPresence(a)
        }
    });

    //----------------------------------------------------------------------------------------------------
    //  When a new Song is Playing
    //----------------------------------------------------------------------------------------------------

    electron.ipcMain.on('mediaItemStateDidChange', (item, a) => {
        if (a === null || !a || a.playParams.id === 'no-id-found') {
            win.setThumbarButtons(ThumbarInactive)
            return
        }

        while (!cache) {
            firstSong = true
            console.log('[mediaItemStateDidChange] Generating first Cache.')
            cache = a;
        }

        if (preferences.playbackNotifications && Notification.isSupported() && (a.playParams.id !== cache.playParams.id || firstSong)) { // Checks if it is a new song
            if (preferences.notificationsMinimized && (!isMinimized && !isHidden)) return;
            while (!notify) {
                console.log(`[Notification] A ID: ${a.playParams.id} | Cache ID: ${cache.playParams.id}`)
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
    });
}

//----------------------------------------------------------------------------------------------------
// Done
//----------------------------------------------------------------------------------------------------

// This method will be called when Electron has finished initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    console.log("[Apple-Music-Electron] Application is Ready.")
    console.log(`[Apple-Music-Electron] Configuration File: `)
    const configurationFile = require('./config.json');
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
    isQuiting = true;
});
