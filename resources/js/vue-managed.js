const vue = require("./vue")

var _vues = {
    instances: [],
    killVue(id) {
        let self = this
        this.instances.filter((instance) => {
            if (instance["_amID"] == id) {
                instance.$destroy()
            }
        })
    },
    killAll() {
        this.instances.forEach((instance) => {
            instance.$destroy()
            instance = null
        })
        this.instances = []
    }
}

class AMEVue {
    constructor(options = {}) {
        var newVue = new Vue(options)
        newVue._amID = this.getID()
        _vues.instances.push(newVue)
    }
    getID() {
        var S4 = function () {
            return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1)
        }
        return (S4() + S4() + "-" + S4() + "-" + S4() + "-" + S4() + "-" + S4() + S4() + S4())
    }
}