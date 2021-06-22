const {app, BrowserWindow} = require('electron')
const {join} = require('path')
const glasstron = require('glasstron');
const {SetThumbarButtons} = require('./win/SetThumbarButtons')

exports.CreateBrowserWindow = function () {

    let options = {
        icon: join(__dirname, `./icons/icon.ico`),
        width: 1024,
        height: 600,
        minWidth: 300,
        minHeight: 300,
        frame: !app.config.css.macosWindow,
        title: "Apple Music",
        // Enables DRM
        webPreferences: {
            plugins: true,
            preload: join(__dirname, '../js/MusicKitInterop.js'),
            allowRunningInsecureContent: app.config.advanced.allowRunningInsecureContent,
            contextIsolation: false,
            webSecurity: false,
            sandbox: true
        }
    };

    if (app.config.css.glasstron) { // Glasstron Theme Window Creation
        if (process.platform !== "win32") app.commandLine.appendSwitch("enable-transparent-visuals");
        app.win = new glasstron.BrowserWindow(options)
        app.win.blurType = "blurbehind";
        app.win.setBlur(true);

    } else {
        app.win = new BrowserWindow(options)
    }

    if (!app.config.advanced.menuBarVisible) app.win.setMenuBarVisibility(false); // Hide that nasty menu bar
    if (!app.config.advanced.enableDevTools) app.win.setMenu(null); // Disables DevTools

    SetThumbarButtons() // Set Inactive Thumbar Icons
}