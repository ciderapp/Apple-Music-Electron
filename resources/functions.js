const {readFile} = require('fs');
const { app, BrowserWindow, nativeTheme, Notification, Tray, shell, ipcMain, Menu } = require('electron');
const {join} = require('path');
const {autoUpdater} = require("electron-updater");  // AutoUpdater Init

let Functions = {
    LoadTheme: function (cssPath) {
        readFile(join(__dirname, `./themes/${cssPath}`), "utf-8", function (error, data) {
            if (!error) {
                let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
                app.win.webContents.insertCSS(formattedData).then(() => console.log(`[Themes] '${cssPath}' successfully injected.`));
            }
        });

        let themeConfig = require('./themes/theme-config.json')
        for (let v in themeConfig.dark) {
            if (cssPath === v) {
                nativeTheme.themeSource = "dark"
            }
        }
        for (let v in themeConfig.light) {
            if (cssPath === v) {
                nativeTheme.themeSource = "light"
            }
        }
    },
    LoadJSFile: function (jsPath) {
        readFile(join(__dirname, `./js/${jsPath}`), "utf-8", function (error, data) {
            if (!error) {
                let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
                app.win.webContents.executeJavaScript(formattedData).then(() => console.log(`[JS] '${jsPath}' successfully injected.`));
            }
        });
    },

    Init: function() {
        if (app.config.advanced.enableLogging) { // Logging Init
            const log = require("electron-log");
            console.log('---------------------------------------------------------------------')
            console.log('Apple-Music-Electron application has started.');
            console.log("---------------------------------------------------------------------")
            console.log = log.log;
        }

        autoUpdater.logger = require("electron-log");
        if (app.config.advanced.autoUpdaterBetaBuilds) {
            autoUpdater.allowPrerelease = true
            autoUpdater.allowDowngrade = false
        }
        console.log("[AutoUpdater] Checking for updates...")
        autoUpdater.checkForUpdatesAndNotify().then(r => console.log(`[AutoUpdater] Latest Version is ${r.updateInfo.version}`))

        Functions.SetTaskList() // Set the Task List

        app.setPath("userData", join(app.getPath("cache"), app.name)) // Set proper cache folder
        app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors'); // Disable CORS

        //    Set the Default Theme
        let theme;
        if (app.config.preferences.defaultTheme) {
            theme = app.config.preferences.defaultTheme.toLowerCase()
        } else if (nativeTheme.shouldUseDarkColors === true) {
            theme = "dark"
        } else if (nativeTheme.shouldUseDarkColors === false) {
            theme = "light"
        } else {
            theme = "system"
        }
        app.config.systemTheme = theme
    },
    InitDiscordRPC: function() {
        if (!app.discord.client) return;

        // Connected to Discord
        app.discord.client.on("connected", () => {
            console.log("[DiscordRPC] Successfully Connected to Discord!");
            if (app.discord.error) app.discord.error = false;
        });

        // Error Handler
        app.discord.client.on('error', err => {
            console.log(`[DiscordRPC] Error: ${err}`);
            if (!app.discord.error) app.discord.error = true;
            console.log(`[DiscordRPC] Disconnecting from Discord.`)
        });
    },
    InitTray: function() {
        app.tray = new Tray((process.platform === "win32") ? join(__dirname, `./icons/icon.ico`) : join(__dirname, `./icons/icon.png`))
        app.tray.setToolTip('Apple Music Electron');
        Functions.SetContextMenu(true);

        app.tray.on('double-click', () => {
            app.win.show()
        })
    },
    InitDevMode: function() {
        let adv = app.config.advanced
        adv.allowMultipleInstances = false
        adv.allowSetMenu = true
        adv.enableLogging = true
        let perf = app.config.preferences
        perf.closeButtonMinimize = true
        perf.discordRPC = true
        perf.playbackNotifications = true
        perf.trayTooltipSongName = true
        let css = app.config.css
        css.macosWindow = true
        css.removeUpsell = true
        css.removeAppleLogo = true
    },

    UpdateDiscordActivity: function(a) {
        if (!app.discord.client || app.discord.error) return;
        if (a.status === true) {
            console.log(`[DiscordRPC] Updating Play Presence for ${a.name} to ${a.status}`)
            app.discord.client.updatePresence({
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
            app.discord.client.updatePresence({
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
    UpdateTooltip: function(a) {
        if (!app.config.preferences.trayTooltipSongName) return;
        if (a.status === true) {
            app.tray.setToolTip(`Playing ${a.name} by ${a.artistName} on ${a.albumName}`);
        } else {
            app.tray.setToolTip(`Paused ${a.name} by ${a.artistName} on ${a.albumName}`);
        }
    },

    GetLocale: function () {
        const SystemLang = app.getLocaleCountryCode().toLowerCase()
        const languages = require('./languages.json')
        let localeAs = SystemLang;
        if (app.config.advanced.forceApplicationLanguage) {
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
        return localeAs
    },

    SetThumbarButtons: function (state) {
        let theme = app.config.systemTheme
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
                            app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToPreviousItem()").then(() => console.log("[ThumbarPlaying] skipToPreviousItem"))
                        }
                    },
                    {
                        tooltip: 'Play',
                        icon: join(__dirname, `./media/${theme}/play.png`),
                        click() {
                            console.log('[setThumbarButtons] Play song button clicked.')
                            app.win.webContents.executeJavaScript("MusicKit.getInstance().play()").then(() => console.log("[ThumbarPlaying] play"))
                        }
                    },
                    {
                        tooltip: 'Next',
                        icon: join(__dirname, `./media/${theme}/next.png`),
                        click() {
                            console.log('[setThumbarButtons] Pause song button clicked.')
                            app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToNextItem()").then(() => console.log("[ThumbarPlaying] skipToNextItem"))
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
                            app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToPreviousItem()").then(() => console.log("[ThumbarPaused] skipToPreviousItem"))
                        }
                    },
                    {
                        tooltip: 'Pause',
                        icon: join(__dirname, `./media/${theme}/pause.png`),
                        click() {
                            console.log('[setThumbarButtons] Play song button clicked.')
                            app.win.webContents.executeJavaScript("MusicKit.getInstance().pause()").then(() => console.log("[ThumbarPaused] pause"))
                        }
                    },
                    {
                        tooltip: 'Next',
                        icon: join(__dirname, `./media/${theme}/next.png`),
                        click() {
                            console.log('[setThumbarButtons] Pause song button clicked.')
                            app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToNextItem()").then(() => console.log("[ThumbarPaused] skipToNextItem"))
                        }
                    }
                ]
                break;
        }
        if (process.platform === "win32") {
            app.win.setThumbarButtons(array)
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
    SetContextMenu: function (visibility) {
        if (visibility) {
            app.tray.setContextMenu(Menu.buildFromTemplate([
                {
                    label: 'Check for Updates',
                    click: function () {
                        autoUpdater.checkForUpdatesAndNotify().then(r => console.log(`[AutoUpdater] Latest Version is ${r.updateInfo.version}`));
                    }
                },
                {
                    label: 'Minimize to Tray',
                    click: function () {
                        app.win.hide();
                    }
                },
                {
                    label: 'Quit',
                    click: function () {
                        app.isQuiting = true
                        app.quit();
                    }
                }
            ]));
        } else {
            app.tray.setContextMenu(Menu.buildFromTemplate([
                {
                    label: 'Check for Updates',
                    click: function () {
                        autoUpdater.checkForUpdatesAndNotify().then(r => console.log(`[AutoUpdater] Latest Version is ${r.updateInfo.version}`));
                    }
                },
                {
                    label: 'Show Apple Music',
                    click: function () {
                        app.win.show();
                    }
                },
                {
                    label: 'Quit',
                    click: function () {
                        app.isQuiting = true
                        app.quit();
                    }
                }
            ]));
        }

    },

    WindowHandler: function() {
        app.win.webContents.on('unresponsive', function () {
            console.log("[Apple-Music-Electron] Application has become unresponsive and has been closed..")
            app.exit();
        });

        app.win.webContents.setWindowOpenHandler(({url}) => {
            if (url.startsWith('https://apple.com/') || url.startsWith('https://www.apple.com/') || url.startsWith('https://support.apple.com/')) { // for security (pretty pointless ik)
                shell.openExternal(url).then(() => console.log(`[Apple-Music-Electron] User has opened ${url} which has been redirected to browser.`));
                return {action: 'deny'}
            }
            console.log(`[Apple-Music-Electron] User has attempted to open ${url} which was blocked.`)
            return {action: 'deny'}
        })

        app.win.on('page-title-updated', function (event) { // Prevents the Window Title from being Updated
            event.preventDefault()
        });

        app.win.on('close', function (event) { // Hide the App if isQuitting is not true
            if (!app.isQuiting) {
                event.preventDefault();
                app.win.hide();
            } else {
                event.preventDefault();
                app.win.destroy();
            }
        });

        ipcMain.on('minimize', () => { // listen for minimize event
            app.win.minimize()
        })

        ipcMain.on('maximize', () => { // listen for maximize event and perform restore/maximize depending on window state
            if (app.win.isMaximized()) {
                app.win.restore()
            } else {
                app.win.maximize()
            }
        })

        ipcMain.on('close', () => { // listen for close event
            app.win.close();
        })

        app.win.on('show', function () {
            Functions.SetContextMenu(true)
            Functions.SetThumbarButtons(app.isPlaying)
        })

        app.win.on('hide', function () {
            Functions.SetContextMenu(false)
        })
    },

    CreatePlaybackNotification: function (a) {
        if (!app.config.preferences.playbackNotifications && Notification.isSupported()) return;
        if (process.platform === "win32") app.setAppUserModelId("Apple Music");
        console.log(`[CreatePlaybackNotification] Notification Generating | Function Parameters: SongName: ${a.name} | Artist: ${a.artistName} | Album: ${a.albumName}`)
        let NOTIFICATION_TITLE = a.name;
        let NOTIFICATION_BODY = `${a.artistName} - ${a.albumName}`;
        new Notification({
            title: NOTIFICATION_TITLE,
            body: NOTIFICATION_BODY,
            silent: true,
            icon: join(__dirname, './icons/icon.png')
        }).show()
        return true
    },
    CreateBrowserWindow: function () {
        let options = {
            icon: join(__dirname, `./icons/icon.ico`),
            width: 1024,
            height: 600,
            minWidth: 300,
            minHeight: 300,
            frame: !app.config.css.macosWindow,
            title: "Apple Music",
            // Enables DRM
            webPreferences: {
                plugins: true,
                preload: join(__dirname, './js/MusicKitInterop.js'),
                allowRunningInsecureContent: app.config.advanced.allowRunningInsecureContent,
                contextIsolation: false,
                webSecurity: false,
                sandbox: true
            }
        };

        if (app.config.css.glasstron) { // Glasstron Theme Window Creation
            let glasstron = require('glasstron');
            if (process.platform !== "win32") app.commandLine.appendSwitch("enable-transparent-visuals");
            app.win = new glasstron.BrowserWindow(options)
            app.win.blurType = "blurbehind";
            app.win.setBlur(true);
        } else {
            app.win = new BrowserWindow(options)
        }

        if (!app.config.advanced.menuBarVisible) app.win.setMenuBarVisibility(false); // Hide that nasty menu bar
        if (!app.config.advanced.allowSetMenu) app.win.setMenu(null); // Disables DevTools
    }
};

module.exports = Functions;