const {app, Menu, Notification} = require('electron')
const {autoUpdater} = require("electron-updater");

exports.SetContextMenu = function (visibility) {

    if (visibility) {
        app.tray.setContextMenu(Menu.buildFromTemplate([
            {
                label: 'Check for Updates',
                click: function () {
                    autoUpdater.checkForUpdatesAndNotify().then(r => {
                        new Notification({
                            title: "Apple Music",
                            body: `Latest Version is ${r.updateInfo.version}`
                        }).show()
                    });
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
                    autoUpdater.checkForUpdatesAndNotify().then(r => {
                        new Notification({
                            title: "Apple Music",
                            body: `Latest Version is ${r.updateInfo.version}`
                        }).show()
                    });
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