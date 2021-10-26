var override = false;
var GCOverride = false;
var GCstream;
var searchInt;
var AMEx = {
    context: new AudioContext(),
    result: {},
    filter: [],
    EQRanges: [{
        f: 32,
        type: 'lowshelf'
    }, {
        f: 64,
        type: 'peaking'
    }, {
        f: 125,
        type: 'peaking'
    }, {
        f: 250,
        type: 'peaking'
    }, {
        f: 500,
        type: 'peaking'
    }, {
        f: 1000,
        type: 'peaking'
    }, {
        f: 2000,
        type: 'peaking'
    }, {
        f: 4000,
        type: 'peaking'
    }, {
        f: 8000,
        type: 'peaking'
    }, {
        f: 16000,
        type: 'highshelf'
    }]
};
var bassFilter;
var trebleFilter;

var _amOT = {
    fInit: false,
    eqReady: false,
    init: function (cb = function () {}) {
        _amOT.fInit = true;
         searchInt = setInterval(function () {
            if (document.getElementById("apple-music-player")) {
                _amOT.eqReady = true;
              /*  document.domain = "blobstore.apple.com"; */
                document.getElementById("apple-music-player").crossOrigin = "anonymous";
                _amOT.amplifyMedia(document.getElementById("apple-music-player"), 0);
                var context = AMEx.context;
                var source = AMEx.result.source;
                bassFilter = context.createBiquadFilter();
                bassFilter.type = "lowshelf";
                bassFilter.frequency.value = 200;
                bassFilter.gain.value = 0;

                trebleFilter = context.createBiquadFilter();
                trebleFilter.type = "highshelf";
                trebleFilter.frequency.value = 2000;
                trebleFilter.gain.value = 0;

                source.connect(bassFilter);
                bassFilter.connect(trebleFilter);
                trebleFilter.connect(context.destination);
                console.log("Attached EQ");
                cb();
                clearInterval(searchInt);
            }
        }, 1000);
    },
    amplifyMedia: function (mediaElem, multiplier) {
        AMEx.context = new(window.AudioContext || window.webkitAudioContext),
        AMEx.result = {
            context: AMEx.context,
            source: AMEx.context.createMediaElementSource(mediaElem),
            gain: AMEx.context.createGain(),
            media: mediaElem,
            amplify: function (multiplier) {
                AMEx.result.gain.gain.value = multiplier;
            },
            getAmpLevel: function () {
                return AMEx.result.gain.gain.value;
            }
        };
        AMEx.result.source.connect(AMEx.result.gain);
        AMEx.result.gain.connect(AMEx.context.destination);
        AMEx.result.amplify(multiplier);
        return AMEx.result;
    },
    popup_generic: function ({
        title = "",
        content = document.createElement("div"),
        closefn = function () {},
        transparentBg = false,
        windowStyle = {},
        backdropStyle = {}
    }) {
        let backdrop = document.createElement("div");
        backdrop.style.width = "100%";
        backdrop.style.height = "100%";
        backdrop.style.position = "fixed";
        backdrop.style.top = 0;
        backdrop.style.left = 0;
        if (!transparentBg) {
            backdrop.style.background = "rgba(0,0,0,0.5)";
        } else {
            backdrop.style.background = "rgba(0,0,0,0.0)";
        };
        backdrop.style.zIndex = 10000;
        backdrop.style.display = "flex";
        backdrop.style.alignItems = "center";
        backdrop.style.justifyContent = "center";
        let win = document.createElement("div");
        win.style.width = "300px";
        win.style.background = "var(--modalBGColor)";
        win.style.zIndex = 10000;
        win.style.padding = "16px";
        win.style.borderRadius = "10px";
        Object.assign(backdrop.style, backdropStyle);
        Object.assign(win.style, windowStyle);
        let closeBtn = document.createElement("button");
        closeBtn.style.background = "var(--primaryColor)";
        closeBtn.style.borderRadius = "4px";
        closeBtn.style.padding = "8px 0px 8px 0px";
        closeBtn.style.width = "100%";
        closeBtn.style.fontWeight = "bold";
        closeBtn.style.margin = "12px 0px 0px 0px";
        closeBtn.innerHTML = "Close";
        closeBtn.addEventListener("click", function () {
            backdrop.remove();
            closefn();
        });
        let titleText = document.createElement("div");
        titleText.innerHTML = (title);
        titleText.style.fontWeight = "bold";


        win.appendChild(titleText);
        win.appendChild(content);
        win.appendChild(closeBtn);

        backdrop.appendChild(win);
        document.body.appendChild(backdrop);
    },
    ShowEQ: function () {
        if (!_amOT.eqReady) {
            alert("Audio is not ready, Play a song to use this function.");
        };
        let backdrop = document.createElement("div");
        backdrop.style.width = "100%";
        backdrop.style.height = "100%";
        backdrop.style.position = "fixed";
        backdrop.style.top = 0;
        backdrop.style.left = 0;
        backdrop.style.background = "rgba(0,0,0,0.5)";
        backdrop.style.zIndex = 9999;
        backdrop.style.display = "flex";
        backdrop.style.alignItems = "center";
        backdrop.style.justifyContent = "center";
        backdrop.style.backdropFilter = "blur(12px) saturate(180%)";

        let win = document.createElement("div");
        win.style.width = "300px";
        win.style.background = "var(--modalBGColor)";
        win.style.zIndex = 10000;
        win.style.padding = "16px";
        win.style.borderRadius = "10px";


        let closeBtn = document.createElement("button");
        closeBtn.style.background = "var(--primaryColor)";
        closeBtn.style.borderRadius = "4px";
        closeBtn.style.padding = "8px 0px 8px 0px";
        closeBtn.style.width = "100%";
        closeBtn.style.fontWeight = "bold";
        closeBtn.style.margin = "12px 0px 0px 0px";

        closeBtn.innerHTML = "Close";
        closeBtn.addEventListener("click", function () {
            backdrop.remove()
        });

        let titleText = document.createElement("div");
        let bassText = document.createElement("div");
        let trebleText = document.createElement("div");
        let gainText = document.createElement("div");
        titleText.innerHTML = (`Equalizer`);
        titleText.style.fontWeight = "bold";
        bassText.innerHTML = (`Bass (${bassFilter.gain.value})`);
        trebleText.innerHTML = (`Treble (${trebleFilter.gain.value})`);
        gainText.innerHTML = (`Gain (${AMEx.result.gain.gain.value})`);


        let bassAdjust = document.createElement("input");
        bassAdjust.style.width = "100%";
        bassAdjust.type = "range";
        bassAdjust.min = -10;
        bassAdjust.max = 10;
        bassAdjust.value = bassFilter.gain.value;
        bassAdjust.addEventListener("input", function () {
            bassFilter.gain.value = this.value;
            bassText.innerHTML = `Bass (${bassFilter.gain.value})`;
        });

        let trebleAdjust = document.createElement("input");
        trebleAdjust.style.width = "100%";
        trebleAdjust.min = -10;
        trebleAdjust.max = 10;
        trebleAdjust.type = "range";
        trebleAdjust.value = trebleFilter.gain.value;
        trebleAdjust.addEventListener("input", function () {
            trebleFilter.gain.value = this.value;
            trebleText.innerHTML = `Treble (${trebleFilter.gain.value})`;
        });

        let gainAdjust = document.createElement("input");
        gainAdjust.style.width = "100%";
        gainAdjust.min = -1;
        gainAdjust.max = 1;
        gainAdjust.type = "range";
        gainAdjust.value = AMEx.result.gain.gain.value;
        gainAdjust.addEventListener("input", function () {
            AMEx.result.gain.gain.value = this.value;
            gainText.innerHTML = `Gain (${AMEx.result.gain.gain.value})`;
        });

        let bassLabel = document.createElement("label");
        let trebleLabel = document.createElement("label");
        let gainLabel = document.createElement("label");

        bassLabel.appendChild(bassText);
        trebleLabel.appendChild(trebleText);
        gainLabel.appendChild(gainText);

        bassLabel.appendChild(bassAdjust);
        bassLabel.appendChild(document.createElement("br"));
        trebleLabel.appendChild(trebleAdjust);
        trebleLabel.appendChild(document.createElement("br"));
        gainLabel.appendChild(gainAdjust);

        win.appendChild(titleText);
        win.appendChild(bassLabel);
        win.appendChild(trebleLabel);
        win.appendChild(gainLabel);
        win.appendChild(closeBtn);

        backdrop.appendChild(win);
        document.body.appendChild(backdrop);
    },
    getRawPCM: function(){
        var x = AMEx.context.createScriptProcessor(16384,2,1);

        x.onaudioprocess = function(e){
            if (!override){
            var leftpcm = e.inputBuffer.getChannelData(0);
            var rightpcm = e.inputBuffer.getChannelData(1);
            ipcRenderer.send('writePCM',leftpcm,rightpcm, e.inputBuffer.length);
        }
        };
        AMEx.result.source.connect(x);x.connect(AMEx.context.destination);
    },
    getGCDevices: function(){
        ipcRenderer.send('getChromeCastDevices','');
    },
    playGC : function(ip){
       /* _amOT.init(); */
        ipcRenderer.send('performGCCast',ip, MusicKit.getInstance().nowPlayingItem.title,MusicKit.getInstance().nowPlayingItem.artistName,MusicKit.getInstance().nowPlayingItem.albumName,(MusicKitInterop.getAttributes()["artwork"]["url"]).replace("{w}", 256).replace("{h}", 256));
        GCstream = AMEx.result.context.createScriptProcessor(16384,2,1);

        GCstream.onaudioprocess = function(e){
            if (!GCOverride){
            var leftpcm = e.inputBuffer.getChannelData(0);
            var rightpcm = e.inputBuffer.getChannelData(1);
            ipcRenderer.send('writeWAV',leftpcm,rightpcm);
        }
        
        };


        AMEx.result.source.connect(GCstream);GCstream.connect(AMEx.context.destination);
    },
    stopGC : function(){
       GCOverride = true;
       ipcRenderer.send('stopGCast','');
    } 
};



document.addEventListener('keydown', function (event) {
    if (event.ctrlKey || event.metaKey) {
        switch (String.fromCharCode(event.which).toLowerCase()) {
            case "2":
                _amOT.ShowEQ();
                break;
            case "3":
                (override) ? (override = false) : (override = true);
                break;    
        }
    }
});

_amOT.init()