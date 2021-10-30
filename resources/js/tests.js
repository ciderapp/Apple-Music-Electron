var _tests = {
    usermenuinit() {
        // MOVE ME ONCE IMPLEMENTED!

        // Clone the user menu
        var umClone = document.querySelector(".web-chrome-controls-container>.web-navigation__auth").cloneNode(true)
        // Hide the existing menu
        document.querySelector(".web-chrome-controls-container>.web-navigation__auth").style.display = "none"
        // Append cloned menu
        document.querySelector(".web-chrome-controls-container").append(umClone)
        // Set cloned menu events
        umClone.addEventListener("click", ()=>{
            _tests.usermenu()
        })
    },
    usermenu() {
        // MOVE ME ONCE IMPLEMENTED!
        AMJavaScript.getRequest("ameres://html/usermenu.html", (content) => {
            var vm = new Vue({
                data: {
                    menuitems: [
                        {
                            label: "Help",
                            icon: "",
                            onclick: ()=>{ window.open(`https://support.apple.com/guide/music-web`) }
                        },
                        {
                            label: "Discord",
                            icon: "",
                            onclick: ()=>{ window.open(`https://discord.gg/CezHYdXHEM`) }
                        },
                        {
                            label: "Account Settings",
                            icon: "",
                            onclick:()=>{ window.open(`https://music.apple.com/account/settings`) }
                        },
                        {
                            label: "Preferences",
                            icon: "",
                            onclick: ()=>{
                                history.pushState("settings", "Settings", "/account/settings/")
                                window.location.href = "#"
                            }
                        },
                        {
                            label: "Sign Out",
                            icon: "",
                            style: {
                                color: "var(--systemRed)"
                            },
                            onclick: ()=>{ MusicKit.getInstance().unauthorize() }
                        }
                    ]
                },
                methods: {
                    close() {
                        modal.close()
                    }
                }
            })
            var modal = new AMEModal({
                content: content,
                CloseButton: false,
                ModalClasses: ["ameUserMenu"],
                BackdropStyle: {
                    background: "transparent"
                },
                Style: {
                    height: "auto",
                    width: "200px",
                    position: "absolute",
                    top: "55px",
                    right: "142px"
                },
                OnCreate() {
                    vm.$mount("#usermenu-vue")
                },
                OnClose() {
                    _vues.destroy(vm)
                }
            })
        })
    },
    zoo() {
        AMJavaScript.getRequest("ameres://html/zoo.html", (content) => {
            var modal = new AMEModal({
                content: content
            })
        })
    },
    castUI() {
        // MOVE ME ONCE IMPLEMENTED!

        AMJavaScript.getRequest("ameres://html/cast_device.html", (content) => {
            var vm = new Vue({
                data: {
                    devices: {
                        cast: [],
                        airplay: []
                    }
                },
                methods: {
                    scan() {
                        console.log("SCANNING")
                        let self = this
                        AudioOutputs.getGCDevices()
                        this.devices.cast = ipcRenderer.sendSync("getKnownCastDevices")
                        console.log(this.devices)
                        vm.$forceUpdate()
                    },
                    setCast(device) {
                        AudioOutputs.playGC(device)
                    }
                }
            })
            var modal = new AMEModal({
                content: content,
                Style: {
                    maxWidth: "600px"
                },
                OnCreate() {
                    vm.$mount("#castdevices-vue")
                },
                OnClose() {
                    _vues.destroy(vm)
                }
            })
        })
    },
    outputDevice() {
        AMJavaScript.getRequest("ameres://html/outputdevice.html", (content) => {
            var vm = new Vue({
                data: {
                    selected: "",
                    audio: document.querySelector("#apple-music-player"),
                    devices: []
                },
                methods: {
                    setOutputDevice(id) {
                        if (this.audio) {
                            selected = id
                            sessionStorage.setItem("outputDevice", id)
                            this.audio.setSinkId(id)
                        }
                    }
                }
            })
            var modal = new AMEModal({
                content: content,
                Style: {
                    width: "30%",
                    minWidth: "500px"
                },
                OnCreate() {
                    vm.$mount("#outputdevices-vue")
                    if (vm.audio) {
                        vm.selected = audio.sinkId
                    } else {
                        vm.selected = "default"
                    }
                    navigator.mediaDevices.enumerateDevices()
                        .then(function (devices) {
                            vm.devices = devices.filter((device) => {
                                if (device.kind == "audiooutput") {
                                    return device
                                }
                            })
                        })
                        .catch(function (err) {
                            console.log(err.name + ": " + err.message)
                        })
                },
                OnClose() {
                    _vues.destroy(vm)
                }
            })
        })
    },
    stats() {
        var container = document.createElement("div")
        var frameRate = document.createElement("div")
        var listeners = document.createElement("div")
        Object.assign(container.style,
            {
                textAlign: "center",
                position: "absolute",
                fontSize: "18px",
                bottom: "16px",
                right: "16px",
                pointerEvents: "none",
                zIndex: 99991,
                color: "white",
                webkitTextStroke: "0.2px black"
            })
        document.body.appendChild(container)
        container.appendChild(frameRate)
        container.appendChild(listeners)

        const times = [];
        let fps;

        function refreshLoop() {
            window.requestAnimationFrame(() => {
                const now = performance.now();
                while (times.length > 0 && times[0] <= now - 1000) {
                    times.shift();
                }
                times.push(now);
                fps = times.length;
                frameRate.innerText = `${fps} FPS`
                refreshLoop();
            });
        }

        refreshLoop();
    },
    oobe(skipIntro = false, closeBtn = false) {
        // MOVE ME ONCE IMPLEMENTED!

        AMJavaScript.getRequest("ameres://html/oobe.html", (content) => {
            var vm = new Vue({
                data: {
                    prefs: {
                        general: {
                            storefront: "us",
                            discordRPC: "",
                            analyticsEnabled: true
                        },
                        visual: {
                            theme: "",
                            transparencyEffect: "",
                            useOperatingSystemAccent: false,
                            scaling: 1,
                            mxmon: false,
                            yton: false,
                            mxmlanguage: "en",
                            removeScrollbars: true
                        },
                        audio: {
                            audioQuality: "auto",
                            seemlessAudioTransitions: true
                        },
                        window: {
                            closeButtonMinimize: true
                        }
                    },
                    page: "intro",
                },
                methods: {
                    btn() {
                        console.info("Button clicked")
                    },
                    getPrefs() {
                        let self = this
                        ipcRenderer.invoke("getStoreValue", "audio.audioQuality").then((result) => {
                            self.prefs.audio.audioQuality = result
                        })

                        ipcRenderer.invoke("getStoreValue", "audio.seemlessAudioTransitions").then((result) => {
                            self.prefs.audio.seemlessAudioTransitions = result
                        })

                        ipcRenderer.invoke("getStoreValue", "general.storefront").then((result) => {
                            self.prefs.general.storefront = result
                        })

                        ipcRenderer.invoke("getStoreValue", "general.discordRPC").then((result) => {
                            self.prefs.general.discordRPC = result
                        })

                        ipcRenderer.invoke("getStoreValue", "general.analyticsEnabled").then((result) => {
                            self.prefs.general.analyticsEnabled = result
                        })

                        ipcRenderer.invoke("getStoreValue", "window.closeButtonMinimize").then((result) => {
                            self.prefs.window.closeButtonMinimize = result
                        })

                        ipcRenderer.invoke("getStoreValue", "visual.theme").then((result) => {
                            self.prefs.visual.theme = result
                        })

                        ipcRenderer.invoke("getStoreValue", "visual.transparencyEffect").then((result) => {
                            self.prefs.visual.transparencyEffect = result
                        })

                        ipcRenderer.invoke("getStoreValue", "visual.useOperatingSystemAccent").then((result) => {
                            self.prefs.visual.useOperatingSystemAccent = result
                        })

                        ipcRenderer.invoke("getStoreValue", "visual.mxmon").then((result) => {
                            self.prefs.visual.mxmon = result
                        })

                        ipcRenderer.invoke("getStoreValue", "visual.yton").then((result) => {
                            self.prefs.visual.yton = result
                        })

                        ipcRenderer.invoke("getStoreValue", "visual.mxmlanguage").then((result) => {
                            self.prefs.visual.mxmlanguage = result
                        })

                        ipcRenderer.invoke("getStoreValue", "visual.removeScrollbars").then((result) => {
                            self.prefs.visual.removeScrollbars = result
                        })
                    },
                    setPrefs() {
                        let self = this
                        ipcRenderer.invoke("setStoreValue", "audio.audioQuality", self.prefs.audio.audioQuality)
                        ipcRenderer.invoke("setStoreValue", "audio.seemlessAudioTransitions", self.prefs.audio.seemlessAudioTransitions)
                        ipcRenderer.invoke("setStoreValue", "general.storefront", self.prefs.general.storefront)
                        ipcRenderer.invoke("setStoreValue", "general.discordRPC", self.prefs.general.discordRPC)
                        ipcRenderer.invoke("setStoreValue", "general.analyticsEnabled", self.prefs.general.analyticsEnabled)
                        ipcRenderer.invoke("setStoreValue", "window.closeButtonMinimize", self.prefs.window.closeButtonMinimize)
                        ipcRenderer.invoke("setStoreValue", "visual.theme", self.prefs.visual.theme)
                        ipcRenderer.invoke("setStoreValue", "visual.transparencyEffect", self.prefs.visual.transparencyEffect)
                        ipcRenderer.invoke("setStoreValue", "visual.useOperatingSystemAccent", self.prefs.visual.useOperatingSystemAccent)
                        ipcRenderer.invoke("setStoreValue", "visual.mxmon", self.prefs.visual.mxmon)
                        ipcRenderer.invoke("setStoreValue", "visual.yton", self.prefs.visual.yton)
                        ipcRenderer.invoke("setStoreValue", "visual.mxmlanguage", self.prefs.visual.mxmlanguage)
                        ipcRenderer.invoke("setStoreValue", "visual.removeScrollbars", self.prefs.visual.removeScrollbars)
                    },
                    promptRelaunch() {
                        var relaunch = confirm(
                            "Relaunch Required\nA relaunch is required in order for the settings you have changed to apply."
                        )
                        if (relaunch) {
                            ipcRenderer.send("relaunchApp")
                        }
                    },
                    close() {
                        this.setPrefs()
                        // this.promptRelaunch()
                        modal.close()
                    },
                    init() {
                        let self = this
                        document.getElementById('introVideo').addEventListener('ended', () => {
                            self.page = "welcome"
                        }, false);
                        this.getPrefs()
                    },
                    enableBlur() {
                        modal.setStyle("backdrop", {
                            backdropFilter: "blur(16px) saturate(180%)"
                        })
                    },
                    disableBlur() {
                        modal.setStyle("backdrop", {
                            backdropFilter: "blur(0px)"
                        })
                    }
                }
            })
            var modal = new AMEModal({
                content: content,
                CloseButton: closeBtn,
                Dismissible: closeBtn,
                OnCreate() {
                    vm.$mount("#oobe-vue")
                    if (skipIntro) {
                        vm.page = "welcome"
                    } else {
                        vm.init()
                    }
                },
                OnClose() {
                    _vues.destroy(vm);
                    if (!MusicKit.getInstance().isAuthorized) {
                        MusicKit.getInstance().authorize();
                    }
                }
            })
        })
    }
};

if (ipcRenderer.sendSync('showOOBE')) {
    setTimeout(() => {
        _tests.oobe();
    }, 200)
}
