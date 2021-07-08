const {app} = require('electron')

exports.HandleMediaState = function () {
    console.log('[Mpris] [HandleMediaState] Started.')

    if (!app.mpris || process.platform !== "linux") return;

    app.mpris.on('playpause', async () => {
        if (app.mpris.playbackStatus === 'Playing') {
            await app.win.webContents.executeJavaScript('MusicKit.getInstance().pause()')
        } else {
            await app.win.webContents.executeJavaScript('MusicKit.getInstance().play()')
        }
    });

    app.mpris.on('play', async () => {
        await app.win.webContents.executeJavaScript('MusicKit.getInstance().play()')
    });

    app.mpris.on('pause', async () => {
        await app.win.webContents.executeJavaScript('MusicKit.getInstance().pause()')
    });

    app.mpris.on('next', async () => {
        await app.win.webContents.executeJavaScript('MusicKit.getInstance().skipToNextItem()')
    });

    app.mpris.on('previous', async () => {
        await app.win.webContents.executeJavaScript('MusicKit.getInstance().skipToPreviousItem()')
    });


}