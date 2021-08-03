const {app, BrowserWindow} = require('electron')
const {join} = require('path')
const glasstron = require('glasstron');

exports.CreateBrowserWindow = function () {
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

    let win;
    if (!app.preferences.value('visual.transparencyMode').includes(true)) {
        console.log('[CreateBrowserWindow] Creating Window without Glasstron')
        win = new BrowserWindow(options)
        win.setBackgroundColor = '#1f1f1f00'
        app.isUsingGlasstron = false
    } else {
        console.log('[CreateBrowserWindow] Creating Window with Glasstron')
        if (process.platform === "linux") app.commandLine.appendSwitch("enable-transparent-visuals"); // Linux Append Commandline
        win = new glasstron.BrowserWindow(options)
        if (process.platform === "win32") win.blurType = "blurbehind"; // blurType only works on Windows
        if (process.platform === "darwin") win.setVibrancy('under-window'); // setVibrancy only works on macOS

        win.setBlur(true);
        app.isUsingGlasstron = true
    }

    if (!app.preferences.value('advanced.alwaysOnTop').includes(true)) {
        win.setAlwaysOnTop(false)
    } else {
        win.setAlwaysOnTop(true)
    } // Enables always on top
    if (!app.preferences.value('advanced.menuBarVisible').includes(true)) win.setMenuBarVisibility(false); // Hide that nasty menu bar
    if (!app.preferences.value('advanced.enableDevTools').includes(true)) win.setMenu(null); // Disables DevTools

    return win
}