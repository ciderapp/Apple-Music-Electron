const {app} = require('electron')
const mprisService = require('mpris-service');
const {Analytics} = require("../analytics/sentry");
Analytics.init()

module.exports = {
    connect: function () {
        if (process.platform !== "linux") {
            app.mpris.active = false;
            return;
        }
        console.log('[MPRIS][connect] Initializing Connection.')

        try {
            app.mpris.service = mprisService({
                name: 'AppleMusic',
                identity: 'Apple Music',
                supportedUriSchemes: [],
                supportedMimeTypes: [],
                supportedInterfaces: ['player']
            });
        } catch(err) {
            console.error(`[MPRIS][connect] ${err}`)
        }

        let pos_atr = {durationInMillis: 0};
        app.mpris.service.getPosition = function () {
            const durationInMicro = pos_atr.durationInMillis * 1000;
            const percentage = parseFloat(0) || 0;
            return durationInMicro * percentage;
        }

        app.mpris.active = true

        this.clearActivity()
        this.stateHandler()
    },

    stateHandler: function () {
        app.mpris.service.on('playpause', async () => {
            if (app.mpris.service.playbackStatus === 'Playing') {
                await app.win.webContents.executeJavaScript('MusicKit.getInstance().pause()')
            } else {
                await app.win.webContents.executeJavaScript('MusicKit.getInstance().play()')
            }
        });

        app.mpris.service.on('play', async () => {
            await app.win.webContents.executeJavaScript('MusicKit.getInstance().play()')
        });

        app.mpris.service.on('pause', async () => {
            await app.win.webContents.executeJavaScript('MusicKit.getInstance().pause()')
        });

        app.mpris.service.on('next', async () => {
            await app.win.webContents.executeJavaScript('MusicKit.getInstance().skipToNextItem()')
        });

        app.mpris.service.on('previous', async () => {
            await app.win.webContents.executeJavaScript('MusicKit.getInstance().skipToPreviousItem()')
        });
    },

    updateActivity: function (attributes) {
        if (!app.mpris.active) return;
        console.log('[MPRIS][updateActivity] Updating Song Activity.')

        const MetaData = {
            'mpris:trackid': app.mpris.service.objectPath(`track/${attributes.playParams.id.replace(/[.]+/g, "")}`),
            'mpris:length': attributes.durationInMillis * 1000, // In microseconds
            'mpris:artUrl': (attributes.artwork.url.replace('/{w}x{h}bb', '/35x35bb')).replace('/2000x2000bb', '/35x35bb'),
            'xesam:title': `${attributes.name}`,
            'xesam:album': `${attributes.albumName}`,
            'xesam:artist': [`${attributes.artistName}`,],
            'xesam:genre': attributes.genreNames
        }

        if (app.mpris.service.metadata["mpris:trackid"] === MetaData["mpris:trackid"]) {
            return
        }

        app.mpris.service.metadata = MetaData
    },

    updateState: function (attributes) {
        if (!app.mpris.active) return;
        console.log('[MPRIS][updateState] Updating Song Playback State.')

        function setPlaybackIfNeeded(status) {
            if (app.mpris.service.playbackStatus === status) {
                return
            }
            app.mpris.service.playbackStatus = status;
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
    },

    clearActivity: function () {
        if (!app.mpris.active) return;
        app.mpris.service.metadata = {'mpris:trackid': '/org/mpris/MediaPlayer2/TrackList/NoTrack'}
        app.mpris.service.playbackStatus = 'Stopped';
    },
}