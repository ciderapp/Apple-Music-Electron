const {app, Menu} = require('electron')
const {Analytics} = require("../analytics/sentry");
const {checkUpdates} = require("../update/update");
Analytics.init()

exports.SetContextMenu = function (visibility) {

    if (visibility) {
        app.tray.setContextMenu(Menu.buildFromTemplate([
            {
                label: 'Check for Updates',
                click: function () {
                    checkUpdates(true)
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
                    checkUpdates(true)
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