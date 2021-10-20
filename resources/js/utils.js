var _vues = {
    instances: [],
    killVue(id) {
        let self = this
        this.instances = this.instances.filter((instance) => {
            console.warn(`Requested destroy: ${id}`)
            if (instance["_amID"] != id) {
                console.warn("Found vue")
                console.warn("Destroying Vue")
                instance.$destroy()
            } else {
                return instance
            }
        })
    },
    gc() {
        var needsGC = this.instances.every((val, i, arr) => val == undefined)
        if (needsGC) {
            this.instances = []
        }
    },
    destroy(vue) {
        vue.$destroy()
        vue = undefined
        console.info("Destroyed Vue instance")
    },
    killAll() {
        // Kill all Vue instances
        this.instances.forEach((instance) => {
            instance.$destroy()
            instance = null
        })
        this.instances = []
    }
};

class AMEModal {
    constructor({
                    content = "",
                    OnCreate = () => {
                    },
                    OnClose = () => {
                    },
                    CloseButton = true,
                    Style = {},
                    Dismissable = true
                }) {
        this.Style = Style
        this.closeButton = CloseButton
        this.content = content
        this.OnClose = OnClose
        this.OnCreate = OnCreate
        this.Dismissible = Dismissable
        this.modal = {}
        this.create()
    }

    create() {
        let self = this
        var backdrop = document.createElement("div")
        var dismissArea = document.createElement("div")
        var modalWin = document.createElement("div")
        var modalCloseBtn = document.createElement("button")
        var modalContent = document.createElement("div")
        backdrop.classList.add("ameModal-Backdrop")
        modalWin.classList.add("ameModal")
        modalCloseBtn.classList.add("ameModal-Close")
        modalCloseBtn.innerHTML = ("Close")
        modalCloseBtn.addEventListener("click", () => {
            self.close()
        })
        Object.assign(dismissArea.style, {
            width: "100%",
            height: "100%",
            position: "absolute",
            top: "0px",
            left: "0px",
            cursor: "pointer"
        })
        modalContent.style.height = "100%"
        setInnerHTML(modalContent, this.content)
        if(this.closeButton) {
            modalWin.appendChild(modalCloseBtn)
        }
        if(this.Dismissible) {
            dismissArea.addEventListener("click",()=>{
                self.close()
            }, {once: true})
            document.addEventListener("keyup", (e)=>{
                if(e.key == "Escape") {
                    self.close()
                }
            }, {once: true})
            backdrop.appendChild(dismissArea)
        }
        modalWin.appendChild(modalContent)
        backdrop.appendChild(modalWin)
        document.body.appendChild(backdrop)
        this.modal = {
            backdrop: backdrop,
            window: modalWin,
            content: modalContent,
            closeBtn: modalCloseBtn
        }
        this.OnCreate()
    }

    close() {
        this.OnClose()
        this.modal.backdrop.style.pointerEvents = "none"
        this.modal.backdrop.style.background = "transparent"
        this.modal.window.classList.add("ameModal-closing")
        setTimeout(()=>{
            this.modal.backdrop.remove()
        }, 500)
    }

    setStyle (element, style = {}) {
        if(this.modal[element]) {
            Object.assign(this.modal[element].style, style)
        }else{
            console.warn(`Undefined modal element "${element}", available modals are: "backdrop", "window", "closeBtn"`)
        }
    }

    OnCreate() {

    }

    OnClose() {

    }
};