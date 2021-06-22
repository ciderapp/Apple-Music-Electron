const {app, ipcMain} = require('electron')
const {UpdateActivity} = require('../rpc/UpdateActivity')
const {SetThumbarButtons} = require('../win/SetThumbarButtons')
const {SetTrayTooltip} = require('../win/SetTrayTooltip')
const {UpdatePlaybackStatus} = require('../mpris/UpdatePlaybackStatus')

exports.playbackStateDidChange = function () {
    ipcMain.on('playbackStateDidChange', (_item, a) => {

        if (app.mpris) UpdatePlaybackStatus(a);

        app.isPlaying = a.status;
        if (!a || a.playParams.id === 'no-id-found' || !app.ipc.cache) return;

        if (a.playParams.id !== app.ipc.cache.playParams.id) { // If it is a new song
            a.startTime = Date.now()
            a.endTime = Number(Math.round(a.startTime + a.durationInMillis));
        } else { // If its continuing from the same song
            a.startTime = Date.now()
            a.endTime = Number(Math.round(Date.now() + a.remainingTime));
        }

        // Thumbar Buttons
        while (!app.ipc.ThumbarUpdate) {
            app.ipc.ThumbarUpdate = SetThumbarButtons(a.status)
        }

        // TrayTooltipSongName
        while (!app.ipc.TooltipUpdate) {
            app.ipc.TooltipUpdate = SetTrayTooltip(a)
        }

        // Discord Update
        while (!app.ipc.DiscordUpdate) {
            app.ipc.DiscordUpdate = UpdateActivity(a)
        }

        // Revert it All because This Runs too many times
        setTimeout(() => {
            if (app.ipc.ThumbarUpdate) app.ipc.ThumbarUpdate = false;
            if (app.ipc.TooltipUpdate) app.ipc.TooltipUpdate = false;
            if (app.ipc.DiscordUpdate) app.ipc.DiscordUpdate = false;
        }, 500) // Give at least 0.5 seconds between ThumbarUpdates/TooltipUpdates/DiscordUpdates


    });
}