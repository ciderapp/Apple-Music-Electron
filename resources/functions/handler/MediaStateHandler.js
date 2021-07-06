const {app, ipcMain} = require('electron')
const {SetThumbarButtons} = require('../win/SetThumbarButtons')
const {UpdateMetaData} = require('../mpris/UpdateMetaData')
const {CreateNotification} = require('../CreateNotification')
const {scrobble} = require("../lastfm/scrobbleSong");

exports.mediaItemStateDidChange = function () {
    console.log('[mediaItemStateDidChange] Started.')
    ipcMain.on('mediaItemStateDidChange', (_item, a) => {
        if (a.playParams.id === 'no-id-found') app.mpris.metadata = {'mpris:trackid': '/org/mpris/MediaPlayer2/TrackList/NoTrack'};
        if (a.playParams.id === 'no-id-found' || !app.ipc.cache) SetThumbarButtons();
        if (!a || a.playParams.id === 'no-id-found') return;

        // Generate the First Cache
        if (!app.ipc.cache) {
            console.log('[mediaItemStateDidChange] Attempting to generate first Cache.')
            app.ipc.cache = a;
            app.ipc.cacheNew = true;
        }

        // New Song Updates
        if (a.playParams.id !== app.ipc.cache.playParams.id || app.ipc.cacheNew) {

            //  Notifications
            while (app.ipc.MediaNotification) {
                app.ipc.MediaNotification = CreateNotification(a)
            }
            //  Update Mpris Meta Data
            while (app.ipc.MprisUpdate) {
                app.ipc.MprisUpdate = UpdateMetaData(a);
            }

        }

        // Update the Cache and send a request to LastFM if enabled of course :smile:
        while (a.playParams.id !== app.ipc.cache.playParams.id) {
            console.log('[mediaItemStateDidChange] Cached Song is not the same as Attribute Song, updating cache.')
            app.ipc.cache = a;
            if (app.config.lastfm.enabled) {
                scrobble(a)
            }
        }

        // Revert it All because This Runs too many times
        setTimeout(() => {
            if (!app.ipc.MprisUpdate) app.ipc.MprisUpdate = true;
            if (!app.ipc.MediaNotification) app.ipc.MediaNotification = true;
            if (app.ipc.cacheNew) app.ipc.cacheNew = false;
        }, 500)
    });
}