require('v8-compile-cache');
const {app, BrowserWindow, Tray, Menu, Notification} = require('electron')
const {preferences, css, advanced} = require('./config.json');
const config = require('./config.json');
const languages = require('./assets/languages.json')
const electron = require('electron');
const path = require('path')
const isSingleInstance = app.requestSingleInstanceLock();
const {autoUpdater} = require("electron-updater");
let win = '',
    AppleMusicWebsite,
    trayIcon = null,
    iconPath = path.join(__dirname, `./assets/icon.ico`),
    isQuiting = !preferences.closeButtonMinimize,
    isWin = process.platform === "win32",
    isMaximized,
    glasstron,
    client;

if (preferences.discordRPC) {
    client = require('discord-rich-presence')('749317071145533440');
    console.log("[DiscordRPC] Initializing Client.")
}

// Set proper cache folder
app.setPath("userData", path.join(app.getPath("cache"), app.name))

if (advanced.EnableLogging) {
    const log = require("electron-log");
    console.log('---------------------------------------------------------------------')
    console.log('Apple-Music-Electron application has started.');
    console.log("---------------------------------------------------------------------")
    console.log = log.log; // Overwrite the function because i cba to change all the console.logs
}

//---------------------------------------------------------------------
//  Start the Creation of the Window
//---------------------------------------------------------------------

