var _tests = {
    usermenu() {

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
        AMJavaScript.getRequest("ameres://html/oobe/oobe.html", (content) => {
            var vm = null
            var modal = new AMEModal({
                content: content,
                CloseButton: closeBtn,
                Dismissible: !closeBtn,
                OnCreate() {
                    vm = new Vue({
                        el: "#oobe-vue",
                        data: {
                            prefs: {
                                audioQuality: "auto",
                                language: "us",
                                region: "",
                                mxm: false,
                                mxmlanguage: "en",
                                theme: preferences.visual.theme
                            },
                            page: "intro",
                        },
                        methods: {
                            btn() {
                                console.info("Button clicked")
                            },
                            setPrefs() {

                            },
                            close() {
                                modal.close()
                            },
                            init() {
                                let self = this
                                document.getElementById('introVideo').addEventListener('ended', () => {
                                    self.page = "welcome"
                                }, false);
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
                    if (skipIntro) {
                        vm.page = "welcome"
                    } else {
                        vm.init()
                    }
                },
                OnClose() {
                    _vues.destroy(vm)
                }
            })
        })
    },
    vueTest() {
        AMJavaScript.getRequest("ameres://html/vue-test.html", (content) => {
            var vm = null
            var modal = new AMEModal({
                content: content,
                OnCreate() {
                    vm = new Vue({
                        el: "#vue-model",
                        data: {
                            theme: preferences.visual.theme,
                            rangeTest: 0
                        },
                        methods: {
                            btn() {
                                console.info("Button clicked")
                            }
                        }
                    })
                },
                OnClose() {
                    _vues.destroy(vm)
                }
            })
        })
    }
}