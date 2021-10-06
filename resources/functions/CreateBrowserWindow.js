const {app, BrowserWindow, nativeTheme} = require('electron')
const {join} = require('path')
const os = require('os')
const fs = require('fs')
const windowStateKeeper = require('electron-window-state');
const acrylicWindow = require("electron-acrylic-window");
const SentryInit = require("./init").SentryInit;
SentryInit()
let win;

const BrowserWindowCreation = {

    fetchTransparencyColor: function (fileName) {
        console.log(`[fetchTransparencyColor] Fetching color from ${fileName}`)
        const hex_codes = []
        fileName = join(app.userThemesPath, `${fileName.toLowerCase()}.css`)

        if (fs.existsSync(fileName)) {
            const file = fs.readFileSync(fileName, "utf8");
            file.split(/\r?\n/).forEach((line) => {
                if (line.includes("--transparency")) {
                    hex_codes.push(line.match(/[a-f0-9]{8}/gi)); // Fetches all the hex codes
                }
            })
        }

        if (hex_codes.length === 1) {
            return `#${hex_codes[0]}`
        } else if (hex_codes.length === 2) { // This is a shitty way of doing things but I'm not gonna search for it
            if (nativeTheme.themeSource === 'dark') {
                return `#${hex_codes[0]}` // Returns the first hex code found in the file (usually in the dark mode area)
            } else {
                return `#${hex_codes[1]}`
            }
        } else {
            return false
        }
    },

    fetchTransparencyOptions: function () {
        function isVibrancySupported() {
            // Windows 10 or greater
            if (!(process.platform === 'win32' && parseInt(os.release().split('.')[0]) >= 10)) console.log('[fetchTransparencyOptions] electron-acrylic-window not supported on this operating system.');
            return (process.platform === 'win32' && parseInt(os.release().split('.')[0]) >= 10)
        }

        if (!app.preferences.value('visual.transparencyEffect') || !isVibrancySupported()) {
            app.transparency = (process.platform === 'darwin');
            return (process.platform === 'darwin' ? 'fullscreen-ui' : false)
        }

        function fetchWindowTheme(visualTheme, windowEffect) {
            if (visualTheme && visualTheme !== "default") { // Check if a theme is set and not default
                return BrowserWindowCreation.fetchTransparencyColor(app.preferences.value('visual.theme')) // This fetches the hex code from the theme file
            } else if ((!visualTheme || visualTheme === "default") && windowEffect === 'acrylic') {
                return (nativeTheme.shouldUseDarkColors ? '#3C3C4307' : '#EBEBF507')
            } else { // Fallback
                return (nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
            }
        }

        console.log('[fetchTransparencyOptions] Fetching Transparency Options')
        let transparencyOptions = {
            theme: null,
            effect: app.preferences.value('visual.transparencyEffect'),
            debug: app.preferences.value('advanced.devTools') !== '',
        }

        //------------------------------------------
        //  Disable on blur for acrylic
        //------------------------------------------
        if (app.preferences.value('visual.transparencyEffect') === 'acrylic') {
            transparencyOptions.disableOnBlur = (!!app.preferences.value('visual.transparencyDisableBlur').includes(true));
        }

        //------------------------------------------
        //  Set the transparency theme
        //------------------------------------------
        if (app.preferences.value('visual.transparencyTheme') === 'appearance-based') {
            transparencyOptions.theme = fetchWindowTheme(app.preferences.value('visual.theme'), app.preferences.value('visual.transparencyEffect'))
        } else {
            transparencyOptions.theme = app.preferences.value('visual.transparencyTheme');
        }

        //------------------------------------------
        //  Set the refresh rate
        //------------------------------------------
        if (app.preferences.value('visual.transparencyMaximumRefreshRate')) {
            transparencyOptions.useCustomWindowRefreshMethod = true
            transparencyOptions.maximumRefreshRate = app.preferences.value('visual.transparencyMaximumRefreshRate')
        }

        app.transparency = true
        console.log(`[fetchTransparencyOptions] Returning: ${JSON.stringify(transparencyOptions)}`)
        return transparencyOptions
    },

    CreateBrowserWindow: function () {
        console.log('[CreateBrowserWindow] Initializing Browser Window Creation.')
        // Set default window sizes
        const mainWindowState = windowStateKeeper({
            defaultWidth: 1024,
            defaultHeight: 600
        });

        const options = {
            icon: join(__dirname, `../icons/icon.ico`),
            width: mainWindowState.width,
            height: mainWindowState.height,
            x: mainWindowState.x,
            y: mainWindowState.y,
            minWidth: (app.preferences.value('visual.streamerMode').includes(true) ? 400 : 300),
            minHeight: ((app.preferences.value('visual.frameType') === 'mac' || app.preferences.value('visual.frameType') === 'mac-right') ? (app.preferences.value('visual.streamerMode').includes(true) ? 55 : 300) : (app.preferences.value('visual.streamerMode').includes(true) ? 115 : 300)),
            frame: (process.platform !== 'win32' && !(app.preferences.value('visual.frameType') === 'mac' || app.preferences.value('visual.frameType') === 'mac-right')),
            title: "Apple Music",
            resizable: true,
            // Enables DRM
            webPreferences: {
                plugins: true,
                preload: join(__dirname, '../js/MusicKitInterop.js'),
                allowRunningInsecureContent: true,
                nodeIntegration: false,
                nodeIntegrationInWorker: false,
                contextIsolation: false,
                webSecurity: true,
                sandbox: false,
                nativeWindowOpen: true
            }
        };

        // Fetch the transparency options
        const transparencyOptions = BrowserWindowCreation.fetchTransparencyOptions()

        if (process.platform === 'darwin' && !app.preferences.value('visual.frameType')) { // macOS Frame
            options.titleBarStyle = 'hidden'
            options.titleBarOverlay = true
            options.frame = true
            options.trafficLightPosition = {x: 20, y: 20}
            options.transparent = (!!(app.transparency && transparencyOptions))
        }

        // Create the Browser Window
        console.log('[CreateBrowserWindow] Creating BrowserWindow.')
        if (process.platform === "darwin") {
            win = new BrowserWindow(options)
        } else {
            win = new acrylicWindow.BrowserWindow(options)
        }

        // Set the transparency
        if (app.transparency && transparencyOptions) {
            console.log('[CreateBrowserWindow] Setting Virbancy')
            win.setVibrancy(transparencyOptions)
        }

        // alwaysOnTop
        if (!app.preferences.value('advanced.alwaysOnTop').includes(true)) {
            win.setAlwaysOnTop(false)
        } else {
            win.setAlwaysOnTop(true)
        }

        if (!app.preferences.value('advanced.menuBarVisible').includes(true)) win.setMenuBarVisibility(false); // Hide that nasty menu bar
        if (app.preferences.value('advanced.devTools') !== 'built-in') win.setMenu(null); // Disables DevTools
        if (app.preferences.value('advanced.devTools') === 'detached') win.webContents.openDevTools({mode: 'detach'}); // Enables Detached DevTools

        // Register listeners on Window to track size and position of the Window.
        mainWindowState.manage(win);

        return win
    },

}

module.exports = BrowserWindowCreation