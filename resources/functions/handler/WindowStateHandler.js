const {app, ipcMain, shell} = require('electron')
const {SetContextMenu} = require('../win/SetContextMenu')
const {SetThumbarButtons} = require('../win/SetThumbarButtons')
const {LoadFiles} = require("../InjectFiles");
const {dialog} = require('electron')

exports.WindowStateHandler = function () {
    console.log('[WindowStateHandler] Started.')
    app.previousPage = app.win.webContents.getURL()

    app.win.webContents.setWindowOpenHandler(({url}) => {
        if (url.startsWith('https://discord.gg/') || url.startsWith('https://apple.com/') || url.startsWith('https://www.apple.com/') || url.startsWith('https://support.apple.com/') || url.startsWith('https://beta.music.apple.com') || url.startsWith('https://music.apple.com')) { // for security (pretty pointless ik)
            shell.openExternal(url).then(() => console.log(`[WindowStateHandler] User has opened ${url} which has been redirected to browser.`));
            return {action: 'deny'}
        }
        console.log(`[WindowStateHandler] User has attempted to open ${url} which was blocked.`)
        return {action: 'deny'}
    })

    app.win.webContents.on('unresponsive', async () => {
        const { response } = await dialog.showMessageBox({
            message: 'Apple Music has become unresponsive',
            title: 'Do you want to try forcefully reloading the app?',
            buttons: ['Yes', 'Quit', 'No'],
            cancelId: 1
        })
        if (response === 0) {
            app.win.contents.forcefullyCrashRenderer()
            app.win.contents.reload()
        } else  if (response === 1) {
            console.log("[WindowStateHandler] Application has become unresponsive and has been closed.")
            app.exit();
        }
    })

    app.win.webContents.on('did-stop-loading', async () => {
        LoadFiles()
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
            app.win.hide();
        } else {
            event.preventDefault();
            app.win.destroy();
        }
    });

    ipcMain.on('minimize', () => { // listen for minimize event
        app.win.minimize()
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
        // if (app.win.StoredWebsite) app.win.loadURL(app.win.StoredWebsite)
    })

    app.win.on('hide', function () {
        SetContextMenu(false)
        app.win.StoredWebsite = app.win.webContents.getURL();
    })


}