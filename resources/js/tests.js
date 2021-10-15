var _tests = {
    oobe() {
        AMJavaScript.getRequest("ameres://html/oobe.html", (content) => {
            var vm = null
            var modal = new AMEModal({
                content: content,
                OnCreate() {
                    vm = new Vue({
                        el: "#oobe-vue",
                        data: {
                            languages: {
                                "us": "English (US)",
                                "gb": "English (UK)"
                            },
                            page: "welcome",
                            theme: preferences.visual.theme
                        },
                        methods: {
                            btn() {
                                console.info("Button clicked")
                            },
                            close() {
                                modal.close()
                            }
                        }
                    })
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