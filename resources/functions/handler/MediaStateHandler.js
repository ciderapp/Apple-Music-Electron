const {app, ipcMain} = require('electron')
const {SetThumbarButtons} = require('../win/SetThumbarButtons')
const {UpdateMetaData} = require('../mpris/UpdateMetaData')
const {CreatePlaybackNotification} = require('../CreatePlaybackNotification')

exports.mediaItemStateDidChange = function () {
    console.log('[mediaItemStateDidChange] Started.')
    ipcMain.on('mediaItemStateDidChange', (_item, a) => {
        if (!app.ipc.cache) SetThumbarButtons();
        if (!a || a.playParams.id === 'no-id-found') return;

        // Generate the First Cache
        if (!app.ipc.cache) {
            try {
                console.log('[mediaItemStateDidChange] Attempting to generate first Cache.')
                app.ipc.cache = a;
                app.ipc.cacheNew = true;
            } catch(err) {
                console.log(`[mediaItemStateDidChange] Error while generating cache: ${err}`)
            }

        }


        // Create Playback Notification on Song Change
        if (a.playParams.id !== app.ipc.cache.playParams.id || app.ipc.cacheNew) { // Checks if it is a new song
            while (!app.ipc.MediaNotification) {
                app.ipc.MediaNotification = CreatePlaybackNotification(a)
            }
            setTimeout(function () {
                app.ipc.MediaNotification = false;
                if (app.ipc.cacheNew) app.ipc.cacheNew = false;
            }, 500);
            if (app.mpris) UpdateMetaData(a);
        }

        // Update the Cache
        while (a.playParams.id !== app.ipc.cache.playParams.id) {
            console.log('[mediaItemStateDidChange] Cached Song is not the same as Attribute Song, updating cache.')
            app.ipc.cache = a
        }


    });
}