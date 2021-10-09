const { app, Menu, ipcMain, shell, dialog, Notification, BrowserWindow } = require('electron')
const SentryInit = require("./init").SentryInit;
SentryInit()
const { LoadOneTimeFiles, LoadFiles } = require('./load');
const { join, resolve } = require('path');
const { existsSync, truncate } = require('fs');
const rimraf = require('rimraf');
app.currentPlaybackActivity = false

const handler = {
    LaunchHandler: function() {

        // Version Fetch
        if (app.commandLine.hasSwitch('version') || app.commandLine.hasSwitch('v')) {
            console.log(app.getVersion())
            app.exit()
        }

        // Verbose Check
        if (app.commandLine.hasSwitch('verbose')) {
            console.log("[Apple-Music-Electron] User has launched the application with --verbose");
            app.verboseLaunched = true
        }

        // Log File Location
        if (app.commandLine.hasSwitch('log') || app.commandLine.hasSwitch('l')) {
            console.log(join(app.getPath('userData'), 'logs'))
            app.exit()
        }

        // Detects if the application has been opened with --force-quit
        if (app.commandLine.hasSwitch('force-quit')) {
            console.log("[Apple-Music-Electron] User has closed the application via --force-quit");
            app.quit()
        }

        // Check for Protocols
        process.argv.forEach((value) => {
            if (value.includes('ame://') || value.includes('itms://') || value.includes('itmss://') || value.includes('musics://') || value.includes('music://')) {
                if (app.preferences.value('advanced.verboseLogging').includes(true) || app.verboseLaunched) console.log('[InstanceHandler] Preventing application creation as args include protocol.');
                app.quit()
                return true
            }
        })

        // For macOS
        app.on('open-url', function(event, url) {
            event.preventDefault()
            if (url.includes('ame://') || url.includes('itms://') || url.includes('itmss://') || url.includes('musics://') || url.includes('music://')) {
                handler.LinkHandler(url)
            }
        })

    },

    LaunchHandlerPostWin: function() {
        // Detect if the application has been opened with --minimized
        if (app.commandLine.hasSwitch('minimized') || process.argv.includes('--minimized')) {
            console.log("[Apple-Music-Electron] Application opened with '--minimized'");
            if (typeof app.win.minimize === 'function') {
                app.win.minimize();
            }
        }

        // Detect if the application has been opened with --hidden
        if (app.commandLine.hasSwitch('hidden') || process.argv.includes('--hidden')) {
            console.log("[Apple-Music-Electron] Application opened with '--hidden'");
            if (typeof app.win.hide === 'function') {
                app.win.hide()
            }
        }
    },

    VersionHandler: function() {
        if (!app.preferences.value('storedVersion') || app.preferences.value('storedVersion') === undefined || app.preferences.value('storedVersion') !== app.getVersion()) {

            if (app.preferences.value('storedVersion')) {
                console.log(`[VersionHandler] Application updated from stored value ${app.preferences.value('storedVersion')} to ${app.getVersion()}`)
            }

            if (existsSync(resolve(app.getPath('userData'), 'Cache'))) {
                rimraf(resolve(app.getPath('userData'), 'Cache'), [], () => {
                    console.log(`[VersionHandler] Outdated / No Version Store Found. Clearing Application Cache. ('${resolve(app.getPath('userData'), 'Cache')}')`)
                })
            }

            if (existsSync(resolve(app.getPath('userData'), 'preferences.json'))) {
                truncate(resolve(app.getPath('userData'), 'preferences.json'), 0, function() {
                    console.log(`[VersionHandler] Outdated / No Version Store Found. Clearing Preferences File. ('${resolve(app.getPath('userData'), 'preferences.json')}')`)
                });
            }
        }
    },

    InstanceHandler: function() {
        console.verbose('[InstanceHandler] Started.')
        const gotTheLock = app.requestSingleInstanceLock();
        let returnVal = false

        if (!gotTheLock && !app.preferences.value('advanced.allowMultipleInstances').includes(true)) {
            console.warn("[InstanceHandler] Existing Instance is Blocking Second Instance.");
            app.quit();
            return true
        } else {
            app.on('second-instance', (_e, argv) => {
                console.log(`[InstanceHandler] Second Instance Started with args: [${argv.join(', ')}]`)

                if (argv.includes("--force-quit")) {
                    console.warn('[InstanceHandler] Force Quit found. Quitting App.');
                    app.quit()
                    returnVal = true
                } else if (app.win && !app.preferences.value('advanced.allowMultipleInstances').includes(true)) { // If a Second Instance has Been Started
                    console.warn('[InstanceHandler] Showing window.');
                    app.win.show()
                    app.win.focus()
                }

                // Checks if first instance is authorized and if second instance has protocol args
                if (app.win && app.isAuthorized) {
                    argv.forEach((value) => {
                        if (value.includes('ame://') || value.includes('itms://') || value.includes('itmss://') || value.includes('musics://') || value.includes('music://')) {
                            handler.LinkHandler(value)
                            if (app.preferences.value('advanced.allowMultipleInstances').includes(true)) returnVal = true;
                        }
                    })
                }
            })
        }
        return returnVal
    },

    PlaybackStateHandler: function() {
        console.verbose('[playbackStateDidChange] Started.');

        ipcMain.on('playbackStateDidChange', (_event, a) => {
            console.warn('[handler] playbackStateDidChange received.');
            app.currentPlaybackActivity = a;

            app.funcs.SetButtons()
            app.funcs.SetTrayTooltip(a)
            app.funcs.discord.updateActivity(a)
            app.funcs.lastfm.scrobbleSong(a)
            app.funcs.mpris.updateState(a)
        });
    },

    MediaStateHandler: function() {
        console.verbose('[nowPlayingItemDidChange] Started.');

        ipcMain.on('nowPlayingItemDidChange', (_event, a) => {
            console.warn('[handler] mediaItemStateDidChange received.');
            app.currentPlaybackActivity = a;

            app.funcs.CreateNotification(a)
            app.funcs.mpris.updateActivity(a);
        });
    },

    WindowStateHandler: function() {
        console.verbose('[WindowStateHandler] Started.');
        app.previousPage = app.win.webContents.getURL()

        app.win.webContents.setWindowOpenHandler(({
            url
        }) => {
            shell.openExternal(url).then(() => console.log(`[WindowStateHandler] User has opened ${url} which has been redirected to browser.`));
            return {
                action: 'deny'
            }
        })

        app.win.webContents.on('unresponsive', async() => {
            const {
                response
            } = await dialog.showMessageBox({
                message: 'Apple Music has become unresponsive',
                title: 'Do you want to try forcefully reloading the app?',
                buttons: ['Yes', 'Quit', 'No'],
                cancelId: 1
            })
            if (response === 0) {
                app.win.contents.forcefullyCrashRenderer()
                app.win.contents.reload()
            } else if (response === 1) {
                console.log("[WindowStateHandler] Application has become unresponsive and has been closed.")
                app.exit();
            }
        })

        app.win.webContents.on('did-finish-load', async() => {
            console.verbose('[WindowStateHandler] Page finished loading.')
            LoadOneTimeFiles()

            if (app.preferences.value('general.incognitoMode').includes(true)) {
                new Notification({
                    title: 'Incognito Mode',
                    body: `Incognito Mode enabled. DiscordRPC and LastFM are disabled.`
                }).show()
                console.verbose('[Incognito] Incognito Mode enabled for Apple Music Website. [DiscordRPC and LastFM are disabled].');
            }
        });

        app.win.webContents.on('did-start-loading', async() => {
            app.previousPage = app.win.webContents.getURL()
        });

        app.win.webContents.on('page-title-updated', function(event) { // Prevents the Window Title from being Updated
            LoadFiles()
            event.preventDefault()
        });

        // Windows specific: Handles window states
        // Needed because Aero Snap events do not send the same way as clicking the frame buttons.
        if (process.platform === "win32" && app.preferences.value('visual.frameType') !== 'mac' || app.preferences.value('visual.frameType') !== 'mac-right') {
            var WND_STATE = {
                MINIMIZED: 0,
                NORMAL: 1,
                MAXIMIZED: 2,
                FULL_SCREEN: 3
            }
            var wndState = WND_STATE.NORMAL

            app.win.on("resize", (_event) => {
                const isMaximized = app.win.isMaximized()
                const isMinimized = app.win.isMinimized()
                const isFullScreen = app.win.isFullScreen()
                const state = wndState;
                if (isMinimized && state !== WND_STATE.MINIMIZED) {
                    wndState = WND_STATE.MINIMIZED
                        // 
                } else if (isFullScreen && state !== WND_STATE.FULL_SCREEN) {
                    wndState = WND_STATE.FULL_SCREEN
                        // 
                } else if (isMaximized && state !== WND_STATE.MAXIMIZED) {
                    wndState = WND_STATE.MAXIMIZED
                    app.win.webContents.executeJavaScript(`document.querySelector("#maximize").classList.add("maxed")`)
                } else if (state !== WND_STATE.NORMAL) {
                    wndState = WND_STATE.NORMAL
                    app.win.webContents.executeJavaScript(`document.querySelector("#maximize").classList.remove("maxed")`)
                }
            })
        }

        ipcMain.on('minimize', () => { // listen for minimize event
            if (typeof app.win.minimize === 'function') {
                app.win.minimize()
            }
        })

        ipcMain.on('back', () => { // listen for back event
            if (app.win.webContents.canGoBack()) {
                app.win.webContents.goBack()
            }
        })

        ipcMain.on('maximize', () => { // listen for maximize event and perform restore/maximize depending on window state
            if (app.win.miniplayerActive) {
                return
            } // Here we would setup a function to open the fullscreen player with lyrics

            if (app.win.isMaximized()) {
                app.win.restore()
                if (process.platform !== "win32") {
                    app.win.webContents.executeJavaScript(`document.querySelector("#maximize").classList.remove("maxed")`)
                }
            } else {
                app.win.maximize()
                if (process.platform !== "win32") {
                    app.win.webContents.executeJavaScript(`document.querySelector("#maximize").classList.add("maxed")`)
                }
            }
        })

        ipcMain.on('close', () => { // listen for close event
            if (app.win.miniplayerActive) {
                ipcMain.emit("set-miniplayer", false);
                return;
            }
            app.win.close();
        })

        ipcMain.on("resize-window", (event, width, height) => {
            app.win.setSize(width, height)
        })

        const minSize = app.win.getMinimumSize()
        ipcMain.on("set-miniplayer", (event, val) => {
            if (val) {
                app.win.miniplayerActive = true
                app.win.setSize(300, 300)
                app.win.setMinimumSize(300, 55)
                app.win.setMaximumSize(300, 300)
                app.win.setMaximizable(false)
                app.win.webContents.executeJavaScript("_miniPlayer.setMiniPlayer(true)")
            } else {
                app.win.miniplayerActive = false
                app.win.setMaximumSize(9999, 9999)
                app.win.setMinimumSize(minSize[0], minSize[1])
                app.win.setSize(1024, 600)
                app.win.setMaximizable(true)
                app.win.webContents.executeJavaScript("_miniPlayer.setMiniPlayer(false)")
            }
        })

        ipcMain.on("show-miniplayer-menu", () => {
            const menuOptions = [{
                type: "checkbox",
                label: "Always On Top",
                click: () => {
                    if (app.win.isAlwaysOnTop()) {
                        app.win.setAlwaysOnTop(false, 'screen')
                    } else {
                        app.win.setAlwaysOnTop(true, 'screen')
                    }
                },
                checked: app.win.isAlwaysOnTop()
            }, {
                label: "Exit Mini Player",
                click: () => {
                    ipcMain.emit("set-miniplayer", false)
                }
            }]
            const menu = Menu.buildFromTemplate(menuOptions)
            menu.popup(app.win)
        })

        ipcMain.on("alwaysOnTop", (event, val) => {
            if (val) {
                app.win.setAlwaysOnTop(true, 'screen')
            } else {
                app.win.setAlwaysOnTop(false, 'screen')
            }
        })

        ipcMain.on("load-plugin", (event, plugin) => {

        })

        app.win.on('close', (event) => {
            if (app.win.miniplayerActive) {
                ipcMain.emit("set-miniplayer", false);
                event.preventDefault();
            }

            if ((app.preferences.value('window.closeButtonMinimize').includes(true) || process.platform === "darwin") && !app.isQuiting) { // Hide the App if isQuitting is not true
                event.preventDefault()
                if (typeof app.win.hide === "function") {
                    app.win.hide();
                }
            } else {
                app.quit()
            }

        });

        app.win.on('show', () => {
            app.funcs.SetContextMenu(true)
            app.funcs.SetButtons()
            if (app.win.isVisible()) {
                app.win.focus()
            }
            // if (app.win.StoredWebsite) app.win.loadURL(app.win.StoredWebsite)
        });

        app.win.on('hide', () => {
            app.funcs.SetContextMenu(false)
                // app.win.StoredWebsite = app.win.webContents.getURL();
        });
    },

    SettingsHandler: function() {
        console.verbose('[SettingsHandler] Started.');
        let DialogMessage, cachedPreferences = app.preferences._preferences;

        const { fetchTransparencyOptions } = require('./CreateBrowserWindow')

        app.preferences.on('save', (updatedPreferences) => {

            if (cachedPreferences.visual.theme !== updatedPreferences.visual.theme) { // Handles Theme Changes
                app.win.webContents.executeJavaScript(`AMThemes.loadTheme("${(updatedPreferences.visual.theme === 'default' || !updatedPreferences.visual.theme) ? '' : updatedPreferences.visual.theme}");`).catch((e) => console.error(e));
                const updatedVibrancy = fetchTransparencyOptions();
                if (app.transparency && updatedVibrancy && process.platform !== 'darwin') app.win.setVibrancy(updatedVibrancy);
            } else if ((cachedPreferences.visual.transparencyEffect !== updatedPreferences.visual.transparencyEffect) || (cachedPreferences.visual.transparencyTheme !== updatedPreferences.visual.transparencyTheme) || (cachedPreferences.visual.transparencyMaximumRefreshRate !== updatedPreferences.visual.transparencyMaximumRefreshRate)) { // Handles Transparency Changes
                const updatedVibrancy = fetchTransparencyOptions()
                if (app.transparency && updatedVibrancy && process.platform !== 'darwin') {
                    app.win.setVibrancy(updatedVibrancy);
                    app.win.webContents.executeJavaScript(`AMThemes.setTransparency(true);`).catch((e) => console.error(e));
                } else {
                    app.win.setVibrancy();
                    app.win.webContents.executeJavaScript(`AMThemes.setTransparency(false);`).catch((e) => console.error(e));
                }
            } else if (cachedPreferences.visual.frameType !== updatedPreferences.visual.frameType) {
                //    run js function to unload / load new frame
            } else if (cachedPreferences.general.discordRPC !== updatedPreferences.general.discordRPC) {
                console.log(updatedPreferences.general.discordRPC)
                if (updatedPreferences.general.discordRPC) {
                    app.funcs.discord.disconnect()
                }
            } else if (cachedPreferences.window.closeButtonMinimize !== updatedPreferences.window.closeButtonMinimize || cachedPreferences.general.incognitoMode !== updatedPreferences.general.incognitoMode) {
                //
            } else {
                if (!DialogMessage) {
                    DialogMessage = dialog.showMessageBox(app.win, {
                        title: "Restart Required",
                        message: "A restart is required in order for the settings you have changed to apply.",
                        type: "warning",
                        buttons: ['Relaunch Now', 'Relaunch Later']
                    }).then(({
                        response
                    }) => {
                        if (response === 0) {
                            app.relaunch()
                            app.quit()
                        }
                    })
                }
            }

            cachedPreferences = updatedPreferences
        });
    },

    LinkHandler: function(songId) {
        if (!songId) return;


        if (String(songId).includes('auth')) {
            let authURI = String(songId).split('/auth/')[1]
            if (authURI.startsWith('lastfm')) { // If we wanted more auth options
                preferences.general.lastfmAuthKey = authURI.split('lastfm?token=')[1]
            }
        } else {
            console.log(songId)
            let formattedSongID = songId.replace(/\D+/g, '');
            console.warn(`[LinkHandler] Attempting to load song id: ${formattedSongID}`);
            // Someone look into why playMediaItem doesn't work thanks - cryptofyre
            app.win.webContents.executeJavaScript(`MusicKit.getInstance().changeToMediaItem('${formattedSongID}')`)
        }

    },

    LyricsHandler: function(lyrics) {
        let win = new BrowserWindow({
            width: 800,
            height: 600,
            show: false,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        ipcMain.on('LyricsHandler', function(event, data, artworkURL) {
            if (win == null) {
                win = new BrowserWindow({
                    width: 800,
                    height: 600,
                    show: true,
                    autoHideMenuBar: true,
                    webPreferences: {
                        nodeIntegration: true,
                        contextIsolation: false,

                    }
                });
            }
            console.log("attempted: " + data)
                // Or load a local HTML file
            win.loadFile(join(__dirname, '../lyrics/index.html'));
            win.show();
            win.on('closed', () => {
                win = null
            });
            win.webContents.on('did-finish-load', () => {
                if (win) {
                    win.webContents.send('truelyrics', data);
                    win.webContents.send('albumart', artworkURL);
                }

            })


        });
        ipcMain.on('LyricsTimeUpdate', function(event, data) {
            if (win != null) {
                win.webContents.send('ProgressTimeUpdate', data);
            }
        });
        ipcMain.on('LyricsUpdate', function(event, data, artworkURL) {
            if (win != null) {
                win.webContents.send('truelyrics', data);
                win.webContents.send('albumart', artworkURL);
            }
        });
        ipcMain.on('ProgressTimeUpdateFromLyrics', function(event, data) {
            if (win) {
                app.win.webContents.executeJavaScript(`MusicKit.getInstance().seekToTime('${data}')`).catch((e) => console.error(e));
            }
        });
    }
}

module.exports = handler