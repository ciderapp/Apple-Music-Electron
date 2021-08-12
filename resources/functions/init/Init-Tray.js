const {app, Tray} = require('electron');
const {join} = require('path');
const {SetContextMenu} = require('../win/SetContextMenu')
const Sentry = require('@sentry/electron');
if (app.preferences.value('general.analyticsEnabled').includes(true)) {
    Sentry.init({ dsn: "https://20e1c34b19d54dfcb8231e3ef7975240@o954055.ingest.sentry.io/5903033" });
}

exports.InitializeTray = function () {
    console.log('[InitializeTray] Started.')

    app.tray = new Tray((process.platform === "win32") ? join(__dirname, `../../icons/icon.ico`) : join(__dirname, `../../icons/icon.png`))
    app.tray.setToolTip('Apple Music');
    SetContextMenu(true);

    app.tray.on('double-click', () => {
        app.win.show()
    })


}