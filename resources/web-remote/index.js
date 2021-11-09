// vue instance
var app = new Vue({
    el: '#app',
    data: {
        screen: "player",
        player: {
            currentMediaItem: {},
            songActions: false
        }
    },
    methods: {
        musicAppVariant() {
            if (navigator.userAgent.match(/Android/i)) {
                return "Apple Music";
            } else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
                return "Music";
            } else {               
                if (navigator.userAgent.indexOf('Mac') > 0) {
                    return 'Music';
                } else if (navigator.userAgent.indexOf('Win') > 0) {
                    return 'Apple Music Electron';
                } else {
                    return 'Apple Music Electron';
                }
            }
        },
        checkPlatform() {
            if (navigator.userAgent.match(/Android/i)) {
                return "android";
            } else if (navigator.userAgent.match(/iPhone|iPad|iPod/i)) {
                return "ios";
            } else {               
                if (navigator.userAgent.indexOf('Mac') > 0) {
                    return 'mac';
                } else if (navigator.userAgent.indexOf('Win') > 0) {
                    return 'win';
                } else {
                    return 'linux';
                }
            }
        },
        artworkPlaying() {
            if(this.player.currentMediaItem.status) {
                return
            }else{
                return ["paused"]
            }
        },
        seekTo(time) {
            console.log(time / 1000)
            socket.send(JSON.stringify({
                action: "seek",
                time: parseInt(time / 1000)
            }));
        },
        play() {
            socket.send(JSON.stringify({
                action: "play"
            }))
        },
        pause() {
            socket.send(JSON.stringify({
                action: "pause"
            }))
        },
        next() {
            socket.send(JSON.stringify({
                action: "next"
            }))
        },
        previous() {
            socket.send(JSON.stringify({
                action: "previous"
            }))
        },
        quickSearch() {
            var search = prompt("Search for a song", "")
            if(search == null || search == "") {
                return
            }

            socket.send(JSON.stringify({
                action: "quick-play",
                term: search
            }))
        },
        parseTime(value) {
            var minutes = Math.floor(value / 60000);
            var seconds = ((value % 60000) / 1000).toFixed(0);
            return minutes + ":" + (seconds < 10 ? '0' : '') + seconds;
        },
        getAlbumArtUrl() {
            if (this.player.currentMediaItem.artwork) {
                return `url("${this.player.currentMediaItem.artwork.url.replace('{w}', '600').replace('{h}', '600')}")`;
            } else {
                return "";
            }
        }
    },
});

var socket = new WebSocket('ws://localhost:6969');
socket.onopen = (e) => {
    console.log(e);
    console.log('connected');
}

socket.onclose = (e) => {
    console.log(e);
    console.log('disconnected');
}

socket.onerror = (e) => {
    console.log(e);
    console.log('error');
}

socket.onmessage = (e) => {
    const response = JSON.parse(e.data);
    switch (response.type) {
        default:

            break;
        case "playbackStateUpdate":
            app.player.currentMediaItem = response.data;
            break;
    }
    console.log(e.data);
}