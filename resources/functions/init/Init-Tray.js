const {app, Tray} = require('electron');
const {join} = require('path');
const {SetContextMenu} = require('../win/SetContextMenu')

exports.InitializeTray = function () {
    console.log('[InitializeTray] Started.')

    app.tray = new Tray((process.platform === "win32") ? join(__dirname, `../../icons/icon.ico`) : join(__dirname, `../../icons/icon.png`))
    app.tray.setToolTip('Apple Music');
    SetContextMenu(true);

    app.tray.on('double-click', () => {
        app.win.show()
    })


}