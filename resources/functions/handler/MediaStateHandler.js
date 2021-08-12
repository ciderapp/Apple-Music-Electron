const {app, ipcMain} = require('electron')
const {CreateNotification} = require('../CreateNotification')
const Sentry = require('@sentry/electron');
if (app.preferences.value('general.analyticsEnabled').includes(true)) {
    Sentry.init({ dsn: "https://20e1c34b19d54dfcb8231e3ef7975240@o954055.ingest.sentry.io/5903033" });
}

exports.mediaItemStateDidChange = function () {
    console.log('[mediaItemStateDidChange] Started.')
    ipcMain.on('mediaItemStateDidChange', (_item, a) => {
        CreateNotification(a)
        app.mpris.updateActivity(a);
    });
}