const {app, Menu, Notification} = require('electron')
const {autoUpdater} = require("electron-updater");
const Sentry = require('@sentry/electron');
if (app.preferences.value('general.analyticsEnabled').includes(true)) {
    Sentry.init({ dsn: "https://20e1c34b19d54dfcb8231e3ef7975240@o954055.ingest.sentry.io/5903033" });
}

exports.SetContextMenu = function (visibility) {

    if (visibility) {
        app.tray.setContextMenu(Menu.buildFromTemplate([
            {
                label: 'Check for Updates',
                click: function () {
                    autoUpdater.checkForUpdatesAndNotify().then(r => {
                        if (r) {
                            new Notification({
                                title: "Apple Music",
                                body: `Latest Version is ${r.updateInfo.version}`
                            }).show()
                        }
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
                        if (r) {
                            new Notification({
                                title: "Apple Music",
                                body: `Latest Version is ${r.updateInfo.version}`
                            }).show()
                        }
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