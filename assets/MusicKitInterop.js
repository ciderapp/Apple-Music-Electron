// preload.js
const electron = require('electron');

const MusicKitInterop = {

    init: function (){
        MusicKit.getInstance().addEventListener( MusicKit.Events.playbackStateDidChange, (a) => {
            global.ipcRenderer.send('playbackStateDidChange', a.state)

        });
        MusicKit.getInstance().addEventListener( MusicKit.Events.mediaItemStateDidChange, () => {
            global.ipcRenderer.send('mediaItemStateDidChange', MusicKitInterop.getAttributes())

        });
    },

    getAttributes: function() {
        let nowPlayingItem =  MusicKit.getInstance().nowPlayingItem;
        let isplaying = MusicKit.getInstance().isPlaying;
        let remainingTimeexport = MusicKit.getInstance().currentPlaybackTimeRemaining
        let attributes  = {};

        if (nowPlayingItem != null){
           attributes = nowPlayingItem.attributes;
        }
        attributes.remainingTime = remainingTimeexport ? remainingTimeexport : 0;
        attributes.status = isplaying ? isplaying : false;
        attributes.name = attributes.name ? attributes.name : 'No Title Found';
        attributes.durationInMillis = attributes.durationInMillis ? attributes.durationInMillis : 0;
        attributes.artwork = attributes.artwork ? attributes.artwork : {url: ''};
        attributes.artwork.url = attributes.artwork.url ? attributes.artwork.url : '';
        attributes.playParams = attributes.playParams ? attributes.playParams : {id: 'no-id-found'};
        attributes.playParams.id = attributes.playParams.id ? attributes.playParams.id : 'no-id-found';
        attributes.albumName = attributes.albumName ? attributes.albumName : '';
        attributes.artistName = attributes.artistName ? attributes.artistName : '';
        attributes.genreNames = attributes.genreNames ? attributes.genreNames : [];
        return attributes
    }

}

process.once('loaded', () => {
    global.ipcRenderer = electron.ipcRenderer;
    global.MusicKitInterop = MusicKitInterop;
});








// MusicKit.getInstance().addEventListener( MusicKit.Events.queueItemsDidChange,logIt );
// MusicKit.getInstance().addEventListener( MusicKit.Events.queuePositionDidChange, logIt );
