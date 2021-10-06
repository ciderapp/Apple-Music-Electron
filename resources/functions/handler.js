const {
    app,
    ipcMain,
    shell,
    dialog,
    Notification
} = require('electron')
const SentryInit = require("./init").SentryInit;
SentryInit()
const {
    LoadOneTimeFiles,
    LoadFiles
} = require('./load');
const {
    join,
    resolve
} = require('path');
const {
    existsSync,
    truncate
} = require('fs');
const rimraf = require('rimraf');


const handler = {
    LaunchHandler: function () {

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
        app.on('open-url', function (event, url) {
            event.preventDefault()
            if (url.includes('ame://') || url.includes('itms://') || url.includes('itmss://') || url.includes('musics://') || url.includes('music://')) {
                handler.LinkHandler(url)
            }
        })

    },

    LaunchHandlerPostWin: function () {
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

    VersionHandler: function () {
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
                truncate(resolve(app.getPath('userData'), 'preferences.json'), 0, function () {
                    console.log(`[VersionHandler] Outdated / No Version Store Found. Clearing Preferences File. ('${resolve(app.getPath('userData'), 'preferences.json')}')`)
                });
            }
        }
    },

    InstanceHandler: function () {
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

    PlaybackStateHandler: function () {
        console.verbose('[playbackStateDidChange] Started.');
        app.PreviousSongId = null;

        ipcMain.on('playbackStateDidChange', (_item, a) => {
            console.warn('[handler] playbackStateDidChange received.');
            app.isPlaying = a.status;

            try {
                if (a.playParams.id !== app.PreviousSongId) { // If it is a new song
                    a.startTime = Date.now()
                    a.endTime = Number(Math.round(a.startTime + a.durationInMillis));
                } else { // If its continuing from the same song
                    a.startTime = Date.now()
                    a.endTime = Number(Math.round(Date.now() + a.remainingTime));
                }
            } catch (err) {
                console.error(`[playbackStateDidChange] Error when setting endTime - ${err}`);
                a.endTime = 0;
            }

            // Just in case
            if (!a.endTime) {
                a.endTime = Number(Math.round(Date.now()));
            }

            app.funcs.SetThumbarButtons(a.status)
            app.funcs.SetTrayTooltip(a)

            if (app.preferences.value('general.incognitoMode').includes(true)) {
                console.log("[Incognito] Incognito Mode enabled. DiscordRPC and LastFM updates are ignored.")
            } else {
                app.funcs.discord.updateActivity(a)
                app.funcs.lastfm.scrobbleSong(a)
            }

            app.funcs.mpris.updateState(a)
            app.PreviousSongId = a.playParams.id
        });
    },

    MediaStateHandler: function () {
        console.verbose('[mediaItemStateDidChange] Started.');
        ipcMain.on('mediaItemStateDidChange', (_item, a) => {
            console.warn('[handler] mediaItemStateDidChange received.')
            app.funcs.CreateNotification(a)
            app.funcs.mpris.updateActivity(a);
            // Update metadata css
            app.win.webContents.executeJavaScript("AMThemes.updateMeta()")
            if (app.preferences.value('audio.gaplessEnabled').includes(true)) {
                try {
                    if (a.playParams.id !== app.PreviousSongId) { // If it is a new song
                        a.startTime = Date.now()
                        a.endTime = Number(Math.round(a.startTime + a.durationInMillis));
                    } else { // If its continuing from the same song
                        a.startTime = Date.now()
                        a.endTime = Number(Math.round(Date.now() + a.remainingTime));
                    }
                } catch (err) {
                    console.error(`[playbackStateDidChange] Error when setting endTime - ${err}`);
                    a.endTime = 0;
                }

                // Just in case
                if (!a.endTime) {
                    a.endTime = Number(Math.round(Date.now()));
                }

                app.funcs.SetThumbarButtons(a.status)
                app.funcs.SetTrayTooltip(a)

                if (app.preferences.value('general.incognitoMode').includes(true)) {
                    console.log("[Incognito] Incognito Mode enabled. DiscordRPC and LastFM updates are ignored.")
                } else {
                    app.funcs.discord.updateActivity(a)
                    app.funcs.lastfm.scrobbleSong(a)
                }
            }
        });
    },

    WindowStateHandler: function () {
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

        app.win.webContents.on('unresponsive', async () => {
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

        app.win.webContents.on('did-finish-load', async () => {
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

        app.win.webContents.on('did-start-loading', async () => {
            app.previousPage = app.win.webContents.getURL()
        });

        app.win.webContents.on('page-title-updated', function (event) { // Prevents the Window Title from being Updated
            LoadFiles()
            event.preventDefault()
        });

        app.win.on('close', function (event) { // Hide the App if isQuitting is not true
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

            app.win.on("resize", (event) => {
                var isMaximized = app.win.isMaximized()
                var isMinimized = app.win.isMinimized()
                var isFullScreen = app.win.isFullScreen()
                var state = wndState
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
            if (app.win.isMaximized()) {
                app.win.restore()
                if(process.platform !== "win32") {
                    app.win.webContents.executeJavaScript(`document.querySelector("#maximize").classList.remove("maxed")`)
                }
                /*if (process.platform === 'win32' && app.preferences.value('visual.frameType') !== 'mac' || app.preferences.value('visual.frameType') !== 'mac-right') {
                    app.win.webContents.insertCSS(`.web-nav-window-controls #maximize { background-image: var(--gfx-maxedBtn) !important; };`).catch((e) => console.error(e))
                }*/
            } else {
                app.win.maximize()
                if(process.platform !== "win32") {
                    app.win.webContents.executeJavaScript(`document.querySelector("#maximize").classList.add("maxed")`)
                }
                /*if (process.platform === 'win32' && app.preferences.value('visual.frameType') !== 'mac' || app.preferences.value('visual.frameType') !== 'mac-right') {
                    app.win.webContents.insertCSS(`.web-nav-window-controls #maximize { background-image: var(--gfx-maxBtn) !important; };`).catch((e) => console.error(e))
                }*/
            }
        })

        ipcMain.on('close', () => { // listen for close event
            app.win.close();
        })

        app.win.on('show', function () {
            app.funcs.SetContextMenu(true)
            app.funcs.SetThumbarButtons(app.isPlaying)
            if (app.win.isVisible()) {
                app.win.focus()
            }
            // if (app.win.StoredWebsite) app.win.loadURL(app.win.StoredWebsite)
        })

        app.win.on('hide', function () {
            app.funcs.SetContextMenu(false)
            // app.win.StoredWebsite = app.win.webContents.getURL();
        })
    },

    SettingsHandler: function () {
        console.verbose('[SettingsHandler] Started.');
        let DialogMessage, cachedPreferences = app.preferences._preferences;

        app.preferences.on('save', (updatedPreferences) => {
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

            cachedPreferences = updatedPreferences
        });
    },

    LinkHandler: function (songId) {
        if (!songId) return;
        console.log(songId)
        let formattedSongID = songId.replace(/\D+/g, '');
        console.warn(`[LinkHandler] Attempting to load song id: ${formattedSongID}`);
        // Someone look into why playMediaItem doesn't work thanks - cryptofyre
        app.win.webContents.executeJavaScript(`MusicKit.getInstance().changeToMediaItem('${formattedSongID}')`)
    }
}

module.exports = handler