const {app, Menu} = require('electron')
const {autoUpdater} = require("electron-updater");

exports.SetContextMenu = function (visibility) {

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
    return true


}