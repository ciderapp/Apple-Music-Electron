const {app, BrowserWindow} = require('electron')
const {join} = require('path')
const glasstron = require('glasstron');

exports.CreateBrowserWindow = function () {
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
            allowRunningInsecureContent: true,
            contextIsolation: false,
            webSecurity: false,
            sandbox: true
        }
    };

    let win;
    if (app.config.advanced.forceDisableGlasstron) {
        win = new BrowserWindow(options)
        win.setBackgroundColor = '#1f1f1f00'
        app.isUsingGlasstron = false
    } else {
        if (process.platform === "linux") {app.commandLine.appendSwitch("enable-transparent-visuals");} // Linux Append Commandline
        win = new glasstron.BrowserWindow(options)
        win.setBlur(true);
        if (process.platform === "win32") {win.blurType = "blurbehind";} // blurType only works on Windows
        app.isUsingGlasstron = true
    }


    if (!app.config.advanced.menuBarVisible) win.setMenuBarVisibility(false); // Hide that nasty menu bar
    if (!app.config.advanced.enableDevTools) win.setMenu(null); // Disables DevTools

    return win
}