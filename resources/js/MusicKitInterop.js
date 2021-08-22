// preload.js
const electron = require('electron');

let CachedAttributes = {playParams: {id: 0}};
let CachedTime = null;
let CachedStatus = null;
const MusicKitInterop = {

    init: function () {
        MusicKit.getInstance().addEventListener(MusicKit.Events.playbackStateDidChange, () => {
            if (MusicKitInterop.getAttributes().title !== "No Title Found" && MusicKitInterop.getAttributes().playParams.id !== "no-id-found" && CachedStatus !== MusicKit.getInstance().isPlaying) {
                if (((MusicKit.getInstance().isPlaying === false) && CachedTime !== MusicKit.getInstance().currentPlaybackTimeRemaining) || (MusicKit.getInstance().isPlaying === true && CachedTime === MusicKit.getInstance().currentPlaybackTimeRemaining)) {
                    console.log(`[MusicKitInterop] Sending playbackStateDidChange (${MusicKit.getInstance().isPlaying ? 'Is Playing' : 'Is not Playing'})`)
                    global.ipcRenderer.send('playbackStateDidChange', MusicKitInterop.getAttributes())
                }
            }
            CachedTime = MusicKit.getInstance().currentPlaybackTimeRemaining;
            CachedStatus = MusicKit.getInstance().isPlaying;
        });

        MusicKit.getInstance().addEventListener(MusicKit.Events.mediaItemStateDidChange, () => {
            if (MusicKitInterop.getAttributes().title !== "No Title Found" && MusicKitInterop.getAttributes().playParams.id !== "no-id-found") {
                if (CachedAttributes.playParams.id !== MusicKitInterop.getAttributes().playParams.id) {
                    console.log('[MusicKitInterop] Sending mediaItemStateDidChange')
                    global.ipcRenderer.send('mediaItemStateDidChange', MusicKitInterop.getAttributes())
                }
            }
            CachedAttributes = MusicKitInterop.getAttributes();
        });
    },

    getAttributes: function () {
        let nowPlayingItem = MusicKit.getInstance().nowPlayingItem;
        let isPlayingExport = MusicKit.getInstance().isPlaying;
        let remainingTimeExport = MusicKit.getInstance().currentPlaybackTimeRemaining;
        let attributes = {};

        if (nowPlayingItem != null) {
            attributes = nowPlayingItem.attributes;
        }
        attributes.remainingTime = remainingTimeExport ? remainingTimeExport : 0;
        attributes.status = isPlayingExport ? isPlayingExport : false;
        attributes.name = attributes.name ? attributes.name : 'No Title Found';
        attributes.durationInMillis = attributes.durationInMillis ? attributes.durationInMillis : 0;
        attributes.artwork = attributes.artwork ? attributes.artwork : {url: ''};
        attributes.artwork.url = attributes.artwork.url ? attributes.artwork.url : '';
        attributes.playParams = attributes.playParams ? attributes.playParams : {id: 'no-id-found'};
        attributes.playParams.id = attributes.playParams.id ? attributes.playParams.id : 'no-id-found';
        attributes.albumName = attributes.albumName ? attributes.albumName : '';
        attributes.artistName = attributes.artistName ? attributes.artistName : '';
        attributes.genreNames = attributes.genreNames ? attributes.genreNames : [];
        attributes.remainingTime = attributes.remainingTime * 1000;
        return attributes
    }

}

process.once('loaded', () => {
    global.ipcRenderer = electron.ipcRenderer;
    global.MusicKitInterop = MusicKitInterop;


});
// MusicKit.getInstance().addEventListener( MusicKit.Events.queueItemsDidChange,logIt );
// MusicKit.getInstance().addEventListener( MusicKit.Events.queuePositionDidChange, logIt );