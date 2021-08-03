const {app, ipcMain} = require('electron')
const {SetThumbarButtons} = require('../win/SetThumbarButtons')
const {SetTrayTooltip} = require('../win/SetTrayTooltip')

exports.playbackStateDidChange = function () {
    console.log('[playbackStateDidChange] Started.')
    app.PreviousSongId = null;

    ipcMain.on('playbackStateDidChange', (_item, a) => {
        app.isPlaying = a.status;

        try {
            if (a.playParams.id !== app.PreviousSongId) { // If it is a new song
                a.startTime = Date.now()
                a.endTime = Number(Math.round(a.startTime + a.durationInMillis));
            } else { // If its continuing from the same song
                a.startTime = Date.now()
                a.endTime = Number(Math.round(Date.now() + a.remainingTime));
            }
        } catch (err) {
            console.error(`[playbackStateDidChange] Error when setting endTime - ${err}`);
            a.endTime = 0;
        }

        // Just in case
        if (!a.endTime) {
            a.endTime = Number(Math.round(Date.now()));
        }

        SetThumbarButtons(a.status)
        SetTrayTooltip(a)
        app.discord.rpc.updateActivity(a)
        app.lastfm.scrobbleSong(a)
        app.mpris.updateState(a)

        app.PreviousSongId = a.playParams.id
    });
}