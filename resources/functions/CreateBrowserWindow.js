const {app} = require('electron')
const {join} = require('path')
const glasstron = require('glasstron');

exports.CreateBrowserWindow = function () {
    console.log('[CreateBrowserWindow] Initializing Browser Window Creation.')

    let win = new glasstron.BrowserWindow({
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
    });
    win.blurType = "blurbehind";
    win.setBlur(true);

    if (process.platform !== "win32") { // Linux Append Commandline
        app.commandLine.appendSwitch("enable-transparent-visuals");
    }

    if (!app.config.advanced.menuBarVisible) win.setMenuBarVisibility(false); // Hide that nasty menu bar
    if (!app.config.advanced.enableDevTools) win.setMenu(null); // Disables DevTools

    return win
}