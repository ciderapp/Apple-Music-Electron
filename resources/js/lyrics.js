

        console.log("Lyrics!");
        try{     
            MusicKit.getInstance().addEventListener( MusicKit.Events.playbackTimeDidChange, function(e){
                ipcRenderer.send('LyricsTimeUpdate',MusicKit.getInstance().currentPlaybackTime);
            });

            MusicKit.getInstance().addEventListener( MusicKit.Events.nowPlayingItemDidChange, function(e){
                var artworkURL = MusicKitInterop.getAttributes()["artwork"]["url"];
                if (artworkURL != ''){
                GetXPath(buttonImagePath).src = (MusicKitInterop.getAttributes()["artwork"]["url"]).replace("{w}", 256).replace("{h}", 256);} else {
                GetXPath(buttonImagePath).src = "https://beta.music.apple.com/assets/product/MissingArtworkMusic.svg";    
                }
                GetLyrics(1);
            });

            const buttonPath = "/html/body/div[4]/div[3]/div[3]/div/div[2]/div[1]";
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
                    var musicKit = MusicKit.getInstance();
                    var trackname = encodeURIComponent(MusicKitInterop.getAttributes()["name"]);
                    var artistname = encodeURIComponent(MusicKitInterop.getAttributes()["artistName"]);
                    var duration = encodeURIComponent(Math.round(MusicKitInterop.getAttributes()["durationInMillis"] /1000));
                    /* netease */
                    /* https://music.163.com/api/search/pc?s=ew_%20joji&type=1&limit=1 */
                    /* ["result"]["songs"][0]["id"] */
                    /* http://music.163.com/api/song/lyric?os=pc&id=1481691177&lv=-1&kv=-1&tv=-1 */
                    /* ["lrc"]["lyric"] */
                    
                    var url  = "https://music.163.com/api/search/pc?s="+trackname+" "+artistname+"&type=1&limit=1";
                    var req = new XMLHttpRequest();  
                    req.overrideMimeType("application/json");
                    req.open('GET', url, true);
                    req.onload  = function() {
                    var jsonResponse = JSON.parse(req.responseText);
                        
                        var id = jsonResponse["result"]["songs"][0]["id"];
                        var url2  = "https://music.163.com/api/song/lyric?os=pc&id="+id+"&lv=-1&kv=-1&tv=-1";
                        var req2 = new XMLHttpRequest();  
                        req2.overrideMimeType("application/json");
                        req2.open('GET', url2, true);
                        req2.onload  = function() {
                        var jsonResponse2 = JSON.parse(req2.responseText);
                            var lyrics = jsonResponse2["lrc"]["lyric"];
                            console.log(lyrics);
                            if (mode == 1){ipcRenderer.send('LyricsUpdate',lyrics);} 
                            else { console.log(lyrics);
                                ipcRenderer.send('LyricsHandler',lyrics);}
                        };
                        req2.send();
                        
                    };
                    req.send();
            }

            if (GetXPath(buttonPath)) {
                /* Clear previous injects */    
                ClearEventListener(GetXPath(buttonPath));
                if ((MusicKitInterop.getAttributes()["artwork"]["url"]) != ''){
                    GetXPath(buttonImagePath).src = (MusicKitInterop.getAttributes()["artwork"]["url"]).replace("{w}", 256).replace("{h}", 256);} else {
                    GetXPath(buttonImagePath).src = "https://beta.music.apple.com/assets/product/MissingArtworkMusic.svg";    
                }
                GetXPath(buttonPath).addEventListener('click', function () {
                    GetLyrics(2);
                    console.log("Hi guys!");
                    
                },false);
            }
        } catch (e){
        console.error("[JS] Error while trying to add lyrics", e); 
        }
    
