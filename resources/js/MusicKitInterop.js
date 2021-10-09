// preload.js
const electron = require('electron');

let cache = {playParams: {id: 0}, status: null, remainingTime: 0},
    playbackCache = {status: null, time: Date.now()};

const MusicKitInterop = {

    init: function () {
        MusicKit.getInstance().addEventListener(MusicKit.Events.playbackStateDidChange, () => {
            if (MusicKitInterop.filterTrack(MusicKitInterop.getAttributes(), true, false)) {
                global.ipcRenderer.send('playbackStateDidChange', MusicKitInterop.getAttributes())
            }
        });

        MusicKit.getInstance().addEventListener(MusicKit.Events.nowPlayingItemDidChange, () => {
            if (MusicKitInterop.filterTrack(MusicKitInterop.getAttributes(), false, true)) {
                global.ipcRenderer.send('nowPlayingItemDidChange', MusicKitInterop.getAttributes());
                AMThemes.updateMeta()
            }
        });
    },

    getAttributes: function () {
        const nowPlayingItem = MusicKit.getInstance().nowPlayingItem;
        const isPlayingExport = MusicKit.getInstance().isPlaying;
        const remainingTimeExport = MusicKit.getInstance().currentPlaybackTimeRemaining;
        const attributes = (nowPlayingItem != null ? nowPlayingItem.attributes : {});

        attributes.status = isPlayingExport ? isPlayingExport : false;
        attributes.name = attributes.name ? attributes.name : 'No Title Found';
        attributes.artwork = attributes.artwork ? attributes.artwork : {url: ''};
        attributes.artwork.url = attributes.artwork.url ? attributes.artwork.url : '';
        attributes.playParams = attributes.playParams ? attributes.playParams : {id: 'no-id-found'};
        attributes.playParams.id = attributes.playParams.id ? attributes.playParams.id : 'no-id-found';
        attributes.albumName = attributes.albumName ? attributes.albumName : '';
        attributes.artistName = attributes.artistName ? attributes.artistName : '';
        attributes.genreNames = attributes.genreNames ? attributes.genreNames : [];
        attributes.remainingTime = remainingTimeExport ? (remainingTimeExport * 1000) : 0;
        attributes.durationInMillis = attributes.durationInMillis ? attributes.durationInMillis : 0;
        attributes.startTime = Date.now();
        attributes.endTime = Math.round((attributes.playParams.id === cache.playParams.id ? (Date.now() + attributes.remainingTime) : (attributes.startTime + attributes.durationInMillis)));
        attributes.endTime = attributes.endTime ? attributes.endTime : Date.now();
        return attributes
    },

    filterTrack: function (a, playbackCheck, mediaCheck) {
        if (a.title === "No Title Found" || a.playParams.id === "no-id-found") {
            return;
        } else if (mediaCheck && a.playParams.id === cache.playParams.id) {
            return;
        } else if (playbackCheck && a.status === playbackCache.status) {
            return;
        } else if (playbackCheck && !a.status && a.remainingTime === playbackCache.time) { /* Pretty much have to do this to prevent multiple runs when a song starts playing */
            return;
        }
        cache = a;
        if (playbackCheck) playbackCache = {status: a.status, time: a.remainingTime};
        return true;
    }

}

process.once('loaded', () => {
    global.ipcRenderer = electron.ipcRenderer;
    global.MusicKitInterop = MusicKitInterop;
});

// MusicKit.getInstance().addEventListener( MusicKit.Events.queueItemsDidChange,logIt );
// MusicKit.getInstance().addEventListener( MusicKit.Events.queuePositionDidChange, logIt );