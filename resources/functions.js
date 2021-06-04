const {readFile} = require('fs');
const { app, BrowserWindow, nativeTheme, Notification, Tray, shell, ipcMain } = require('electron');
const {join} = require('path');

let Functions = {
    LoadTheme: function (win, cssPath) {
        readFile(join(__dirname, `./themes/${cssPath}`), "utf-8", function (error, data) {
            if (!error) {
                let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
                win.webContents.insertCSS(formattedData).then(() => console.log(`[Themes] '${cssPath}' successfully injected.`));
            }
        });

        let themeConfig = require('./themes/theme-config.json')
        for (let v in themeConfig.dark) {
            if (cssPath === v) {
                nativeTheme.themeSource = "dark"
            }
        }
        for (let v in themecfg.light) {
            if (cssPath === v) {
                nativeTheme.themeSource = "light"
            }
        }
    },
    LoadJSFile: function (win, jsPath) {
        readFile(join(__dirname, `./js/${jsPath}`), "utf-8", function (error, data) {
            if (!error) {
                let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
                win.webContents.executeJavaScript(formattedData).then(() => console.log(`[JS] '${jsPath}' successfully injected.`));
            }
        });
    },

    Init: function(config) {
        if (config.advanced.enableLogging) { // Logging Init
            const log = require("electron-log");
            console.log('---------------------------------------------------------------------')
            console.log('Apple-Music-Electron application has started.');
            console.log("---------------------------------------------------------------------")
            console.log = log.log;
        }

        const {autoUpdater} = require("electron-updater");  // AutoUpdater Init
        autoUpdater.logger = require("electron-log");
        if (config.advanced.autoUpdaterBetaBuilds) {
            autoUpdater.allowPrerelease = true
            autoUpdater.allowDowngrade = false
        }
        console.log("[AutoUpdater] Checking for updates...")
        autoUpdater.checkForUpdatesAndNotify().then(() => console.log("[AutoUpdater] Finished checking for updates."))

        Functions.SetTaskList() // Set the Task List

        app.setPath("userData", join(app.getPath("cache"), app.name)) // Set proper cache folder
        app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors'); // Disable CORS
    },
    InitDiscordRPC: function(rpcEnabled) {
        if (!rpcEnabled) return;
        let client = require('discord-rich-presence')('749317071145533440'),
            error = false;
        console.log("[DiscordRPC] Initializing Client.")

        // Connected to Discord
        client.on("connected", () => {
            console.log("[DiscordRPC] Successfully Connected to Discord!");
            if (error) error = false;
        });

        // Error Handler
        client.on('error', err => {
            console.log(`[DiscordRPC] Error: ${err}`);
            if (!error) error = true;
            console.log(`[DiscordRPC] Disconnecting from Discord.`)
        });

        return [error, client]
    },
    InitTray: function() {
        let trayIcon = new Tray((process.platform === "win32") ? join(__dirname, `./resources/icons/icon.ico`) : join(__dirname, `./resources/icons/icon.png`))
        trayIcon.setToolTip('Apple Music Electron');
        Functions.SetContextMenu(trayIcon, true);

        trayIcon.on('double-click', () => {
            win.show()
        })
        return trayIcon
    },
    InitDevMode: function(config) {
        let adv = config.advanced
        adv.allowMultipleInstances = true
        adv.allowSetMenu = true
        adv.enableLogging = true
        let perf = config.preferences
        perf.closeButtonMinimize = true
        perf.discordRPC = true
        perf.playbackNotifications = true
        perf.trayTooltipSongName = true
        let css = config.css
        css.macosWindow = true
        css.removeUpsell = true
        css.removeAppleLogo = true
    },

    UpdateDiscordActivity: function(client, a) {
        if (!client) return;
        if (a.status === true) {
            console.log(`[DiscordRPC] Updating Play Presence for ${a.name} to ${a.status}`)
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
        } else {
            console.log(`[DiscordRPC] Updating Pause Presence for ${a.name}`)
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
    },
    UpdateTooltip: function(a, trayIcon, enabled) {
        if (!enabled) return;
        if (a.status === true) {
            trayIcon.setToolTip(`Playing ${a.name} by ${a.artistName} on ${a.albumName}`);
        } else {
            trayIcon.setToolTip(`Paused ${a.name} by ${a.artistName} on ${a.albumName}`);
        }
    },

    GetLocale: function (forceApplicationLanguage) {
        const SystemLang = app.getLocaleCountryCode().toLowerCase()
        const languages = require('./languages.json')
        let localeAs = SystemLang;
        if (forceApplicationLanguage) {
            for (let key in languages) {
                key = key.toLowerCase()
                if (forceApplicationLanguage === key) {
                    console.log(`[Language] Found: ${key} | System Language: ${SystemLang}`)
                    localeAs = key;
                }
            }
        }
        return localeAs
    },
    GetTheme: function (defaultTheme) {
        if (defaultTheme) {
            return defaultTheme.toLowerCase()
        } else if (nativeTheme.shouldUseDarkColors === true) {
            return "dark"
        } else if (nativeTheme.shouldUseDarkColors === false) {
            return "light"
        } else {
            return "system"
        }
    },

    SetThumbarButtons: function (win, state, theme) {
        if (theme === "dark") {
            theme = "light"
        }
        let array;
        switch(state) {
            case false:
            case "paused":
                array = [
                    {
                        tooltip: 'Previous',
                        icon: join(__dirname, `./media/${theme}/previous.png`),
                        click() {
                            console.log('[setThumbarButtons] Previous song button clicked.')
                            win.webContents.executeJavaScript("MusicKit.getInstance().skipToPreviousItem()").then(() => console.log("[ThumbarPlaying] skipToPreviousItem"))
                        }
                    },
                    {
                        tooltip: 'Play',
                        icon: join(__dirname, `./media/${theme}/play.png`),
                        click() {
                            console.log('[setThumbarButtons] Play song button clicked.')
                            win.webContents.executeJavaScript("MusicKit.getInstance().play()").then(() => console.log("[ThumbarPlaying] play"))
                        }
                    },
                    {
                        tooltip: 'Next',
                        icon: join(__dirname, `./media/${theme}/next.png`),
                        click() {
                            console.log('[setThumbarButtons] Pause song button clicked.')
                            win.webContents.executeJavaScript("MusicKit.getInstance().skipToNextItem()").then(() => console.log("[ThumbarPlaying] skipToNextItem"))
                        }
                    }
                ];
                break;

            default:
            case "inactive":
                array = [
                    {
                        tooltip: 'Previous',
                        icon: join(__dirname, `./media/${theme}/previous-inactive.png`)
                    },
                    {
                        tooltip: 'Play',
                        icon: join(__dirname, `./media/${theme}/play-inactive.png`)
                    },
                    {
                        tooltip: 'Next',
                        icon: join(__dirname, `./media/${theme}/next-inactive.png`)
                    }
                ];
                break;

            case true:
            case "playing":
                array = [
                    {
                        tooltip: 'Previous',
                        icon: join(__dirname, `./media/${theme}/previous.png`),
                        click() {
                            console.log('[setThumbarButtons] Previous song button clicked.')
                            win.webContents.executeJavaScript("MusicKit.getInstance().skipToPreviousItem()").then(() => console.log("[ThumbarPaused] skipToPreviousItem"))
                        }
                    },
                    {
                        tooltip: 'Pause',
                        icon: join(__dirname, `./media/${theme}/pause.png`),
                        click() {
                            console.log('[setThumbarButtons] Play song button clicked.')
                            win.webContents.executeJavaScript("MusicKit.getInstance().pause()").then(() => console.log("[ThumbarPaused] pause"))
                        }
                    },
                    {
                        tooltip: 'Next',
                        icon: join(__dirname, `./media/${theme}/next.png`),
                        click() {
                            console.log('[setThumbarButtons] Pause song button clicked.')
                            win.webContents.executeJavaScript("MusicKit.getInstance().skipToNextItem()").then(() => console.log("[ThumbarPaused] skipToNextItem"))
                        }
                    }
                ]
                break;
        }
        if (process.platform === "win32") {
            win.setThumbarButtons(array)
        }
    },
    SetTaskList: function () {
        if (process.platform !== "win32") return;
        app.setUserTasks([
            {
                program: process.execPath,
                arguments: '--force-quit',
                iconPath: process.execPath,
                iconIndex: 0,
                title: 'Quit Apple Music'
            }
        ]);
    },
    SetContextMenu: function (trayIcon, visibility) {
        if (visibility) {
            trayIcon.setContextMenu(Menu.buildFromTemplate([
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
            ]));
        } else {
            trayIcon.setContextMenu(Menu.buildFromTemplate([
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
            ]));
        }

    },

    WindowHandler: function(win, trayIcon, defaultTheme, macos, isPlaying) {
        let isMinimized,
            isHidden,
            isMaximized;

        win.on('minimize', function () {
            isMinimized = true;
        })

        win.on('restore', function () {
            isMinimized = false;
        })

        win.on('show', function () {
            Functions.SetContextMenu(trayIcon, true)
            isHidden = false;
            Functions.SetThumbarButtons(win, isPlaying, Functions.GetTheme(defaultTheme))
        })

        win.on('hide', function () {
            Functions.SetContextMenu(trayIcon, false)
            isHidden = true;
        })

        win.webContents.on('unresponsive', function () {
            console.log("[Apple-Music-Electron] Application has become unresponsive and has been closed..")
            app.exit();
        });

        win.webContents.setWindowOpenHandler(({url}) => {
            if (url.startsWith('https://apple.com/') || url.startsWith('https://www.apple.com/') || url.startsWith('https://support.apple.com/')) { // for security (pretty pointless ik)
                shell.openExternal(url).then(() => console.log(`[Apple-Music-Electron] User has opened ${url} which has been redirected to browser.`));
                return {action: 'deny'}
            }
            console.log(`[Apple-Music-Electron] User has attempted to open ${url} which was blocked.`)
            return {action: 'deny'}
        })

        win.on('page-title-updated', function (event) { // Prevents the Window Title from being Updated
            event.preventDefault()
        });

        win.on('close', function (event) { // Hide the App if isQuitting is not true
            if (!isQuiting) {
                event.preventDefault();
                win.hide();
            } else {
                event.preventDefault();
                win.destroy();
            }
        });

        if (macos) {
            ipcMain.on('minimize', () => { // listen for minimize event
                win.minimize()
            })

            ipcMain.on('maximize', () => { // listen for maximize event and perform restore/maximize depending on window state
                if (isMaximized) {
                    win.restore()
                    isMaximized = false
                } else {
                    win.maximize()
                    isMaximized = true
                }
            })

            ipcMain.on('close', () => { // listen for close event
                win.close();
            })
        }

        return [isMinimized, isHidden, isMaximized]
    },

    CreatePlaybackNotification: function (a, enabled) {
        if (!enabled && Notification.isSupported()) return;
        if (process.platform === "win32") app.setAppUserModelId("Apple Music");
        console.log(`[CreatePlaybackNotification] Notification Generating | Function Parameters: SongName: ${a.name} | Artist: ${a.artistName} | Album: ${a.albumName}`)
        let NOTIFICATION_TITLE = a.name;
        let NOTIFICATION_BODY = `${a.artistName} - ${a.albumName}`;
        new Notification({
            title: NOTIFICATION_TITLE,
            body: NOTIFICATION_BODY,
            silent: true,
            icon: path.join(__dirname, './resources/icons/icon.png')
        }).show()
        return true
    },
    CreateBrowserWindow: function (frame, usingGlasstron, advanced) {
        let win,
            options = {
            icon: join(__dirname, `./resources/icons/icon.ico`),
            width: 1024,
            height: 600,
            minWidth: 300,
            minHeight: 300,
            frame: frame,
            title: "Apple Music",
            // Enables DRM
            webPreferences: {
                plugins: true,
                preload: join(__dirname, './js/MusicKitInterop.js'),
                allowRunningInsecureContent: advanced.allowRunningInsecureContent,
                contextIsolation: false,
                webSecurity: false,
                sandbox: true
            }
        };

        if (usingGlasstron) { // Glasstron Theme Window Creation
            let glasstron = require('glasstron');
            options.transparent = true;
            if (process.platform !== "win32") app.commandLine.appendSwitch("enable-transparent-visuals");
            win = new glasstron.BrowserWindow(options)
            win.blurType = "blurbehind";
            win.setBlur(true);
        } else {
            win = new BrowserWindow(options)
        }

        if (!advanced.menuBarVisible) win.setMenuBarVisibility(false); // Hide that nasty menu bar
        if (!advanced.allowSetMenu) win.setMenu(null); // Disables DevTools
        return win
    }
};

module.exports = Functions;