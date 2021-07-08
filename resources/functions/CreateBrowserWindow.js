const { app, BrowserWindow } = require('electron')
const { join } = require('path')
const glasstron = require('glasstron');

exports.CreateBrowserWindow = function() {
    console.log('[CreateBrowserWindow] Initializing Browser Window Creation.')
    const options = {
        icon: join(__dirname, `../icons/icon.ico`),
        width: 1024,
        height: 600,
        minWidth: ((app.config.css.emulateMacOS || app.config.css.emulateMacOS_rightAlign) ? ((app.config.css.streamerMode) ? 400 : 300) : ((app.config.css.streamerMode) ? 400 : 300)),
        minHeight: ((app.config.css.emulateMacOS || app.config.css.emulateMacOS_rightAlign) ? ((app.config.css.streamerMode) ? 55 : 300) : ((app.config.css.streamerMode) ? 115 : 300)),
        frame: ((!(app.config.css.emulateMacOS || app.config.css.emulateMacOS_rightAlign))),
        title: "Apple Music",
        // Enables DRM
        webPreferences: {
            plugins: true,
            preload: join(__dirname, '../js/MusicKitInterop.js'),
            allowRunningInsecureContent: !app.config.login.authMode.indexOf(true),
            contextIsolation: false,
            webSecurity: app.config.quick.authMode.indexOf(true),
            sandbox: true
        }
    };

    let win;
    if (!app.config.css.transparencyMode.indexOf(true)) {
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


    if (!app.config.advanced.menuBarVisible.indexOf(true)) win.setMenuBarVisibility(false); // Hide that nasty menu bar
    if (!app.config.advanced.enableDevTools.indexOf(true)) win.setMenu(null); // Disables DevTools

    return win
}