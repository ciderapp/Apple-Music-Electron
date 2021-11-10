var socket;

// vue instance
var app = new Vue({
    el: '#app',
    data: {
        screen: "player",
        player: {
            currentMediaItem: {},
            songActions: false,
            lyrics: {},
            lyricsMediaItem: {}
        },
        search: {
            query: "",
            results: [],
            state: 0,
            tab: "all",
            searchType: "applemusic",
            trackSelect: false,
            selected: {}
        },
        connectedState: 0
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
        trackSelect(song) {
            this.search.selected = song;
            this.search.trackSelect = true
        },
        clearSelectedTrack() {
            this.search.selected = {}
            this.search.trackSelect = false
        },
        getArtworkColor(hex) {
            return `#${hex}`
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
            var actionType = "search"
            if(this.search.searchType == "library") {
                actionType = "library-search"
            }
            socket.send(JSON.stringify({
                "action": actionType,
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
        parseTimeDecimal(value) {
            var minutes = Math.floor(value / 60000);
            var seconds = ((value % 60000) / 1000).toFixed(0);
            return minutes + "." + (seconds < 10 ? '0' : '') + seconds;
        },
        hmsToSecondsOnly(str) {
            var p = str.split(':'),
                s = 0,
                m = 1;

            while (p.length > 0) {
                s += m * parseInt(p.pop(), 10);
                m *= 60;
            }

            return s;
        },
        getLyricClass(start, end) {
            var currentTime = parseFloat(this.hmsToSecondsOnly(this.parseTime(this.player.currentMediaItem.durationInMillis - this.player.currentMediaItem.remainingTime)));
            start = parseFloat(this.hmsToSecondsOnly(start))
            end = parseFloat(this.hmsToSecondsOnly(end))

            console.log(`current: ${currentTime}\nstart: ${start}\nend: ${end}`);
            // check if currenttime is between start and end
            if (currentTime >= start && currentTime <= end) {
                setTimeout(()=>{
                    if(document.querySelector(".lyric-line.active")) {
                        document.querySelector(".lyric-line.active").scrollIntoView({behavior: "smooth"})
                    }
                }, 200)
                return "active"
            } else {
                return ""
            }

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
        searchTypeClass(type) {
            if (type == this.search.searchType) {
                return "active";
            }
        },
        showLyrics() {
            socket.send(JSON.stringify({
                action: "get-lyrics",
            }))
            this.parseLyrics()
            this.screen = "lyrics"
        },
        parseLyrics() {
            var xml = this.stringToXml(this.player.lyricsMediaItem.ttml)
            var json = xmlToJson(xml);
            this.player.lyrics = json
        },
        stringToXml(st) {
            // string to xml
            var xml = (new DOMParser()).parseFromString(st, "text/xml");
            return xml;
        },
        canShowSearchTab(tab) {
            if (tab == this.search.tab || this.search.tab == "all") {
                return true;
            } else {
                return false;
            }
        },
        connect() {
            let self = this;
            this.connectedState = 0;
            socket = new WebSocket('ws://localhost:26369');
            socket.onopen = (e) => {
                console.log(e);
                console.log('connected');
                app.connectedState = 1;
            }

            socket.onclose = (e) => {
                console.log(e);
                console.log('disconnected');
                app.connectedState = 2;
            }

            socket.onerror = (e) => {
                console.log(e);
                console.log('error');
                app.connectedState = 2;
            }

            socket.onmessage = (e) => {
                const response = JSON.parse(e.data);
                switch (response.type) {
                    default:

                        break;
                    case "lyrics":
                        self.player.lyricsMediaItem = response.data;
                        break;
                    case "searchResultsLibrary":
                        self.search.results = response.data;
                        self.search.state = 2;
                    break;
                    case "searchResults":
                        self.search.results = response.data;
                        self.search.state = 2;
                        break;
                    case "playbackStateUpdate":
                        self.player.currentMediaItem = response.data;
                        break;
                }
                console.log(e.data);
            }
        }
    },
});

function xmlToJson(xml) {

    // Create the return object
    var obj = {};

    if (xml.nodeType == 1) { // element
        // do attributes
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType == 3) { // text
        obj = xml.nodeValue;
    }

    // do children
    if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof (obj[nodeName]) == "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof (obj[nodeName].push) == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }
    return obj;
};

app.connect()