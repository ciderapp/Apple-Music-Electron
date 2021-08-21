const {app, ipcMain} = require('electron')
const {CreateNotification} = require('../CreateNotification')
const {Analytics} = require("../analytics/sentry");
Analytics.init()

exports.mediaItemStateDidChange = function () {
    console.log('[mediaItemStateDidChange] Started.')
    ipcMain.on('mediaItemStateDidChange', (_item, a) => {
        CreateNotification(a)
        if (app.preferences.value('general.incognitoMode').includes(true)) {
            app.mpris.updateActivity(a);
        }
    });
}