const {app, ipcMain, shell, dialog} = require('electron')
const {SetThumbarButtons} = require('../win/SetThumbarButtons')
const {SetTrayTooltip} = require('../win/SetTrayTooltip')
const {Analytics} = require("../analytics/sentry");
const {CreateNotification} = require("../CreateNotification");
const {LoadOneTimeFiles, LoadFiles} = require("../InjectFiles");
const {SetContextMenu} = require("../win/SetContextMenu");
Analytics.init()

const handler = {
    InstanceHandler: function () {
        console.log('[InstanceHandler] Started.')
        const gotTheLock = app.requestSingleInstanceLock();

        if (!gotTheLock && !app.preferences.value('advanced.allowMultipleInstances').includes(true)) {
            console.log("[InstanceHandler] Existing Instance is Blocking Second Instance.")
            app.quit();
            return true
        } else {
            app.on('second-instance', (_e, argv) => {
                console.log(`[InstanceHandler] Second Instance Started with args: [${argv.join(', ')}]`)

                if (argv.includes("--force-quit")) {
                    console.log('[InstanceHandler] Force Quit found. Quitting App.')
                    app.quit()
                    return true
                } else if (app.win && !app.preferences.value('advanced.allowMultipleInstances').includes(true)) {
                    console.log('[InstanceHandler] Showing window.')
                    app.win.show()
                    app.win.focus()
                }

                if (app.win !== null) {
                    argv.forEach((value) => {
                        if (value.includes('ame://') || value.includes('itms://') || value.includes('itmss://') || value.includes('musics://') || value.includes('music://')) {
                            handler.LinkHandler(value)
                        }
                    })
                }
            })
        }
        return false
    },

    PlaybackStateHandler: function () {
        console.log('[playbackStateDidChange] Started.')
        app.PreviousSongId = null;

        ipcMain.on('playbackStateDidChange', (_item, a) => {
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

            SetThumbarButtons(a.status)
            SetTrayTooltip(a)

            if (app.preferences.value('general.incognitoMode').includes(true)) {
                console.log("[Incognito] Incognito Mode enabled. DiscordRPC and LastFM updates are ignored.")
            } else {
                app.discord.rpc.updateActivity(a)
                app.lastfm.scrobbleSong(a)
            }

            app.mpris.updateState(a)

            app.PreviousSongId = a.playParams.id
        });
    },

    MediaStateHandler: function () {
        console.log('[mediaItemStateDidChange] Started.')
        ipcMain.on('mediaItemStateDidChange', (_item, a) => {
            CreateNotification(a)
            app.mpris.updateActivity(a);
        });
    },

    WindowStateHandler: function () {
        console.log('[WindowStateHandler] Started.')
        app.previousPage = app.win.webContents.getURL()

        app.win.webContents.setWindowOpenHandler(({url}) => {
            shell.openExternal(url).then(() => console.log(`[WindowStateHandler] User has opened ${url} which has been redirected to browser.`));
            return {action: 'deny'}
        })

        app.win.webContents.on('unresponsive', async () => {
            const {response} = await dialog.showMessageBox({
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
            LoadOneTimeFiles()
        });

        app.win.webContents.on('did-start-loading', async () => {
            app.previousPage = app.win.webContents.getURL()
        });

        app.win.webContents.on('page-title-updated', function (event) { // Prevents the Window Title from being Updated
            LoadFiles()
            event.preventDefault()
        });

        app.win.on('close', function (event) { // Hide the App if isQuitting is not true
            if (!app.isQuiting) {
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
                /*if (app.preferences.value('visual.emulateMacOS').includes(false)) {
                    app.win.webContents.executeJavaScript(`document.getElementById('maxResBtn').title = 'Maximize'; document.getElementById('maxResBtn').classList.remove('restoreBtn'); document.getElementById('maxResBtn').classList.add('maximizeBtn');`)
                }*/
            } else {
                app.win.maximize()
                /*if (app.preferences.value('visual.emulateMacOS').includes(false)) {
                    app.win.webContents.executeJavaScript(`document.getElementById('maxResBtn').title = 'Restore'; document.getElementById('maxResBtn').classList.remove('maximizeBtn'); document.getElementById('maxResBtn').classList.add('restoreBtn');`)
                }*/
            }
        })

        ipcMain.on('close', () => { // listen for close event
            app.win.close();
        })

        app.win.on('show', function () {
            SetContextMenu(true)
            SetThumbarButtons(app.isPlaying)
            if (app.win.isVisible()) {
                app.win.focus()
            }
            // if (app.win.StoredWebsite) app.win.loadURL(app.win.StoredWebsite)
        })

        app.win.on('hide', function () {
            SetContextMenu(false)
            // app.win.StoredWebsite = app.win.webContents.getURL();
        })
    },

    SettingsHandler: function () {
        console.log('[InstanceHandler] Started.')
        let DialogMessage;

        app.preferences.on('save', (_preferences) => {
            if (!DialogMessage) {
                DialogMessage = dialog.showMessageBox(app.win, {
                    title: "Restart Required",
                    message: "A restart is required.",
                    type: "warning",
                    buttons: ['Relaunch Now', 'Relaunch Later']
                }).then(({response}) => {
                    if (response === 0) {
                        app.relaunch()
                        app.quit()
                    }
                })
            }
        });
    },

    LinkHandler: function (url) {
        if (!url) return;
        console.log(url)
    //    we need to do stuff here and its gonna be horrible
    }
}

module.exports = handler