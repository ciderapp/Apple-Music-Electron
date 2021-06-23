const {app} = require('electron')
const {HandleMediaState} = require('./HandleMediaState')

exports.InitializeMpris = function () {
    console.log('[Mpris] [InitializeMpris] Started.')

    let Mpris;
    try {
        Mpris = require('mpris-service');
    } catch {
        app.config.preferences.mprisSupport = false
    }

    if (!app.config.preferences.mprisSupport || process.platform !== "linux" || !Mpris) return;

    console.log('[MPRIS] Initializing Connection...')

    app.mpris = Mpris({
        name: 'AppleMusicElectron',
        identity: 'Apple Music Electron',
        supportedUriSchemes: [],
        supportedMimeTypes: [],
        supportedInterfaces: ['player']
    });

    let pos_atr = {durationInMillis: 0};

    app.mpris.getPosition = function () {
        const durationInMicro = pos_atr.durationInMillis * 1000;
        const percentage = parseFloat(0) || 0;
        return durationInMicro * percentage;
    }

    app.mpris.canQuit = true;
    app.mpris.canControl = true;
    app.mpris.canPause = true;
    app.mpris.canPlay = true;
    app.mpris.canGoNext = true;
    app.mpris.metadata = {'mpris:trackid': '/org/mpris/MediaPlayer2/TrackList/NoTrack'}
    app.mpris.playbackStatus = 'Stopped'

    HandleMediaState()
}