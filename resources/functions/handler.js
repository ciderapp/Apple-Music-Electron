const { app, Menu, ipcMain, shell, dialog, Notification, BrowserWindow, SystemPreferences, systemPreferences} = require('electron')
const SentryInit = require("./init").SentryInit;
SentryInit()
const { LoadOneTimeFiles, LoadFiles } = require('./load');
const { join, resolve } = require('path');
const { existsSync, truncate } = require('fs');
const rimraf = require('rimraf');
app.currentPlaybackActivity = false

function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

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

        app.on('second-instance', (_e, argv) => {
            console.warn(`[InstanceHandler][SecondInstanceHandler] Second Instance Started with args: [${argv.join(', ')}]`)

            // Checks if first instance is authorized and if second instance has protocol args
            argv.forEach((value) => {
                if (value.includes('ame://') || value.includes('itms://') || value.includes('itmss://') || value.includes('musics://') || value.includes('music://')) {
                    console.warn(`[InstanceHandler][SecondInstanceHandler] Found Protocol!`)
                    handler.LinkHandler(value);
                }
            })

            if (argv.includes("--force-quit")) {
                console.warn('[InstanceHandler][SecondInstanceHandler] Force Quit found. Quitting App.');
                app.quit()
                returnVal = true
            }
            else if (app.win && !app.preferences.value('advanced.allowMultipleInstances').includes(true)) { // If a Second Instance has Been Started
                console.warn('[InstanceHandler][SecondInstanceHandler] Showing window.');
                app.win.show()
                app.win.focus()
            }
        })

        if (!gotTheLock && !app.preferences.value('advanced.allowMultipleInstances').includes(true)) {
            console.warn("[InstanceHandler] Existing Instance is Blocking Second Instance.");
            app.quit();
            return true
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

        app.win.webContents.setWindowOpenHandler(({url}) => {
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

            if (!app.isQuiting || process.platform === "darwin") {
                event.preventDefault();
                if (typeof app.win.hide === 'function') {
                    app.win.hide();
                }
            } else {
                event.preventDefault();
                if (typeof app.win.destroy === 'function') {
                    app.win.destroy();
                }
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

        // For macOS Link Handling
        app.on('open-url', function(event, url) {
            event.preventDefault()
            if (url.includes('ame://') || url.includes('itms://') || url.includes('itmss://') || url.includes('musics://') || url.includes('music://')) {
                handler.LinkHandler(url)
            }
        })

    },

    SettingsHandler: function() {
        console.verbose('[SettingsHandler] Started.');
        let DialogMessage = false, cachedPreferences = app.preferences._preferences, storedChanges = [];

        const { fetchTransparencyOptions } = require('./CreateBrowserWindow')

        systemPreferences.on('accent-color-changed', (event, color) => {
            if (app.preferences.value('visual.useOperatingSystemAccent')) {
                if (color) {
                    const accent = '#' + color.slice(0, -2)
                    app.win.webContents.insertCSS(`
                    :root {
                        --keyColor: ${accent} !important;
                        --keyColor-rgb: ${hexToRgb(accent).r} ${hexToRgb(accent).g} ${hexToRgb(accent).b} !important;
                    }
                }
                `).catch((e) => console.error(e));
                }
            }
        })

        app.preferences.on('save', (updatedPreferences) => {
            let currentChanges = []

            for (const [categoryTitle, categoryContents] of Object.entries(updatedPreferences)) {
                if (categoryContents !== cachedPreferences[categoryTitle]) { // This has gotten the changed category
                    for (const [settingTitle, settingValue] of Object.entries(updatedPreferences[categoryTitle])) {
                        if (JSON.stringify(settingValue) !== JSON.stringify(cachedPreferences[categoryTitle][settingTitle])) {
                            currentChanges.push(`${categoryTitle}.${settingTitle}`)
                            if (!storedChanges.includes(`${categoryTitle}.${settingTitle}`)) {
                                storedChanges.push(`${categoryTitle}.${settingTitle}`)
                            }
                        }
                    }
                }
            }

            console.verbose(`[SettingsHandler] Found changes: ${currentChanges} | Total Changes: ${storedChanges}`);

            // Theme Changes
            if (currentChanges.includes('visual.theme')) {
                app.win.webContents.executeJavaScript(`AMThemes.loadTheme("${(updatedPreferences.visual.theme === 'default' || !updatedPreferences.visual.theme) ? '' : updatedPreferences.visual.theme}");`).catch((e) => console.error(e));
                const updatedVibrancy = fetchTransparencyOptions();
                if (app.transparency && updatedVibrancy && process.platform !== 'darwin') app.win.setVibrancy(updatedVibrancy);
            }
            // Transparency Changes
            else if (currentChanges.includes('visual.transparencyEffect') || currentChanges.includes('visual.transparencyTheme') || currentChanges.includes('visual.transparencyDisableBlur') || currentChanges.includes('visual.transparencyMaximumRefreshRate')) {
                const updatedVibrancy = fetchTransparencyOptions()
                if (app.transparency && updatedVibrancy && process.platform !== 'darwin') {
                    app.win.setVibrancy(updatedVibrancy);
                    app.win.webContents.executeJavaScript(`AMThemes.setTransparency(true);`).catch((e) => console.error(e));
                } else {
                    app.win.setVibrancy();
                    app.win.webContents.executeJavaScript(`AMThemes.setTransparency(false);`).catch((e) => console.error(e));
                }
            }
            else if (currentChanges.includes('visual.removeUpsell') || currentChanges.includes('visual.removeAppleLogo') || currentChanges.includes('visual.removeFooter') || currentChanges.includes('visual.useOperatingSystemAccent')) {
                app.win.webContents.executeJavaScript('AMJavaScript.LoadCustom()').catch((e) => console.error(e));
            }
            // Frame Type Changes (TBA)
            else if (currentChanges.includes('visual.frameType')) {
                //    run js function to unload / load new frame
            }
            else if (currentChanges.includes('window.closeButtonMinimize')) {
                app.isQuiting = !app.preferences.value('window.closeButtonMinimize').includes(true);
            }
            // IncognitoMode Changes
            else if (currentChanges.includes('general.incognitoMode')) {
                if (app.preferences.value('general.incognitoMode').includes(true)) {
                    console.log("[Incognito] Incognito Mode enabled. DiscordRPC and LastFM updates are ignored.")
                }
            }
            // The rest ask for a restart
            else if (!DialogMessage && !currentChanges.includes('general.lastfmAuthKey')) {
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

            cachedPreferences = updatedPreferences
        });
    },

    LinkHandler: function(startArgs) {
        if (!startArgs || !app.win || !app.isAuthorized) return;


        if (String(startArgs).includes('auth')) {
            let authURI = String(startArgs).split('/auth/')[1]
            if (authURI.startsWith('lastfm')) { // If we wanted more auth options
                const authKey = authURI.split('lastfm?token=')[1];
                app.win.webContents.send('LastfmAuthenticated', authKey);
            }
        } else {
            console.log(startArgs)
            let formattedSongID = startArgs.replace(/\D+/g, '');
            console.warn(`[LinkHandler] Attempting to load song id: ${formattedSongID}`);
            // Someone look into why playMediaItem doesn't work thanks - cryptofyre

            app.win.webContents.executeJavaScript(`MusicKit.getInstance().api.library.song('${formattedSongID}')`)
            app.win.webContents.executeJavaScript(`MusicKit.getInstance().changeToMediaItem('${formattedSongID}')`)
        }

    },

    LyricsHandler: function(lyrics) {
        let win = new BrowserWindow({
            width: 1,
            height: 1,
            show: false,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });

        ipcMain.on('NetEaseLyricsHandler', function(event, data){
            try{	 
                if (win == null) {
                    win = new BrowserWindow({
                        width: 100,
                        height: 100,
                        show: false,
                        autoHideMenuBar: true,
                        webPreferences: {
                            nodeIntegration: true,
                            contextIsolation: false,
    
                        }
                    });
                    win.webContents.on('did-finish-load', () => {
                        win.webContents.send('neteasecors', data);  
                    });
                } else {
                    win.webContents.on('did-finish-load', () => {
                        win.webContents.send('neteasecors', data);  
                    });
                }
                win.loadFile(join(__dirname, '../lyrics/netease.html'));
                win.on('closed', () => {
                win = null
                });

            }catch(e){
                console.log(e);
                app.win.send('truelyrics', '[00:00] Instrumental. / Lyrics not found.');	
            } 
        });
        ipcMain.on('LyricsHandler', function(event, data, artworkURL) {
            app.win.send('truelyrics', data);
            app.win.send('albumart', artworkURL);
        });
        ipcMain.on('LyricsHandlerNE', function(event, data) {
            app.win.send('truelyrics', data);
        });
        ipcMain.on('LyricsTimeUpdate', function(event, data) {
            app.win.send('ProgressTimeUpdate', data);
        });
        ipcMain.on('LyricsUpdate', function(event, data, artworkURL) {
            app.win.send('truelyrics', data);
            app.win.send('albumart', artworkURL);
        });
        ipcMain.on('ProgressTimeUpdateFromLyrics', function(event, data) {
            app.win.webContents.executeJavaScript(`MusicKit.getInstance().seekToTime('${data}')`).catch((e) => console.error(e));
        });
    }
}

module.exports = handler