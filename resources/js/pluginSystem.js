var _plugins = {
    events: {
        Start: [],
        OnNavigation: [],
        OnSongChange: [],
        OnPlay: [],
        OnPause: [],
        OnExit: [],
        OnHide: []
    },
    loadPlugin(plugin = "") {
        if (plugin == "") {
            return
        }
        ipcRenderer.send("load-plugin", plugin)
    },
    execute(type = "Start") {
        let self = this
        if (!this.events[type]) {
            console.warn(`[Plugins] Event type: ${type} not found!`)
            return
        } else {
            console.warn(`[Plugins] Event type: ${type} called`)
        }
        this.events[type].forEach(element => {
            element()
        });
    }
};

class AMEPlugin {
    /**
     * Adds all events to the _plugins event queue
     */
    constructor() {
        _plugins.events.Start.push(this.Start);
        _plugins.events.OnNavigation.push(this.OnNavigation);
        _plugins.events.OnSongChange.push(this.OnSongChange);
        _plugins.events.OnPlay.push(this.OnPlay);
        _plugins.events.OnPause.push(this.OnPause);
        _plugins.events.OnExit.push(this.OnExit);
        _plugins.events.OnHide.push(this.OnHide);
    }
    /**
     * Excutes when the web player has fully loaded
     */
    Start() {}
    /**
     * Executes when songs resumes
     */
    OnPlay() {}
    /**
     * Executes when song is resumed
     */
    OnPause() {}
    /**
     * Executes when the user changes pages on the site or opens a context menu
     * ex: Songs to Playlist screen
     */
    OnNavigation() {}
    /**
     * Executes when a song changes
     */
    OnSongChange() {}
    /**
     * Executes when the application exits
     */
    OnExit() {}
    /**
     * Executes when the application is hidden to the taskbar
     */
    OnHide() {}
    /**
     * Adds a menu item to the profile menu
     */
    AddMenuItem() {

    }
    /**
     * Adds a button to the web chrome after the volume meter 
     */
    AddChromeButton({
        text = "",
        style = {},
        onclick = () => {}
    }) {
        var btn = document.createElement("button")
        btn.classList.add("button-reset")
        var btnStyle = {
            width: 38
        }
    }
}