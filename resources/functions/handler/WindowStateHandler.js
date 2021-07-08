const {app, ipcMain, shell} = require('electron')
const {SetContextMenu} = require('../win/SetContextMenu')
const {SetThumbarButtons} = require('../win/SetThumbarButtons')

exports.WindowStateHandler = function () {
    console.log('[WindowStateHandler] Started.')

    app.win.webContents.setWindowOpenHandler(({url}) => {
        if (url.startsWith('https://apple.com/') || url.startsWith('https://www.apple.com/') || url.startsWith('https://support.apple.com/')) { // for security (pretty pointless ik)
            shell.openExternal(url).then(() => console.log(`[WindowStateHandler] User has opened ${url} which has been redirected to browser.`));
            return {action: 'deny'}
        }
        console.log(`[WindowStateHandler] User has attempted to open ${url} which was blocked.`)
        return {action: 'deny'}
    })

    app.win.on('unresponsive', function () {
        console.log("[WindowStateHandler] Application has become unresponsive and has been closed.")
        app.exit();
    });


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

    ipcMain.on('preferencesUpdated', (e, preferences) => {
        console.log('[WindowStateHandler] Preferences have been updated!');
        app.config = preferences
    });

    app.win.on('show', function () {
        SetContextMenu(true)
        SetThumbarButtons(app.isPlaying)
    })

    app.win.on('hide', function () {
        SetContextMenu(false)
    })


}