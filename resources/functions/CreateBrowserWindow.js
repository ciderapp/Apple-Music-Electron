const {app, BrowserWindow} = require('electron')
const {join} = require('path')
const glasstron = require('glasstron');

exports.CreateBrowserWindow = function () {
    console.log('[CreateBrowserWindow] Initializing Browser Window Creation.')
    let win;
    const options = {
        icon: join(__dirname, `../icons/icon.ico`),
        width: 1024,
        height: 600,
        minWidth: 300,
        minHeight: 300,
        frame: false,
        transparent: true,
        title: "Apple Music",
        // Enables DRM
        webPreferences: {
            plugins: true,
            preload: join(__dirname, '../js/MusicKitInterop.js'),
            allowRunningInsecureContent: true,
            contextIsolation: false,
            webSecurity: false,
            sandbox: true
        }
    };

    if (app.config.css.glasstron) { // Glasstron Theme Window Creation
        if (process.platform !== "win32") app.commandLine.appendSwitch("enable-transparent-visuals");
        win = new glasstron.BrowserWindow(options)
        win.blurType = "blurbehind";
        win.setBlur(true);
    } else {
        win = new BrowserWindow(options)
        win.setBackgroundColor = '#1f1f1f00'
    }

    if (!app.config.advanced.menuBarVisible) win.setMenuBarVisibility(false); // Hide that nasty menu bar
    if (!app.config.advanced.enableDevTools) win.setMenu(null); // Disables DevTools

    return win
}