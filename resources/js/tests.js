var _tests = {
    oobe(skipIntro = false) {
        AMJavaScript.getRequest("ameres://html/oobe.html", (content) => {
            var vm = null
            var modal = new AMEModal({
                content: content,
                CloseButton: false,
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
                            close() {
                                modal.close()
                            },
                            init () {
                                let self = this
                                document.getElementById('introVideo').addEventListener('ended',()=>{
                                    self.page = "welcome"
                                },false);
                            }
                        }
                    })
                    if(skipIntro) {
                        vm.page = "welcome"
                    }else{
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