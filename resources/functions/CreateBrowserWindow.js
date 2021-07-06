const { app, BrowserWindow } = require('electron')
const { join } = require('path')
const glasstron = require('glasstron');

if (app.config.login.authMode) {
    var insecure = false;
    var websecurity = true;
} else {
    var insecure = true;
    var websecurity = false;
}

console.log(insecure)

exports.CreateBrowserWindow = function() {
    console.log('[CreateBrowserWindow] Initializing Browser Window Creation.')
    const options = {
        icon: join(__dirname, `../icons/icon.ico`),
        width: 1024,
        height: 600,
        minWidth: 300,
        minHeight: 300,
        frame: !app.config.css.emulateMacOS,
        title: "Apple Music",
        // Enables DRM
        webPreferences: {
            plugins: true,
            preload: join(__dirname, '../js/MusicKitInterop.js'),
            allowRunningInsecureContent: insecure,
            contextIsolation: false,
            webSecurity: websecurity,
            sandbox: true
        }
    };

    let win;
    if (!app.config.transparency.transparencyEnabled) {
        console.log('[CreateBrowserWindow] Creating Window without Glasstron')
        win = new BrowserWindow(options)
        win.setBackgroundColor = '#1f1f1f00'
        app.isUsingGlasstron = false
    } else {
        console.log('[CreateBrowserWindow] Creating Window with Glasstron')
        if (process.platform === "linux") app.commandLine.appendSwitch("enable-transparent-visuals"); // Linux Append Commandline
        win = new glasstron.BrowserWindow(options)
        if (process.platform === "win32") win.blurType = "blurbehind"; // blurType only works on Windows
        if (process.platform === "darwin") win.setVibrancy('under-window'); // setVibrancy only works on macoOS

        win.setBlur(true);
        app.isUsingGlasstron = true
    }


    if (!app.config.advanced.menuBarVisible) win.setMenuBarVisibility(false); // Hide that nasty menu bar
    if (!app.config.advanced.enableDevTools) win.setMenu(null); // Disables DevTools

    return win
}