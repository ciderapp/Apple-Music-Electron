const {app} = require('electron')

exports.UpdatePlaybackStatus = function (attributes) {
    console.log('[Mpris] [UpdatePlaybackStatus] Started.')

    if (!app.config.preferences.mprisSupport || !app.mpris || process.platform !== "linux") return;

    function setPlaybackIfNeeded(status) {
        if (app.mpris.playbackStatus === status) {
            return
        }
        app.mpris.playbackStatus = status;
    }

    switch (attributes.status) {
        case true: // Playing
            setPlaybackIfNeeded('Playing');
            break;
        case false: // Paused
            setPlaybackIfNeeded('Paused');
            break;
        default: // Stopped
            setPlaybackIfNeeded('Stopped');
            break;
    }


}