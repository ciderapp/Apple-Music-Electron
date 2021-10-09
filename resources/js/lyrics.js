

try {

    MusicKit.getInstance().addEventListener(MusicKit.Events.playbackTimeDidChange, function (e) {
        ipcRenderer.send('LyricsTimeUpdate', MusicKit.getInstance().currentPlaybackTime + 0.250);
    });

    MusicKit.getInstance().addEventListener(MusicKit.Events.nowPlayingItemDidChange, function (e) {
        /*
        var artworkURL = MusicKitInterop.getAttributes()["artwork"]["url"];
        GetXPath(buttonImagePath).src = "https://beta.music.apple.com/assets/product/MissingArtworkMusic.svg";
        if (artworkURL != ''){
        GetXPath(buttonImagePath).src = (MusicKitInterop.getAttributes()["artwork"]["url"]).replace("{w}", 256).replace("{h}", 256);}
        else {
           try{ MusicKit.getInstance().api.library.song(MusicKit.getInstance().nowPlayingItem.id).then((data)=>{
                if (data != null && data != ""){
                    GetXPath(buttonImagePath).src =  data["artwork"]["url"];}
                else {
                    GetXPath(buttonImagePath).src = "https://beta.music.apple.com/assets/product/MissingArtworkMusic.svg";
                }
            });} catch(e){}

        } */
        try{
        var lrc = new Lyricer();
        lrc.setLrc("");
        lrc = null;
        } catch(e){}
        GetLyrics(1);
    });

    const buttonImagePath = "/html/body/div[4]/div[3]/div[3]/div/div[2]/div[1]/img";

    function GetXPath(path) {
        return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    function ClearEventListener(element) {
        const clonedElement = element.cloneNode(true);
        element.replaceWith(clonedElement);
        return clonedElement;
    }

    function GetLyrics(mode) {
        const musicKit = MusicKit.getInstance();
        const trackName = encodeURIComponent(MusicKitInterop.getAttributes()["name"]);
        const artistName = encodeURIComponent(MusicKitInterop.getAttributes()["artistName"]);
        const duration = encodeURIComponent(Math.round(MusicKitInterop.getAttributes()["durationInMillis"] / 1000));
        const songID = (musicKit.nowPlayingItem != null) ? musicKit.nowPlayingItem["_songId"] ?? -1 : -1;

        if (songID !== -1) {

            MusicKit.getInstance().api.lyric(songID)
                .then(function (response) {
                    const ttmllyrics = response["ttml"];
                    let lyrics = "";
                    const parser = new DOMParser();
                        const doc = parser.parseFromString(ttmllyrics, "text/xml");
                        const lyricslines = doc.getElementsByTagName('p');
                        for (let element of lyricslines) {
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
                        ;
                        console.log("AM lyrics:" + lyrics);
                        var artworkURL = (MusicKitInterop.getAttributes()["artwork"]["url"]).replace("{w}", 256).replace("{h}", 256);
                        if (artworkURL == null) {
                            artworkURL = "https://beta.music.apple.com/assets/product/MissingArtworkMusic.svg";
                        }
                        if (mode == 1) {
                            ipcRenderer.send('LyricsUpdate', lyrics, artworkURL);
                        } else {
                            console.log(lyrics);
                            ipcRenderer.send('LyricsHandler', lyrics, artworkURL);
                        }
                    }
                ).catch((error) => {
                    var artworkURL = (MusicKitInterop.getAttributes()["artwork"]["url"]).replace("{w}", 256).replace("{h}", 256);
                    if (artworkURL == null) {
                        artworkURL = "https://beta.music.apple.com/assets/product/MissingArtworkMusic.svg";
                    }
                    if (mode == 1) {
                        ipcRenderer.send('LyricsUpdate', "netease=" + trackName + " " + artistName, artworkURL);
                    } else {
                        ipcRenderer.send('LyricsHandler', "netease=" + trackName + " " + artistName, artworkURL);
                    }
                }
            );

        } else {

            try {
                MusicKit.getInstance().api.library.song(MusicKit.getInstance().nowPlayingItem.id).then((data) => {
                    if (data != null && data != "") {
                        artworkURL = data["artwork"]["url"];
                    } else {
                        artworkURL = "https://beta.music.apple.com/assets/product/MissingArtworkMusic.svg";
                    }
                    if (mode == 1) {
                        ipcRenderer.send('LyricsUpdate', "netease=" + trackName + " " + artistName, artworkURL);
                    } else {
                        ipcRenderer.send('LyricsHandler', "netease=" + trackName + " " + artistName, artworkURL);
                    }
                });
            } catch (e) {
            }


        }
    }

    const mediaControlsPath = "/html/body/div[4]/div/div[3]/div/div[3]";
    const sidebar = "/html/body/div[4]/div[3]/div[1]";
    const playListButtonPath = "/html/body/div[4]/div[3]/div[3]/div/div[3]/div[3]/button";
    var lyricsbutton = document.createElement("div");
    lyricsbutton.style.height = "22px";
    lyricsbutton.style.width = "22px";
    lyricsbutton.style.marginInlineEnd = "0px";
    lyricsbutton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" height="22" viewBox="0 0 28 28" id="vector">
            <path id="path" d="M 14.4 12.2 C 14.4 11.1 15.2 10.3 16.4 10.3 C 17.7 10.3 18.5 11.3 18.5 12.7 C 18.5 14.7 16.8 15.9 15.8 15.9 C 15.5 15.9 15.3 15.7 15.3 15.5 C 15.3 15.3 15.4 15.1 15.7 15.1 C 16.5 14.9 17.1 14.4 17.4 13.7 L 17.2 13.7 C 17 14 16.6 14.1 16.1 14.1 C 15.1 14 14.4 13.2 14.4 12.2 Z M 9.5 12.2 C 9.5 11.1 10.3 10.3 11.5 10.3 C 12.8 10.3 13.6 11.3 13.6 12.7 C 13.6 14.7 11.9 15.9 10.9 15.9 C 10.6 15.9 10.4 15.7 10.4 15.5 C 10.4 15.3 10.5 15.1 10.8 15.1 C 11.6 14.9 12.3 14.4 12.5 13.7 L 12.3 13.7 C 12.1 14 11.7 14.1 11.2 14.1 C 10.2 14 9.5 13.2 9.5 12.2 Z M 10.4 21.4 L 13.2 18.7 C 13.8 18.1 14.1 18 14.8 18 L 19.4 18 C 20.7 18 21.5 17.2 21.5 15.9 L 21.5 9.4 C 21.5 8 20.7 7.3 19.4 7.3 L 8.5 7.3 C 7.2 7.3 6.4 8 6.4 9.4 L 6.4 15.9 C 6.4 17.2 7.2 18 8.5 18 L 9.5 18 C 10.1 18 10.4 18.3 10.4 18.9 L 10.4 21.4 Z M 9.9 24 C 9 24 8.4 23.4 8.4 22.4 L 8.4 20.4 L 7.9 20.4 C 5.4 20.3 4 19 4 16.5 L 4 9 C 4 6.5 5.5 5 8.1 5 L 19.9 5 C 22.5 5 24 6.4 24 9 L 24 16.6 C 24 19.1 22.5 20.4 19.9 20.4 L 14.8 20.4 L 11.7 23.1 C 11 23.7 10.5 24 9.9 24 Z" />
        </svg>`;
    lyricsbutton.id = "lyricsButton";
    lyricsbutton.className = "web-chrome-playback-controls__platter-toggle-buttons web-chrome-playback-controls__meta-btn";


    if (document.getElementById("lyricsButton") == null) {
        GetXPath(mediaControlsPath).insertBefore(lyricsbutton, GetXPath(mediaControlsPath).childNodes[4]);
        function openLyrics() {
                
            document.body.classList.add("web-chrome-drawer-open");
            document.body.classList.remove("web-chrome-drawer-opening");
            document.querySelector('.web-chrome-drawer').style.backgroundColor = "var(--systemToolbarTitlebarMaterialSover-inactive)";
            document.querySelector('.web-chrome-drawer').removeEventListener('animationend',openLyrics,true);
        }
        function closeLyrics() {
            
            document.body.classList.remove("web-chrome-drawer-open");
            document.body.classList.remove("web-chrome-drawer-closing");
            document.querySelector('.web-chrome-drawer').style.backgroundColor = "";
            document.querySelector('.web-chrome-drawer').removeEventListener('animationend',closeLyrics, true);
         }

        document.getElementById("lyricsButton").addEventListener('click', function () {
            if (document.querySelector('.web-chrome-drawer').querySelector('.web-navigation__up-next.web-chrome-up-next.up-next') == null){
            
                if (document.getElementsByClassName("web-chrome-drawer-open").length == 0 ) 
            {document.querySelector('.web-chrome-drawer').addEventListener('animationend',openLyrics,true);
             document.body.classList.add("web-chrome-drawer-opening");
            } else {             
             document.querySelector('.web-chrome-drawer').addEventListener('animationend',closeLyrics,true);
             document.body.classList.add("web-chrome-drawer-closing");              
            }} else {try{
                if (GetXPath(playListButtonPath).classList.contains('active')){     
                GetXPath(playListButtonPath).click();
                document.querySelector('.web-chrome-drawer').addEventListener('animationend',openLyrics,true);
                document.body.classList.add("web-chrome-drawer-opening");            
            } else {
                document.querySelector('.web-chrome-drawer').style.backgroundColor = "";
                document.querySelector('.web-chrome-drawer').removeEventListener('animationend',openLyrics,true);
                document.querySelector('.web-chrome-drawer').removeEventListener('animationend',closeLyrics,true);}
        }catch(e){}
    } 
            if(!document.getElementById("lyricer")){       
                  
                   GetXPath(sidebar).innerHTML = `	<div id="lyricer">
                   </div>`;

                   var text = "";
                    var lrc = new Lyricer();
                    ipcRenderer.on('truelyrics', function (event, lrcfile) {
                        if (lrcfile.startsWith("netease=")){
                            ipcRenderer.send('NetEaseLyricsHandler',lrcfile);
                        }
                        else{	
                            lrc.setLrc(lrcfile);}
                    });
                    ipcRenderer.on('ProgressTimeUpdate', function (event, data) {
                    if (data < 0){data = 0};
                    lrc.move(data);
                    });
                

                    lrc.setLrc(text);
                    document.addEventListener("lyricerclick", function(e){
                            ipcRenderer.send('ProgressTimeUpdateFromLyrics',e.detail.time);
                            console.log('clicked on ' + e.detail.time);
                            document.body.setAttribute("background-color", `var(--systemToolbarTitlebarMaterialSover-inactive)`);
                    });

            GetLyrics(2);}
        }, false);
    }


} catch (e) {
    console.error("[JS] Error while trying to add lyrics", e);
}
    
