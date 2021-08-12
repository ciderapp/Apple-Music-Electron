const {app, BrowserWindow} = require('electron')
const {join} = require('path')
const os = require('os')

const Sentry = require('@sentry/electron');
if (app.preferences.value('general.analyticsEnabled').includes(true)) {
    Sentry.init({ dsn: "https://20e1c34b19d54dfcb8231e3ef7975240@o954055.ingest.sentry.io/5903033" });
}

exports.CreateBrowserWindow = function () {
    console.log('[CreateBrowserWindow] Initializing Browser Window Creation.')

    function isVibrancySupported() {
        // Windows 10 or greater
        return (
            process.platform === 'win32' &&
            parseInt(os.release().split('.')[0]) >= 10
        )
    }

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
        // Enables DRM
        webPreferences: {
            plugins: true,
            preload: join(__dirname, '../js/MusicKitInterop.js'),
            allowRunningInsecureContent: !app.preferences.value('general.authMode').includes(true),
            contextIsolation: false,
            webSecurity: app.preferences.value('general.authMode').includes(true),
            sandbox: true
        }
    };

    if (app.preferences.value('visual.transparencyMode').includes(true) && !isVibrancySupported()) {
        app.preferences.value('visual.transparencyMode', [])
    }

    let win;
    if (!app.preferences.value('visual.transparencyMode').includes(true)) {
        console.log('[CreateBrowserWindow] Creating Window without Glasstron')
        win = new BrowserWindow(options)
        win.setBackgroundColor = '#1f1f1f00'
        app.isUsingGlasstron = false
    } else {
        console.log('[CreateBrowserWindow] Creating Window with electron-acrylic-window')
        const acrylicWindow = require('electron-acrylic-window');
        win = new acrylicWindow.BrowserWindow(options)
        win.setVibrancy({
            theme: app.preferences.value('visual.blurColor'),
            effect: app.preferences.value('visual.blurType'),
            disableOnBlur: app.preferences.value('visual.disableBlur')
        })
        app.isUsingGlasstron = true
        console.log('[CreateBrowserWindow] Finished Creating Window with electron-acrylic-window')
    }

    if (!app.preferences.value('advanced.alwaysOnTop').includes(true)) {
        win.setAlwaysOnTop(false)
    } else {
        win.setAlwaysOnTop(true)
    } // Enables always on top


    if (!app.preferences.value('advanced.menuBarVisible').includes(true)) win.setMenuBarVisibility(false); // Hide that nasty menu bar
    if (app.preferences.value('advanced.devTools') !== 'built-in') win.setMenu(null); // Disables DevTools
    if (app.preferences.value('advanced.devTools') === 'detached') win.webContents.openDevTools({ mode: 'detach' }); // Enables Detached DevTools

    return win
}