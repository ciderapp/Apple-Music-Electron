const {app, BrowserWindow, nativeTheme} = require('electron')
const {join} = require('path')
const os = require('os')
const fs = require('fs')
const {Analytics} = require("./analytics/sentry");
const {SetContextMenu} = require('./win/SetContextMenu')
let win, acrylicWindow;
Analytics.init()

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

    isVibrancySupported: function () {
        // Windows 10 or greater
        return (
            process.platform === 'win32' &&
            parseInt(os.release().split('.')[0]) >= 10
        )
    },

    fetchAcrylicTheme: function () {
        let acrylicTheme;
        if (app.preferences.value('visual.theme') && app.preferences.value('visual.theme') !== "default") {
            acrylicTheme = BrowserWindowCreation.fetchTransparencyColor(app.preferences.value('visual.theme'))
        } else if (app.preferences.value('visual.theme') === "default") {
            acrylicTheme = (nativeTheme.shouldUseDarkColors ? '#0f0f0f10' : '#ffffff10')
        }

        if (!acrylicTheme) { // If no transparency color can be found in the theme file or the theme isn't default
            acrylicTheme = (nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
        }

        return acrylicTheme
    },

    fetchTransparencyOptions: function () {
        let transparencyOptions, transparencyTheme;
        console.log('[fetchTransparencyOptions] Fetching Transparency Options')

        // Set the Transparency Options
        if (app.preferences.value('visual.transparencyEffect') && app.preferences.value('visual.transparencyEffect') !== 'disabled' && process.platform !== "linux") {

            // If a Custom Theme is being used
            if (app.preferences.value('visual.transparencyTheme') === 'appearance-based') {
                transparencyTheme = BrowserWindowCreation.fetchAcrylicTheme()
            } else {
                transparencyTheme = app.preferences.value('visual.transparencyTheme');
            }

            transparencyOptions = {
                theme: transparencyTheme,
                effect: app.preferences.value('visual.transparencyEffect'),
                debug: app.preferences.value('advanced.devTools') !== '',
            }

            if (BrowserWindowCreation.isVibrancySupported()) {
                if (app.preferences.value('visual.transparencyEffect') === 'acrylic') {
                    transparencyOptions.disableOnBlur = !!app.preferences.value('visual.transparencyDisableBlur').includes(true);
                }
            } else {
                if (app.preferences.value('visual.transparencyEffect') === 'acrylic') {
                    app.preferences.value('visual.transparencyEffect', 'blur')
                    transparencyOptions.effect = 'blur'
                }
            }

            if (app.preferences.value('visual.transparencyMaximumRefreshRate')) {
                transparencyOptions.useCustomWindowRefreshMethod = true
                transparencyOptions.maximumRefreshRate = app.preferences.value('visual.transparencyMaximumRefreshRate')
            }

            app.transparency = true
        } else {
            app.transparency = false
        }

        console.log(`[fetchTransparencyOptions] Returning: ${transparencyOptions}`)
        return transparencyOptions
    },

    CreateBrowserWindow: function() {
        console.log('[CreateBrowserWindow] Initializing Browser Window Creation.')

        let minWide, minHigh, Frame;
        if (app.preferences.value('visual.emulateMacOS').includes('left') || app.preferences.value('visual.emulateMacOS').includes('right') || app.preferences.value('advanced.forceDisableWindowFrame').includes(true)) {
            Frame = false;
            minWide = app.preferences.value('visual.streamerMode').includes(true) ? 400 : 300;
            minHigh = app.preferences.value('visual.streamerMode').includes(true) ? 55 : 300;
        } else {
            Frame = true;
            minWide = app.preferences.value('visual.streamerMode').includes(true) ? 400 : 300;
            minHigh = app.preferences.value('visual.streamerMode').includes(true) ? 115 : 300;
        }

        const options = {
            icon: join(__dirname, `../icons/icon.ico`),
            width: 1024,
            height: 600,
            minWidth: minWide,
            minHeight: minHigh,
            frame: Frame,
            title: "Apple Music",
            useContentSize: true,
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

        const transparencyOptions = BrowserWindowCreation.fetchTransparencyOptions()

        // BrowserWindow Creation
        if (app.transparency) {
            acrylicWindow = require("electron-acrylic-window");
            console.log('[CreateBrowserWindow] Creating BrowserWindow with transparency. Transparency Options:')
            console.log(transparencyOptions)
            options.vibrancy = transparencyOptions
            win = new acrylicWindow.BrowserWindow(options)
        } else {
            console.log('[CreateBrowserWindow] Creating BrowserWindow.')
            win = new BrowserWindow(options);
            win.setBackgroundColor = '#1f1f1f00'
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

        // Detect if the application has been opened with --minimized
        if (app.commandLine.hasSwitch('minimized')) {
            console.log("[Apple-Music-Electron] Application opened with --minimized");
            if (typeof win.minimize === 'function') {
                win.minimize();
            }
        }

        // Detect if the application has been opened with --hidden
        if (app.commandLine.hasSwitch('hidden')) {
            console.log("[Apple-Music-Electron] Application opened with --hidden");
            if (typeof win.hide === 'function') {
                win.hide();
                SetContextMenu()
            }
        }

        return win
    }

}

module.exports = BrowserWindowCreation