
var override = false;
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
    TogglePrivacy: function () {
        if (MusicKit.getInstance().privateEnabled) {
            MusicKit.getInstance().privateEnabled = false;
            _ostd.Notification("Privacy Mode Disabled");
        } else {
            MusicKit.getInstance().privateEnabled = true;
            _ostd.Notification("Privacy Mode Enabled");
        }
    },
    viz: {
        visualizer: "",
        preset: {},
        presetName: "",
        presets: {},
        renderSize: [1600, 1200],
        running: false,
        ready: false,
        lowered: false,
        scale: 1.0,
        canvas: document.createElement("canvas")
    },
    VizToggle: function () {
        if (_amOT.viz.running) {
            _amOT.StopViz();
        } else {
            _amOT.StartViz();
        }
    },
    StopViz: function () {
        _amOT.viz.canvas.style.display = "none";
        _amOT.viz.running = false;
    },
    ToggleFullscreen: function () {
        var element = document.body;
        var requestMethod = element.requestFullScreen || element.webkitRequestFullScreen || element.mozRequestFullScreen || element.msRequestFullScreen;

        if (requestMethod) { 
            requestMethod.call(element);
        } else if (typeof window.ActiveXObject !== "undefined") { 
            var wscript = new ActiveXObject("WScript.Shell");
            if (wscript !== null) {
                wscript.SendKeys("{F11}");
            }
        }
    },
    VizConfig: function () {
        let content = document.createElement("div");
        let preLabel = document.createElement("label");
        let preSelect = document.createElement("select");
        let fullscreenBtn = document.createElement("button");
        let scaleInput = document.createElement("input");
        let scaleLabel = document.createElement("label");

        scaleLabel.innerHTML = "Render Scale: <br>";
        scaleLabel.appendChild(scaleInput);

        scaleInput.type = "number";
        scaleInput.min = 10;
        scaleInput.max = 100;
        scaleInput.style.fontSize = "25px";
        scaleInput.style.width = "100%";
        scaleInput.value = parseFloat(localStorage.getItem("bc-scale")) * 100;
        scaleInput.addEventListener("change", function () {
            localStorage.setItem("bc-scale", parseFloat(this.value) / 100);
            _amOT.RedrawViz();
        });

        fullscreenBtn.innerHTML = "Fullscreen";
        fullscreenBtn.addEventListener("click", function () {
            _amOT.ToggleFullscreen();
        });
        fullscreenBtn.style.background = "var(--genericJoeColor)";
        fullscreenBtn.style.borderRadius = "4px";
        fullscreenBtn.style.padding = "8px 0px 8px 0px";
        fullscreenBtn.style.width = "100%";
        fullscreenBtn.style.fontWeight = "bold";
        fullscreenBtn.style.margin = "12px 0px 0px 0px";

        preLabel.innerHTML = "Preset: <br>";
        preLabel.appendChild(preSelect);
        Object.keys(_amOT.viz.presets).forEach(function (b, a) {
            let opt = document.createElement("option");
            opt.innerHTML = b;
            opt.value = b;
            preSelect.appendChild(opt);
        });

        preLabel.style.width = "100%";
        preSelect.size = 20;
        preSelect.style.fontFamily = "SF Pro Text";
        preSelect.style.outline = "none!important";
        preSelect.style.fontSize = "18px";
        preSelect.style.width = "100%";
        preSelect.value = localStorage.getItem("bc-selected");
        preSelect.addEventListener("change", function () {
            _amOT.viz.visualizer.loadPreset(_amOT.viz.presets[this.value]);
            localStorage.setItem("bc-selected", this.value);
        });

        content.appendChild(preLabel);
        content.appendChild(scaleLabel);
        content.appendChild(document.createElement("br"));
        content.appendChild(fullscreenBtn);
        _amOT.popup_generic({
            title: "Butterchurn Visualizer",
            content: content,
            transparentBg: true,
            backdropStyle: {
                justifyContent: "left"
            },
            windowStyle: {
                "margin-left": "16px"
            }
        });
    },
    RedrawViz: function () {
        _amOT.viz.canvas.width = window.innerWidth * parseFloat(localStorage.getItem("bc-scale"));
        _amOT.viz.canvas.height = window.innerHeight * parseFloat(localStorage.getItem("bc-scale"));
        _amOT.viz.visualizer.setRendererSize(window.innerWidth * parseFloat(localStorage.getItem("bc-scale")), window.innerHeight * parseFloat(localStorage.getItem("bc-scale")));
    },
    StartViz: function () {
        if (!_amOT.eqReady) {
            alert("Audio is not ready, Play a song to use this function.");
            return;
        }
        if (!localStorage.getItem("bc-notice")) {
            let about = document.createElement("p");
            about.innerHTML = `<b>Single click</b> - Show controls<br><b>Double click / Right click</b> - Show settings`;
            _amOT.popup_generic({
                title: "Butterchurn Viz",
                content: about,
                closefn: function () {
                    localStorage.setItem("bc-notice", "1");
                }
            });
        }

        if (!localStorage.getItem("bc-scale")) {
            localStorage.setItem("bc-scale", "1.0");
        }

        _amOT.viz.scale = parseFloat(localStorage.getItem("bc-scale"));
        _amOT.viz.running = true;
        _amOT.viz.canvas.style.display = "";

        if (!_amOT.viz.ready) {
            window.onresize = function (event) {
                _amOT.RedrawViz();
            };
            if (!localStorage.getItem("bc-selected")) {
                localStorage.setItem("bc-selected", 'Flexi, martin + geiss - dedicated to the sherwin maxawow');
            }
            _amOT.viz.canvas.style.width = "100%";
            _amOT.viz.canvas.style.height = "100%";
            _amOT.viz.canvas.style.position = "fixed";
            _amOT.viz.canvas.style.zIndex = "9999";
            _amOT.viz.canvas.style.bottom = "0px";
            _amOT.viz.canvas.style.left = "0px";
            _amOT.viz.canvas.style.transition = "bottom 0.5s ease 0s, left 0.5s ease 0s";
            _amOT.viz.lowered = false;
            _amOT.viz.canvas.addEventListener("click", function () {
                if (!_amOT.viz.lowered) {
                    _amOT.viz.lowered = true;
                    setTimeout(function () {
                        document.getElementsByClassName("web-chrome-playback-controls__up-next-btn")[0].dispatchEvent(new Event("click"))
                    }, 500);
                    _amOT.viz.canvas.style.bottom = "-55px";
                    _amOT.viz.canvas.style.left = "-300px";
                    _amOT.viz.canvas.style.cursor = "";
                } else {
                    _amOT.viz.lowered = false;
                    document.getElementsByClassName("web-chrome-playback-controls__up-next-btn")[0].dispatchEvent(new Event("click"));
                    _amOT.viz.canvas.style.bottom = "0";
                    _amOT.viz.canvas.style.left = "0";
                    _amOT.viz.canvas.style.cursor = "none";
                }
            });
            _amOT.viz.canvas.addEventListener("dblclick", function () {
                _amOT.VizConfig();
            });
            _amOT.viz.canvas.addEventListener("contextmenu", function (e) {
                e.preventDefault();
                _amOT.VizConfig();
            });
            _amOT.viz.presets = Object.assign({},
                butterchurnPresets.getPresets(),
                butterchurnPresetsExtra.getPresets(),
                butterchurnPresetsExtra2.getPresets());
            _amOT.viz.preset = _amOT.viz.presets[localStorage.getItem("bc-selected")];
            document.body.appendChild(_amOT.viz.canvas);
            _amOT.viz.visualizer = butterchurn.default.createVisualizer(AMEx.context, _amOT.viz.canvas, {
                width: 800,
                height: 600,
                mesh_width: 64,
                mesh_height: 48,
                pixelRatio: window.devicePixelRatio || 1,
                textureRatio: 1
            });

            _amOT.viz.visualizer.loadExtraImages(butterchurnExtraImages.default.getImages());
            _amOT.viz.visualizer.connectAudio(AMEx.result.source);
            _amOT.viz.visualizer.loadPreset(_amOT.viz.presets[localStorage.getItem("bc-selected")], 0.0);

        }

        function startRenderer() {
            if (_amOT.viz.running) {
                requestAnimationFrame(() => startRenderer());
                _amOT.viz.visualizer.render();
            }
        }
        startRenderer();
        _amOT.RedrawViz();

        if (!_amOT.viz.ready) {
            _amOT.viz.ready = true;
        }
    },
    fInit: false,
    eqReady: false,
    init: function (cb = function () {}) {
        _amOT.fInit = true;
        var searchInt = setInterval(function () {
            if (document.getElementById("apple-music-player")) {
                _amOT.eqReady = true;
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
        var context = new(window.AudioContext || window.webkitAudioContext),
            result = {
                context: context,
                source: context.createMediaElementSource(mediaElem),
                gain: context.createGain(),
                media: mediaElem,
                amplify: function (multiplier) {
                    result.gain.gain.value = multiplier;
                },
                getAmpLevel: function () {
                    return result.gain.gain.value;
                }
            };
        AMEx.context = context;
        AMEx.result = result;
        result.source.connect(result.gain);
        result.gain.connect(context.destination);
        result.amplify(multiplier);
        return result;
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
        var x = AMEx.context.createScriptProcessor(16384,1,1);

        x.onaudioprocess = function(e){
            if (!override){
            console.log('hmm');
            var u = e.inputBuffer.getChannelData(0);
            console.log(u);
            ipcRenderer.send('writePCM',u);
        }
        };
        AMEx.result.source.connect(x);x.connect(AMEx.context.destination);
    }
};


var loadJS = function (url, fn = () => {}, location = document.body) {
    var scriptTag = document.createElement('script');
    scriptTag.src = url;

    scriptTag.onload = fn;
    scriptTag.onreadystatechange = fn;

    location.appendChild(scriptTag);
};

loadJS("https://unpkg.com/butterchurn@2.6.7/lib/butterchurn.min.js");
loadJS("https://unpkg.com/butterchurn-presets@2.4.7/lib/butterchurnPresets.min.js");
loadJS("https://unpkg.com/butterchurn-presets@2.4.7/lib/butterchurnPresetsExtra.min.js");
loadJS("https://unpkg.com/butterchurn-presets@2.4.7/lib/butterchurnPresetsExtra2.min.js");
loadJS("https://rekt.network/static/js/butterchurn/butterchurnExtraImages.min.js");


document.addEventListener('keydown', function (event) {
    if (event.ctrlKey || event.metaKey) {
        switch (String.fromCharCode(event.which).toLowerCase()) {
            case '1':
                _amOT.VizToggle();
                break;
            case "2":
                _amOT.ShowEQ();
                break;
            case "3":
                (override) ? (override = false) : (override = true);
                break;    
        }
    }
});

_amOT.init();
