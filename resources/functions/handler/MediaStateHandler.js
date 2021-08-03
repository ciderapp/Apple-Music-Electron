const {app, ipcMain} = require('electron')
const {CreateNotification} = require('../CreateNotification')

exports.mediaItemStateDidChange = function () {
    console.log('[mediaItemStateDidChange] Started.')
    ipcMain.on('mediaItemStateDidChange', (_item, a) => {
        CreateNotification(a)
        app.mpris.updateActivity(a);
    });
}