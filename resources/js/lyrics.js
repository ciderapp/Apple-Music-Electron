

        console.log("Lyrics!");
        try{  

            MusicKit.getInstance().addEventListener( MusicKit.Events.playbackTimeDidChange, function(e){
                ipcRenderer.send('LyricsTimeUpdate',MusicKit.getInstance().currentPlaybackTime + 0.250);
            });

            MusicKit.getInstance().addEventListener( MusicKit.Events.nowPlayingItemDidChange, function(e){
                GetXPath(buttonImagePath).src = "https://beta.music.apple.com/assets/product/MissingArtworkMusic.svg";
                var artworkURL = MusicKitInterop.getAttributes()["artwork"]["url"];
                if (artworkURL != ''){
                GetXPath(buttonImagePath).src = (MusicKitInterop.getAttributes()["artwork"]["url"]).replace("{w}", 256).replace("{h}", 256);} else {
                   try{ MusicKit.getInstance().api.library.song(MusicKit.getInstance().nowPlayingItem.id).then((data)=>{
                        if (data != null && data != ""){
                            GetXPath(buttonImagePath).src =  data["artwork"]["url"];}
                        else {
                            GetXPath(buttonImagePath).src = "https://beta.music.apple.com/assets/product/MissingArtworkMusic.svg";
                        }    
                    });} catch(e){}
                        
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
                    var songid = (musicKit.nowPlayingItem !=null)? musicKit.nowPlayingItem["_songId"] ?? -1 : -1;
                    /* netease */
                    /* https://music.163.com/api/search/pc?s=ew_%20joji&type=1&limit=1 */
                    /* ["result"]["songs"][0]["id"] */
                    /* http://music.163.com/api/song/lyric?os=pc&id=1481691177&lv=-1&kv=-1&tv=-1 */
                    /* ["lrc"]["lyric"] */

                    if (songid != -1){
                        
                        MusicKit.getInstance().api.lyric(songid)
                        .then(function(response){
                            var ttmllyrics = response["ttml"];
                            var lyrics = "";
                            const parser = new DOMParser();
                            const doc = parser.parseFromString(ttmllyrics, "text/xml");
                            const lyricslines = doc.getElementsByTagName('p');
                            for (let element of lyricslines) {
                                var rawTime = element.getAttribute('begin').match(/(\d+:)?(\d+:)?(\d+)?(\.\d+)/);
                                var hours = (rawTime[2] != null) ? (rawTime[1].replace(":","")) : "0";
                                var minutes = 
                                (rawTime[2] != null) ? (hours *60+ rawTime[2].replace(":","")*1 + ":") : ((rawTime[1] != null) ? rawTime[1] : "00:")
                                ;
                                var seconds = (rawTime[3] != null) ? (rawTime[3]) : "00";
                                var milliseconds = (rawTime[4] != null) ? (rawTime[4]) : ".000";
                                var lrcTime = minutes+seconds+milliseconds;
                                lyrics = lyrics.concat(`[${lrcTime}]${element.textContent}` +"\r\n");
                            };
                            console.log("AM lyrics:" + lyrics);
                            var artworkURL = (MusicKitInterop.getAttributes()["artwork"]["url"]).replace("{w}", 256).replace("{h}", 256);
                            if (artworkURL == null ) {
                                artworkURL = "https://beta.music.apple.com/assets/product/MissingArtworkMusic.svg";    
                            }
                            if (mode == 1){ipcRenderer.send('LyricsUpdate',lyrics,artworkURL);} 
                            else { console.log(lyrics); 
                                ipcRenderer.send('LyricsHandler',lyrics,artworkURL);}  
                         }
                         ).catch((error) =>{
                            var artworkURL = (MusicKitInterop.getAttributes()["artwork"]["url"]).replace("{w}", 256).replace("{h}", 256);
                            if (artworkURL == null ) {
                                artworkURL = "https://beta.music.apple.com/assets/product/MissingArtworkMusic.svg";    
                            }
                            if (mode == 1){ipcRenderer.send('LyricsUpdate',"netease="+trackname+" "+artistname,artworkURL);} 
                            else {  
                                ipcRenderer.send('LyricsHandler',"netease="+trackname+" "+artistname,artworkURL);}  
                         } 
                         );

                    } else {
                    
                        try{ MusicKit.getInstance().api.library.song(MusicKit.getInstance().nowPlayingItem.id).then((data)=>{
                                if (data != null && data != ""){
                                    artworkURL=  data["artwork"]["url"];}
                                else {
                                    artworkURL = "https://beta.music.apple.com/assets/product/MissingArtworkMusic.svg";
                                } 
                                if (mode == 1){ipcRenderer.send('LyricsUpdate',"netease="+trackname+" "+artistname,artworkURL);} 
                                else { 
                                    ipcRenderer.send('LyricsHandler',"netease="+trackname+" "+artistname,artworkURL);}   
                        }); }catch(e){} 
                        
                       
                                

                        
                    
                        
                    }
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
    
