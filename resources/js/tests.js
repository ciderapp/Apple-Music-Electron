var _tests = {
    vueTest() {
        AMJavaScript.getRequest("ameres://html/vue-test.html", (content) => {
            var modal = new AMEModal({
                content: content,
                OnCreate() {
                    this.VueModel = new AMEVue({
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
                }
            })
        })
    }
}