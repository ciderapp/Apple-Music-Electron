const {app, Tray, nativeImage} = require('electron');
const {join} = require('path');
const {Analytics} = require("../sentry");
Analytics.init()

exports.InitializeTray = function () {
    console.log('[InitializeTray] Started.')

    const winTray = nativeImage.createFromPath(join(__dirname, `../../icons/icon.ico`)).resize({width: 32, height: 32})
    const macTray = nativeImage.createFromPath(join(__dirname, `../../icons/icon.png`)).resize({width: 32, height: 32})
    const linuxTray = nativeImage.createFromPath(join(__dirname, `../../icons/icon.png`)).resize({width: 32, height: 32})
    let trayIcon;
    if (process.platform === "win32") {
        trayIcon = winTray
    } else if (process.platform === "linux") {
        trayIcon = linuxTray
    } else if (process.platform === "darwin") {
        trayIcon = macTray
    }

    app.tray = new Tray(trayIcon)
    app.tray.setToolTip('Apple Music');
    app.funcs.SetContextMenu(true);

    app.tray.on('double-click', () => {
        if (typeof app.win.show === 'function') {
            if (app.win.isVisible()) {
                app.win.focus()
            } else {
                app.win.show()
            }
        }
    })


}