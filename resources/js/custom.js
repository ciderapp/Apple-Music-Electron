try {
    const preferences = ipcRenderer.sendSync('getPreferences');
    function GetXPath(path) {
        return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    /* Create the miniPlayer Functions */
    if (typeof _miniPlayer == "undefined") {
        var _miniPlayer = {
            active: false,
            init() {
                let self = this;
                const webChrome = document.querySelector(".web-chrome");
                const elements = {
                    artwork: document.createElement("div"),
                    webNavContainer: document.querySelector("#web-navigation-container"),
                    menuicon: document.querySelector(".menuicon")
                };
                elements.artwork.classList.add("miniPlayerArtwork");
                elements.artwork.style.display = "none";
                elements.artwork.addEventListener("contextmenu", () => {
                    ipcRenderer.send("show-miniplayer-menu");
                });
                elements.artwork.addEventListener("click", () => {
                    if (webChrome.style.display === "") {
                        webChrome.style.display = "flex";
                    } else {
                        webChrome.style.display = "";
                    }
                });
                document.querySelector("#web-main").appendChild(elements.artwork);
                if (window.innerWidth < 500) {
                    /* Resize if window was closed in Mini Player */
                    ipcRenderer.send("resize-window", 1024, 600);
                }
            },
            setMiniPlayer(val) {
                const webChrome = document.querySelector(".web-chrome");
                const artwork = document.querySelector(".miniPlayerArtwork");
                if (val) {
                    self.active = true;
                    document.body.setAttribute("data-miniplayer", 1);
                    artwork.style.display = "block";
                } else {
                    self.active = false;
                    webChrome.style.display = "";
                    document.body.removeAttribute("data-miniplayer");
                    artwork.style.display = "none";
                }
            }
        };
    }

    /* Lyrics Functions */
    if (typeof _lyrics == "undefined") {
        var _lyrics = {
            CreateButton: () => {
                /* Lyrics Button */
                if (!document.querySelector('#lyricsButton') && GetXPath('/html/body/div[4]/div/div[3]/div/div[3]')) {
                    const lyricsButton = document.createElement("div");
                    lyricsButton.style.height = "22px";
                    lyricsButton.style.width = "22px";
                    lyricsButton.style.marginInlineEnd = "0px";
                    lyricsButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="22" viewBox="0 0 28 28" id="vector"><path id="path" d="M 14.4 12.2 C 14.4 11.1 15.2 10.3 16.4 10.3 C 17.7 10.3 18.5 11.3 18.5 12.7 C 18.5 14.7 16.8 15.9 15.8 15.9 C 15.5 15.9 15.3 15.7 15.3 15.5 C 15.3 15.3 15.4 15.1 15.7 15.1 C 16.5 14.9 17.1 14.4 17.4 13.7 L 17.2 13.7 C 17 14 16.6 14.1 16.1 14.1 C 15.1 14 14.4 13.2 14.4 12.2 Z M 9.5 12.2 C 9.5 11.1 10.3 10.3 11.5 10.3 C 12.8 10.3 13.6 11.3 13.6 12.7 C 13.6 14.7 11.9 15.9 10.9 15.9 C 10.6 15.9 10.4 15.7 10.4 15.5 C 10.4 15.3 10.5 15.1 10.8 15.1 C 11.6 14.9 12.3 14.4 12.5 13.7 L 12.3 13.7 C 12.1 14 11.7 14.1 11.2 14.1 C 10.2 14 9.5 13.2 9.5 12.2 Z M 10.4 21.4 L 13.2 18.7 C 13.8 18.1 14.1 18 14.8 18 L 19.4 18 C 20.7 18 21.5 17.2 21.5 15.9 L 21.5 9.4 C 21.5 8 20.7 7.3 19.4 7.3 L 8.5 7.3 C 7.2 7.3 6.4 8 6.4 9.4 L 6.4 15.9 C 6.4 17.2 7.2 18 8.5 18 L 9.5 18 C 10.1 18 10.4 18.3 10.4 18.9 L 10.4 21.4 Z M 9.9 24 C 9 24 8.4 23.4 8.4 22.4 L 8.4 20.4 L 7.9 20.4 C 5.4 20.3 4 19 4 16.5 L 4 9 C 4 6.5 5.5 5 8.1 5 L 19.9 5 C 22.5 5 24 6.4 24 9 L 24 16.6 C 24 19.1 22.5 20.4 19.9 20.4 L 14.8 20.4 L 11.7 23.1 C 11 23.7 10.5 24 9.9 24 Z" /></svg>`;
                    lyricsButton.id = "lyricsButton";
                    lyricsButton.className = "web-chrome-playback-controls__platter-toggle-buttons web-chrome-playback-controls__meta-btn";
                    GetXPath('/html/body/div[4]/div/div[3]/div/div[3]').insertBefore(lyricsButton, GetXPath('/html/body/div[4]/div/div[3]/div/div[3]').childNodes[4]);
                }

                /* Lyrics Button Click Event Handling */
                if (document.querySelector("#lyricsButton") && GetXPath("/html/body/div[4]/div[3]/div[3]/div/div[3]/div[3]/button")) {

                    function openLyrics() {
                        document.body.classList.add("web-chrome-drawer-open");
                        document.body.classList.remove("web-chrome-drawer-opening");
                        document.querySelector('.web-chrome-drawer').style.backgroundColor = "var(--systemToolbarTitlebarMaterialSover-inactive)";
                        document.querySelector('.web-chrome-drawer').removeEventListener('animationend', openLyrics, true);
                        document.querySelector('#lyricsButton').style.fill = 'var(--playerPlatterButtonIconFill)';
                        document.querySelector('#lyricsButton').style.boxShadow = '0 1px 1px rgb(0 0 0 / 10%)';
                        document.querySelector('#lyricsButton').style.background = 'var(--playerPlatterButtonBGFill)';
                    }

                    function closeLyrics() {
                        document.body.classList.remove("web-chrome-drawer-open");
                        document.body.classList.remove("web-chrome-drawer-closing");
                        document.querySelector('.web-chrome-drawer').style.backgroundColor = "";
                        document.querySelector('.web-chrome-drawer').removeEventListener('animationend', closeLyrics, true);
                        document.querySelector('#lyricsButton').style.fill = 'var(--systemSecondary)';
                        document.querySelector('#lyricsButton').style.boxShadow = 'none';
                        document.querySelector('#lyricsButton').style.background = '0 0';
                    }

                    document.getElementById("lyricsButton").addEventListener('click', function () {
                        if (document.querySelector('.web-chrome-drawer').querySelector('.web-navigation__up-next.web-chrome-up-next.up-next') == null) {

                            if (document.getElementsByClassName("web-chrome-drawer-open").length === 0) {
                                document.querySelector('.web-chrome-drawer').addEventListener('animationend', openLyrics, true);
                                document.body.classList.add("web-chrome-drawer-opening");
                            } else {
                                document.querySelector('.web-chrome-drawer').addEventListener('animationend', closeLyrics, true);
                                document.body.classList.add("web-chrome-drawer-closing");
                            }
                        } else {
                            try {
                                /* Checks for clicks on the up next sidebar toggle button */
                                if (GetXPath("/html/body/div[4]/div[3]/div[3]/div/div[3]/div[3]/button").classList.contains('active')) {
                                    GetXPath("/html/body/div[4]/div[3]/div[3]/div/div[3]/div[3]/button").click();
                                    document.querySelector('.web-chrome-drawer').addEventListener('animationend', openLyrics, true);
                                    document.body.classList.add("web-chrome-drawer-opening");
                                } else {
                                    document.querySelector('.web-chrome-drawer').style.backgroundColor = "";
                                    document.querySelector('.web-chrome-drawer').removeEventListener('animationend', openLyrics, true);
                                    document.querySelector('.web-chrome-drawer').removeEventListener('animationend', closeLyrics, true);
                                }
                            } catch (e) {
                                console.error(e)
                            }
                        }
                        if (!document.getElementById("lyricer")) {

                            const sidebar = GetXPath("/html/body/div[4]/div[3]/div[1]");
                            if (sidebar) {
                                sidebar.innerHTML = `<div id="lyricer"></div>`;
                            }

                            let text = "";
                            let lrc = new Lyricer();
                            ipcRenderer.on('truelyrics', function (event, lrcfile) {
                                if (lrcfile.startsWith("netease=")) {
                                    ipcRenderer.send('NetEaseLyricsHandler', lrcfile);
                                } else {
                                    lrc.setLrc(lrcfile);
                                }
                            });
                            ipcRenderer.on('ProgressTimeUpdate', function (event, data) {
                                if (data < 0) {
                                    data = 0
                                }
                                lrc.move(data);
                            });


                            lrc.setLrc(text);
                            document.addEventListener("lyricerclick", function (e) {
                                ipcRenderer.send('ProgressTimeUpdateFromLyrics', e.detail.time);
                                console.log('clicked on ' + e.detail.time);
                                document.body.setAttribute("background-color", `var(--systemToolbarTitlebarMaterialSover-inactive)`);
                            });

                            _lyrics.GetLyrics(2);
                        }
                    }, false);


                    GetXPath("/html/body/div[4]/div[3]/div[3]/div/div[3]/div[3]/button").addEventListener('click', function () {
                        if (document.querySelector('#lyricsButton').style.fill === "var(--playerPlatterButtonIconFill)") {
                            document.querySelector('#lyricsButton').style.fill = 'var(--systemSecondary)';
                            document.querySelector('#lyricsButton').style.boxShadow = 'none';
                            document.querySelector('#lyricsButton').style.background = '0 0';
                        }
                    }, false);
                }
            },

            GetLyrics: (mode) => {
                const musicKit = MusicKit.getInstance();
                const trackName = encodeURIComponent(MusicKitInterop.getAttributes()["name"]);
                const artistName = encodeURIComponent(MusicKitInterop.getAttributes()["artistName"]);
                const duration = encodeURIComponent(Math.round(MusicKitInterop.getAttributes()["durationInMillis"] / 1000));
                const songID = (musicKit.nowPlayingItem != null) ? musicKit.nowPlayingItem["_songId"] ?? -1 : -1;

                if (songID !== -1) {

                    MusicKit.getInstance().api.lyric(songID)
                        .then(function (response) {
                                const ttmlLyrics = response["ttml"];
                                let lyrics = "";
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(ttmlLyrics, "text/xml");
                                const lyricsLines = doc.getElementsByTagName('p');
                                for (let element of lyricsLines) {
                                    var rawTime = element.getAttribute('begin').match(/(\d+:)?(\d+:)?(\d+)?(\.\d+)/);
                                    var hours = (rawTime[2] != null) ? (rawTime[1].replace(":", "")) : "0";
                                    var minutes =
                                        (rawTime[2] != null) ? (hours * 60 + rawTime[2].replace(":", "") * 1 + ":") : ((rawTime[1] != null) ? rawTime[1] : "00:")
                                    ;
                                    var seconds = (rawTime[3] != null) ? (rawTime[3]) : "00";
                                    var milliseconds = (rawTime[4] != null) ? (rawTime[4]) : ".000";
                                    var lrcTime = minutes + seconds + milliseconds;
                                    lyrics = lyrics.concat(`[${lrcTime}]${element.textContent}` + "\r\n");
                                }
                                console.log("AM lyrics:" + lyrics);
                                let artworkURL = (MusicKitInterop.getAttributes()["artwork"]["url"]).replace("{w}", 256).replace("{h}", 256);
                                if (artworkURL == null) {
                                    artworkURL = "https://beta.music.apple.com/assets/product/MissingArtworkMusic.svg";
                                }
                                if (mode === 1) {
                                    ipcRenderer.send('LyricsUpdate', lyrics, artworkURL);
                                } else {
                                    console.log(lyrics);
                                    ipcRenderer.send('LyricsHandler', lyrics, artworkURL);
                                }
                            }
                        ).catch((_error) => {
                            let artworkURL = (MusicKitInterop.getAttributes()["artwork"]["url"]).replace("{w}", 256).replace("{h}", 256);
                            if (artworkURL == null) {
                                artworkURL = "https://beta.music.apple.com/assets/product/MissingArtworkMusic.svg";
                            }
                            if (mode === 1) {
                                ipcRenderer.send('LyricsUpdate', "netease=" + trackName + " " + artistName, artworkURL);
                            } else {
                                ipcRenderer.send('LyricsHandler', "netease=" + trackName + " " + artistName, artworkURL);
                            }
                        }
                    );

                } else {
                    try {
                        MusicKit.getInstance().api.library.song(MusicKit.getInstance().nowPlayingItem.id).then((data) => {
                            if (data != null && data !== "") {
                                artworkURL = data["artwork"]["url"];
                            } else {
                                artworkURL = "https://beta.music.apple.com/assets/product/MissingArtworkMusic.svg";
                            }
                            if (mode === 1) {
                                ipcRenderer.send('LyricsUpdate', "netease=" + trackName + " " + artistName, artworkURL);
                            } else {
                                ipcRenderer.send('LyricsHandler', "netease=" + trackName + " " + artistName, artworkURL);
                            }
                        });
                    } catch (e) {
                        console.error(e)
                    }
                }
            }
        }
    }

    /* Create the AMThemes Functions */
    if (typeof AMThemes == "undefined") {
        var AMThemes = {
            _styleSheets: {
                Transparency: new CSSStyleSheet(),
                Theme: new CSSStyleSheet(),
                Meta: new CSSStyleSheet(),
            },
            loadTheme(path = "") {
                console.warn("[Custom] Applied Theme");
                let self = this;
                if (path === "" || path === " ") {
                    self._styleSheets.Theme.replaceSync("");
                    self.refresh();
                    return;
                }
                const xhttp = new XMLHttpRequest();
                xhttp.onload = function () {
                    self._styleSheets.Theme.replaceSync(this.responseText);
                    self.refresh();
                };
                xhttp.open("GET", `themes://${path}.css`, true);
                xhttp.send();
            },
            updateMeta() {
                console.warn("[Custom] Refreshed Meta CSS");
                /** Exposes artwork and other metadata to CSS for themes */
                const musicKit = MusicKit.getInstance();
                let artwork = musicKit.nowPlayingItem["attributes"]["artwork"]["url"];
                /* Fix Itunes Match album arts not showing */
                if (artwork === '' || !artwork) {
                    try {
                        musicKit.api.library.song(musicKit.nowPlayingItem.id).then((data) => {
                            if (data !== "") {
                                artwork = data["artwork"]["url"];
                                document.querySelector('#ember13').getElementsByTagName('img')[0].src = artwork;
                                this._styleSheets.Meta.replaceSync(`
                                    :root {
                                        --musicKit-artwork-64: url("${artwork.replace("{w}", 64).replace("{h}", 64)}");
                                        --musicKit-artwork-256: url("${artwork.replace("{w}", 256).replace("{h}", 256)}");
                                        --musicKit-artwork-512: url("${artwork.replace("{w}", 512).replace("{h}", 512)}");
                                        --musicKit-artwork: url("${artwork.replace("{w}", 2000).replace("{h}", 2000)}");
                                    }
                                `);
                                this.refresh();
                            }
                        });
                    } catch (e) {
                        console.error(e);
                    }
                }

                this._styleSheets.Meta.replaceSync(`
                :root {
                    --musicKit-artwork-64: url("${artwork.replace("{w}", 64).replace("{h}", 64)}");
                    --musicKit-artwork-256: url("${artwork.replace("{w}", 256).replace("{h}", 256)}");
                    --musicKit-artwork-512: url("${artwork.replace("{w}", 512).replace("{h}", 512)}");
                    --musicKit-artwork: url("${artwork.replace("{w}", 2000).replace("{h}", 2000)}");
                }
            `);
                this.refresh();
            },
            setTransparency(val) {
                let self = this;
                if (val) {
                    const xhttp = new XMLHttpRequest();
                    xhttp.onload = function () {
                        self._styleSheets.Transparency.replaceSync(this.responseText);
                        self.refresh();
                    };
                    xhttp.open("GET", `ameres://css/transparency.css`, true);
                    xhttp.send();
                } else {
                    self._styleSheets.Transparency.replaceSync(`html body { background-color: var(--pageBG) !important; }`);
                }
            },
            refresh() {
                console.warn("[Custom] Refresh");
                document.adoptedStyleSheets = Object.values(this._styleSheets);
            }
        };
    }

    /* Bulk AME JavaScript Functions */
    if (typeof AMJavaScript == "undefined") {
        var AMJavaScript = {
            LoadCustomStartup: () => {
                /* MiniPlayer Event Listener */
                MusicKit.getInstance().addEventListener(MusicKit.Events.mediaElementCreated, () => {
                    if (!document.querySelector('.media-artwork-v2__image').classList.contains('media-artwork-v2__image--fallback')) {
                        const artwork = document.querySelector('#ember13');
                        artwork.onclick = function () {
                            ipcRenderer.send("set-miniplayer", true);
                        };
                        /* Picture-in-picture icon should be overlayed over artwork when mouse over */
                    }
                });

                /* Audio Quality Selector */
                if (preferences.audio.audioQuality === 'auto') {
                    if (preferences.advanced.verboseLogging.includes(true)) console.log("[JS] AudioQuality set to auto, dynamically setting bitrate between 64 and 256.");
                } else if (preferences.audio.audioQuality === 'extreme') {
                    if (preferences.advanced.verboseLogging.includes(true)) console.log("[JS] AudioQuality set to extreme, forcing bitrate to 990..");
                    MusicKit.PlaybackBitrate = 990;
                    MusicKit.getInstance().bitrate = 990;
                } else if (preferences.audio.audioQuality === 'high') {
                    if (preferences.advanced.verboseLogging.includes(true)) console.log("[JS] AudioQuality set to high, forcing bitrate to 256.");
                    MusicKit.PlaybackBitrate = 256;
                    MusicKit.getInstance().bitrate = 256;
                } else if (preferences.audio.audioQuality === 'standard') {
                    if (preferences.advanced.verboseLogging.includes(true)) console.log("[JS] AudioQuality set to standard, forcing bitrate to 64.");
                    MusicKit.PlaybackBitrate = 64;
                    MusicKit.getInstance().bitrate = 64;
                }

                /* Gapless Playback */
                if (preferences.audio.gaplessEnabled.includes(true)) {
                    if (preferences.advanced.verboseLogging.includes(true)) console.log("[JS] Gapless Playback enabled, songs will now preload before ending reducing load times.");
                    MusicKit.getInstance()._bag.features["enable-gapless"] = true;
                }

                /* Incognito Mode */
                if (preferences.general.incognitoMode.includes(true)) {
                    MusicKit.privateEnabled = true
                }

                /* Event Listener for Lyrics Update */
                MusicKit.getInstance().addEventListener(MusicKit.Events.playbackTimeDidChange, function () {
                    ipcRenderer.send('LyricsTimeUpdate', MusicKit.getInstance().currentPlaybackTime + 0.250);
                });
                MusicKit.getInstance().addEventListener(MusicKit.Events.nowPlayingItemDidChange, function () {
                    try {
                        GetXPath("/html/body/div[4]/div[3]/div[3]/div/div[2]/div[1]/img").src = "https://music.apple.com/assets/product/MissingArtworkMusic.svg";
                    } catch (e) {
                    }
                    try {
                        let lrc = new Lyricer();
                        lrc.setLrc("");
                        lrc = null;
                    } catch (e) {
                        console.error(e)
                    }
                    _lyrics.GetLyrics(1);
                });

                /* Mutation Observer to disable "seek error" alert */
                let observer = new MutationObserver(function (mutationList) {
                    for (const mutation of mutationList) {
                        for (const child of mutation.addedNodes) {
                            try {
                                if (document.getElementById("mk-dialog-title").textContent === "cancelled") {
                                    document.getElementById("musickit-dialog").remove();
                                    document.getElementById("musickit-dialog-scrim").remove();
                                    break;
                                }
                            } catch (e) {
                                break;
                            }
                        }
                    }

                });
                observer.observe(document.body, {childList: true});

                /* Load Themes and Transparency */
                AMThemes.loadTheme(preferences["visual"]["theme"]);
                if (preferences["visual"]["transparencyEffect"] !== "") {
                    AMThemes.setTransparency(true);
                }

            },

            LoadCustom: () => {
                /* Execute plugins OnNavigation */
                if (typeof _plugins != "undefined") {
                    _plugins.execute("OnNavigation");
                }

                /* Remove the Region Banner */
                while (document.getElementsByClassName('locale-switcher-banner').length > 0) {
                    document.getElementsByClassName('locale-switcher-banner')[0].remove()
                }

                /* Create the Custom Settings Context Menu */
                const buttonPath = (preferences.visual.frameType === 'mac-right' ? '//*[@id="web-main"]/div[4]/div/div[3]/div[3]/button' : '//*[@id="web-main"]/div[3]/div/div[3]/div[3]/button');
                if (GetXPath(buttonPath)) {
                    GetXPath(buttonPath).addEventListener('click', function () {
                        if (document.querySelector('.context-menu__option--app-settings')) {
                            if (preferences.advanced.verboseLogging.includes(true)) console.log("[settingsInit] Preventing second button.");
                            return;
                        }

                        const ul = GetXPath("/html/body/div[6]/ul");

                        const amPreferencesNew = GetXPath('/html/body/div[6]/ul/li[2]');
                        GetXPath('/html/body/div[6]/ul/li[2]/span/span').innerHTML = 'Preferences (New)';
                        ul.insertBefore(amPreferencesNew, ul.childNodes[9]);

                        /* GetXPath('/html/body/div[6]/ul/li[2]').remove(); */
                        const amSettings = document.createElement("li");
                        amSettings.innerHTML = `
                            <span class="context-menu__option-text" tabindex="0" role="menuitem">
                                <span class="context-menu__option-text-clamp">Account Settings</span>
                                <svg width="24" height="24" viewBox="0 0 24 24" stroke="#212b36" stroke-width="2" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" clip-rule="evenodd" xml:space="preserve" class="context-menu__option-icon">
                                    <circle cx="12" cy="8" r="5" />
                                    <path d="M3,21 h18 C 21,12 3,12 3,21"/>
                                </svg>
                            </span>
                        `;
                        amSettings.classList.add("context-menu__option--am-settings");
                        amSettings.classList.add("context-menu__option");
                        amSettings.onclick = function () {
                            window.open(`https://music.apple.com/account/settings`)
                        };
                        ul.insertBefore(amSettings, ul.childNodes[8]);

                        const amPreferences = document.createElement("li");
                        amPreferences.innerHTML = `
                            <span class="context-menu__option-text" tabindex="0" role="menuitem">
                                <span class="context-menu__option-text-clamp">Preferences</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" clip-rule="evenodd" viewBox="0 0 16 16" xml:space="preserve" class="context-menu__option-icon">
                                    <path fill-rule="nonzero" d="M31.475,57.622C32.114,57.622 32.702,57.571 33.34,57.52L34.77,60.228C35.077,60.891 35.766,61.249 36.558,61.12C37.298,60.994 37.809,60.43 37.912,59.665L38.346,56.651C39.546,56.32 40.696,55.885 41.845,55.4L44.066,57.392C44.629,57.928 45.369,58.031 46.085,57.648C46.749,57.263 47.005,56.575 46.877,55.809L46.238,52.82C47.26,52.115 48.218,51.321 49.098,50.445L51.883,51.62C52.597,51.928 53.313,51.748 53.849,51.11C54.334,50.548 54.411,49.806 53.977,49.143L52.367,46.537C53.079,45.524 53.695,44.446 54.207,43.318L57.247,43.472C58.012,43.498 58.677,43.089 58.907,42.349C59.163,41.658 58.933,40.876 58.345,40.432L55.945,38.543C56.249,37.393 56.505,36.143 56.606,34.866L59.468,33.946C60.234,33.716 60.694,33.128 60.694,32.362C60.694,31.571 60.234,31.008 59.468,30.752L56.606,29.834C56.505,28.557 56.249,27.357 55.945,26.157L58.318,24.265C58.932,23.806 59.162,23.091 58.906,22.375C58.676,21.66 58.012,21.226 57.245,21.252L54.206,21.38C53.645,20.23 53.083,19.183 52.368,18.135L53.977,15.555C54.387,14.965 54.334,14.17 53.849,13.64C53.312,12.977 52.597,12.825 51.883,13.105L49.098,14.254C48.198,13.4 47.242,12.606 46.237,11.878L46.877,8.915C47.005,8.149 46.723,7.434 46.085,7.077C45.369,6.692 44.629,6.769 44.066,7.332L41.846,9.298C40.702,8.821 39.535,8.404 38.348,8.048L37.914,5.058C37.834,4.32 37.267,3.722 36.534,3.603C35.768,3.5 35.078,3.833 34.772,4.471L33.342,7.178C32.703,7.154 32.115,7.102 31.477,7.102C30.838,7.102 30.251,7.154 29.612,7.178L28.182,4.471C27.849,3.832 27.186,3.501 26.394,3.603C25.654,3.731 25.144,4.293 25.04,5.058L24.606,8.048C23.406,8.405 22.231,8.814 21.108,9.298L18.885,7.332C18.298,6.769 17.583,6.694 16.842,7.077C16.203,7.434 15.949,8.149 16.075,8.942L16.714,11.878C15.709,12.606 14.753,13.4 13.852,14.254L11.069,13.104C10.329,12.824 9.639,12.977 9.077,13.64C8.618,14.179 8.566,14.96 8.949,15.555L10.559,18.135C9.875,19.17 9.269,20.255 8.746,21.38L5.68,21.252C4.941,21.219 4.264,21.677 4.02,22.375C3.79,23.091 3.995,23.806 4.608,24.266L6.982,26.154C6.7,27.354 6.445,28.554 6.343,29.831L3.457,30.751C2.717,30.981 2.282,31.569 2.282,32.36C2.282,33.126 2.717,33.714 3.457,33.945L6.343,34.889C6.445,36.14 6.675,37.392 6.982,38.542L4.606,40.43C4.022,40.877 3.785,41.65 4.018,42.347C4.253,43.052 4.938,43.515 5.68,43.47L8.745,43.316C9.28,44.466 9.868,45.539 10.557,46.534L8.947,49.141C8.551,49.751 8.604,50.554 9.077,51.107C9.64,51.745 10.329,51.924 11.069,51.617L13.828,50.442C14.722,51.312 15.688,52.107 16.714,52.817L16.075,55.807C15.948,56.573 16.203,57.262 16.868,57.645C17.583,58.028 18.298,57.925 18.86,57.415L21.106,55.397C22.231,55.882 23.406,56.317 24.606,56.648L25.04,59.664C25.143,60.428 25.654,60.991 26.394,61.144C27.186,61.247 27.849,60.888 28.182,60.225L29.612,57.517C30.251,57.568 30.838,57.619 31.477,57.619L31.475,57.621L31.475,57.622ZM38.168,30.345C36.891,27.049 34.337,25.262 31.322,25.262C30.762,25.261 30.205,25.33 29.662,25.466L22.766,13.64C25.492,12.368 28.466,11.714 31.474,11.724C42.254,11.724 50.732,19.822 51.729,30.344L38.168,30.344L38.168,30.345ZM11.145,32.362C11.145,25.543 14.286,19.515 19.242,15.762L26.188,27.637C24.834,29.145 24.222,30.752 24.222,32.438C24.222,34.074 24.809,35.58 26.188,37.138L19.063,48.835C14.209,45.055 11.145,39.105 11.145,32.362ZM28.283,32.412C28.283,30.702 29.738,29.374 31.373,29.374C33.085,29.374 34.489,30.702 34.489,32.412C34.481,34.114 33.076,35.509 31.374,35.505C29.738,35.505 28.282,34.125 28.282,32.412L28.283,32.412ZM31.475,53.025C28.257,53.025 25.218,52.285 22.562,50.982L29.637,39.386C30.377,39.565 30.887,39.616 31.322,39.616C34.362,39.616 36.915,37.776 38.168,34.405L51.729,34.405C50.732,44.903 42.252,53.025 31.475,53.025Z" transform="matrix(.27119 0 0 .27119 -.54 -.78)"></path>
                                </svg>
                            </span>
                        `;

                        amPreferences.classList.add("context-menu__option--app-settings");
                        amPreferences.classList.add("context-menu__option");
                        amPreferences.onclick = function () {
                            ipcRenderer.send("showPreferences");
                        };
                        ul.insertBefore(amPreferences, ul.childNodes[9]);

                        const amDiscord = document.createElement("li");
                        amDiscord.innerHTML = `
                            <span class="context-menu__option-text" tabindex="0" role="menuitem">
                                <span class="context-menu__option-text-clamp">Discord</span>
                                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="20" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" clip-rule="evenodd" viewBox="0 0 28 20" xml:space="preserve" class="context-menu__option-icon">
                                    <path d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 12.9974 1.12145 11.0283 1.4184C10.819 0.934541 10.589 0.461744 10.3368 0.00546311C8.48074 0.324393 6.67795 0.885118 4.96746 1.68231C1.56727 6.77853 0.649666 11.7538 1.11108 16.652C3.10102 18.1418 5.3262 19.2743 7.69177 20C8.22338 19.2743 8.69519 18.4993 9.09812 17.691C8.32996 17.3997 7.58522 17.0424 6.87684 16.6135C7.06531 16.4762 7.24726 16.3387 7.42403 16.1847C11.5911 18.1749 16.408 18.1749 20.5763 16.1847C20.7531 16.3332 20.9351 16.4762 21.1171 16.6135C20.41 17.0369 19.6639 17.3997 18.897 17.691C19.3052 18.4993 19.7718 19.2689 20.3021 19.9945C22.6677 19.2689 24.8929 18.1364 26.8828 16.6466H26.8893C27.43 10.9731 25.9665 6.04728 23.0212 1.67671ZM9.68041 13.6383C8.39754 13.6383 7.34085 12.4453 7.34085 10.994C7.34085 9.54272 8.37155 8.34973 9.68041 8.34973C10.9893 8.34973 12.0395 9.54272 12.0187 10.994C12.0187 12.4453 10.9828 13.6383 9.68041 13.6383ZM18.3161 13.6383C17.0332 13.6383 15.9765 12.4453 15.9765 10.994C15.9765 9.54272 17.0124 8.34973 18.3161 8.34973C19.6184 8.34973 20.6751 9.54272 20.6543 10.994C20.6543 12.4453 19.6184 13.6383 18.3161 13.6383Z"</path>
                                </svg>
                            </span>
                        `;
                        amDiscord.classList.add("context-menu__option--am-discord");
                        amDiscord.classList.add("context-menu__option");
                        amDiscord.onclick = function () {
                            window.open(`https://discord.gg/CezHYdXHEM`)
                        };
                        ul.insertBefore(amDiscord, ul.childNodes[4]);
                    });
                }

                /* Scroll Volume */
                if (document.querySelector('.web-chrome-playback-lcd__volume') && typeof volumeChange === 'undefined') {
                    document.getElementsByClassName('web-chrome-playback-lcd__volume')[0].addEventListener('wheel', volumeChange);

                    function volumeChange(event) {
                        if (preferences.advanced.verboseLogging.includes(true)) console.log(event);
                        if (checkScrollDirectionIsUp(event)) {
                            if (MusicKit.getInstance().volume <= 1) {
                                if ((MusicKit.getInstance().volume + 0.05) > 1) {
                                    MusicKit.getInstance().volume = 1
                                } else {
                                    MusicKit.getInstance().volume = MusicKit.getInstance().volume + 0.05
                                }
                            }
                        } else {
                            if (MusicKit.getInstance().volume >= 0) {
                                if ((MusicKit.getInstance().volume - 0.05) < 0) {
                                    MusicKit.getInstance().volume = 0
                                } else {
                                    MusicKit.getInstance().volume = MusicKit.getInstance().volume - 0.05
                                }
                            }
                        }
                    }

                    function checkScrollDirectionIsUp(event) {
                        if (event.wheelDelta) {
                            return event.wheelDelta > 0;
                        }
                        return event.deltaY < 0;
                    }
                }

                /* Context Menu Creation (From PR #221 by @SiverDX) */
                const SongContextMenu = {
                    simulateClick: (element, clientX, clientY) => {
                        let event = new MouseEvent('click', {
                            clientX: clientX,
                            clientY: clientY
                        });

                        element.dispatchEvent(event);
                    },

                    createListeners: () => {
                        /* Check if the user is on the library song list or on playlist/album */
                        const clickRegion = (document.getElementsByClassName("songs-list-row").length === 0 ? document.getElementsByClassName("library-track") : document.getElementsByClassName("songs-list-row"));

                        /* Loop through each row/song and add event listener */
                        for (let area of clickRegion) {
                            area.addEventListener('contextmenu', function (event) {
                                event.preventDefault();

                                let control = area.getElementsByClassName("context-menu__overflow ")[0];

                                if (control) {
                                    SongContextMenu.simulateClick(control, event.clientX, event.clientY);
                                }
                            });
                        }

                    }
                };
                SongContextMenu.createListeners();

                /* Remove Apple Logo */
                if (preferences['visual']['removeAppleLogo'].includes(true)) {
                    while (document.getElementsByClassName('web-navigation__header web-navigation__header--logo').length > 0) {
                        document.getElementsByClassName('web-navigation__header web-navigation__header--logo')[0].remove();
                    }
                }

                /* Remove Footer */
                if (preferences['visual']['removeFooter'].includes(true)) {
                    while (document.getElementsByTagName('footer').length > 0) {
                        document.getElementsByTagName('footer')[0].remove();
                    }
                }

                /* Remove Upsell */
                if (preferences['visual']['removeUpsell'].includes(true)) {
                    while (document.getElementsByClassName('web-navigation__native-upsell').length > 0) {
                        document.getElementsByClassName('web-navigation__native-upsell')[0].remove();
                    }
                }


                /* Initialize the miniPlayer */
                _miniPlayer.init();

                /* Create the Lyrics Button */
                _lyrics.CreateButton();
            }
        };

        /* Load the Startup Files as This is the First Time its been Run */
        AMJavaScript.LoadCustomStartup();
    }

} catch (e) {
    console.error("[JS] Error while trying to apply custom.js", e);
}