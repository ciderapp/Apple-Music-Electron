// vue instance
var app = new Vue({
    el: '#app',
    data: {
        screen: "player",
        player: {
            currentMediaItem: {},
            songActions: false
        },
        search: {
            query: "",
            results: [],
            state: 0,
            tab: "all"
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
            if (this.player.currentMediaItem.status) {
                return
            } else {
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
        setVolume(volume) {
            socket.send(JSON.stringify({
                action: "volume",
                volume: volume
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
        searchArtist() {
            this.search.query = this.player.currentMediaItem.artistName;
            this.screen = "search";
            this.searchQuery();
        },
        playMediaItemById(id) {
            socket.send(JSON.stringify({
                action: "play-mediaitem",
                id: id
            }))
            this.screen = "player";
        },
        searchQuery() {
            if (this.search.query.length == 0) {
                this.search.state = 0;
                return;
            }
            this.search.state = 1;
            socket.send(JSON.stringify({
                "action": "search",
                "term": this.search.query,
                "limit": 20
            }))
        },
        quickSearch() {
            var search = prompt("Search for a song", "")
            if (search == null || search == "") {
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
        getAlbumArtUrl(size = 600) {
            if (this.player.currentMediaItem.artwork) {
                return `url("${this.player.currentMediaItem.artwork.url.replace('{w}', size).replace('{h}', size)}")`;
            } else {
                return "";
            }
        },
        getAlbumArtUrlList(url, size = 64) {
            return `url("${url.replace('{w}', size).replace('{h}', size)}")`;
        },
        searchTabClass(tab) {
            if (tab == this.search.tab) {
                return "active";
            }
        },
        canShowSearchTab(tab) {
            if (tab == this.search.tab || this.search.tab == "all") {
                return true;
            }else{
                return false;
            }
        }
    },
});

var socket = new WebSocket('ws://localhost:26369');
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
        case "searchResults":
            app.search.results = response.data;
            app.search.state = 2;
            break;
        case "playbackStateUpdate":
            app.player.currentMediaItem = response.data;
            break;
    }
    console.log(e.data);
}