function createWindow() {
    //---------------------------------------------------------------------
    // Prevent Multiple Instances
    //---------------------------------------------------------------------
    if (!isSingleInstance && !advanced.allowMultipleInstances) {
        console.log("[Apple-Music-Electron] Preventing second instance.")
        app.quit();
        return
    } else {
        app.on('second-instance', () => {
            if (win) {
                win.show()
            }
        })
    }
    //---------------------------------------------------------------------
    // Create the Window
    //---------------------------------------------------------------------
    if (preferences.cssTheme.toLowerCase() === "glasstron") { // Glasstron Theme Window Creation
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
                sandbox: true
            }
        })
    }

    // Hide toolbar tooltips / bar
    win.setMenuBarVisibility(advanced.MenuBarVisible);
    // Prevent users from being able to do shortcuts
    if (!advanced.allowSetMenu) win.setMenu(null);

    //----------------------------------------------------------------------------------------------------
    //  Check for updates and prompt user
    //----------------------------------------------------------------------------------------------------

    autoUpdater.logger = require("electron-log")
    if (advanced.bleedingedge) {
        autoUpdater.allowPrerelease = true
        autoUpdater.allowDowngrade = false
    }

    console.log("[AutoUpdater] Checking for updates...")
    autoUpdater.checkForUpdatesAndNotify()
    console.log("[AutoUpdater] Finished checking for updates.")

    //----------------------------------------------------------------------------------------------------
    //  Check if the Beta is Available and Load it
    //----------------------------------------------------------------------------------------------------
    if (advanced.UseBeta) {
        if (advanced.SiteDetection) {
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
            LoadBeta()
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
    for (let key in languages) {
        key = key.toLowerCase()
        if (SystemLang === key) {
            console.log(`[Language] Found: ${key} | System Language: ${SystemLang}`)
            if (advanced.forceApplicationLanguage) {
                key = advanced.forceApplicationLanguage
            } else {
                AppleMusicWebsite = `${AppleMusicWebsite}/${key}?l=${key}`
            }
        }
    }

    //----------------------------------------------------------------------------------------------------
    //  Load the Webpage
    //----------------------------------------------------------------------------------------------------

    console.log(`[Apple-Music-Electron] The chosen website is ${AppleMusicWebsite}`)
    win.loadURL(AppleMusicWebsite)

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
    if (preferences.defaultTheme) electron.nativeTheme.themeSource = preferences.defaultTheme;

    win.webContents.on('did-stop-loading', () => {
        if (css.removeappleLogo) {
            win.webContents.executeJavaScript("while (document.getElementsByClassName('web-navigation__header web-navigation__header--logo').length > 0) document.getElementsByClassName('web-navigation__header web-navigation__header--logo')[0].remove();");
            win.webContents.executeJavaScript("document.getElementsByClassName('search-box dt-search-box web-navigation__search-box')[0].style.gridArea = \"auto\";")
            console.log("[CSS] Removed Apple Logo successfully.")
        }
        if (css.removeupsell) {
            win.webContents.executeJavaScript("while (document.getElementsByClassName('web-navigation__native-upsell').length > 0) document.getElementsByClassName('web-navigation__native-upsell')[0].remove();");
            console.log("[CSS] Removed upsell.")
        }
        if (css.macosWindow) {
            win.webContents.executeJavaScript("if(document.getElementsByClassName('web-navigation')[0] && !(document.getElementsByClassName('web-navigation')[0].style.height == 'calc(100vh - 32px)')){ let dragDiv = document.createElement('div'); dragDiv.style.width = '100%'; dragDiv.style.height = '32px'; dragDiv.style.position = 'absolute'; dragDiv.style.top = dragDiv.style.left = 0; dragDiv.style.webkitAppRegion = 'drag'; document.body.appendChild(dragDiv); var closeButton = document.createElement('span'); document.getElementsByClassName('web-navigation')[0].style.height = 'calc(100vh - 32px)'; document.getElementsByClassName('web-navigation')[0].style.bottom = 0; document.getElementsByClassName('web-navigation')[0].style.position = 'absolute'; document.getElementsByClassName('web-chrome')[0].style.top = '32px'; var minimizeButton = document.createElement('span'); var maximizeButton = document.createElement('span'); document.getElementsByClassName('web-navigation')[0].style.height = 'calc(100vh - 32px)'; closeButton.style = 'height: 11px; width: 11px; background-color: rgb(255, 92, 92); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 4px 10px 10px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5); -webkit-app-region: no-drag; '; minimizeButton.style = 'height: 11px; width: 11px; background-color: rgb(255, 189, 76); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 4px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5); -webkit-app-region: no-drag;'; maximizeButton.style = 'height: 11px; width: 11px; background-color: rgb(0, 202, 86); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 10px 10px 4px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5); -webkit-app-region: no-drag;'; closeButton.onclick= ()=>{ipcRenderer.send('close')}; minimizeButton.onclick = ()=>{ipcRenderer.send('minimize')}; maximizeButton.onclick = ()=>{ipcRenderer.send('maximize')}; dragDiv.appendChild(closeButton); dragDiv.appendChild(minimizeButton); dragDiv.appendChild(maximizeButton); closeButton.onmouseenter = ()=>{closeButton.style.filter = 'brightness(50%)'}; minimizeButton.onmouseenter = ()=>{minimizeButton.style.filter = 'brightness(50%)'}; maximizeButton.onmouseenter = ()=>{maximizeButton.style.filter = 'brightness(50%)'}; closeButton.onmouseleave = ()=>{closeButton.style.filter = 'brightness(100%)'}; minimizeButton.onmouseleave = ()=>{minimizeButton.style.filter = 'brightness(100%)'}; maximizeButton.onmouseleave = ()=>{maximizeButton.style.filter = 'brightness(100%)'};}");
            console.log("[CSS] Enabled custom MacOS Window Frame")
        }
    });

    win.webContents.on('did-stop-loading', async () => {
        if (advanced.RemoveScrollbars) await win.webContents.insertCSS('::-webkit-scrollbar { display: none; }');
        await win.webContents.executeJavaScript('MusicKitInterop.init()');
    });


    win.webContents.on('did-finish-load', function () {
        if (preferences.cssTheme) {
            const {readFile} = require('fs');
            readFile(path.join(__dirname, `./assets/themes/${preferences.cssTheme.toLowerCase()}.css`), "utf-8", function (error, data) {
                if (!error) {
                    let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
                    win.webContents.insertCSS(formattedData);
                }
            });
        }
    });

    win.webContents.on('crash', function () {
        console.log("[Apple-Music-Electron] Application has crashed.")
        app.exit();
    });

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
    })

    win.on('show', function () {
        trayIcon.setContextMenu(OpenContextMenu);
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
        if (preferences.tooltipsongname) {
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
        if (preferences.tooltipsongname) {
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

    if (isWin) app.setAppUserModelId("Apple Music Electron");

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
        if (a === null || a.playParams.id === 'no-id-found' || !cache || !preferences.discordRPC) return;

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
        if (a === null || a.playParams.id === 'no-id-found') return;

        while (!cache) {
            firstSong = true
            console.log('[mediaItemStateDidChange] Generating first Cache.')
            cache = a;
        }

        if (preferences.notifications && Notification.isSupported() && (a.playParams.id !== cache.playParams.id || firstSong)) { // Checks if it is a new song
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

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    console.log("[Apple-Music-Electron] Application is Ready.")
    console.log(`[Apple-Music-Electron] Configuration File: `)
    console.log(config)
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
