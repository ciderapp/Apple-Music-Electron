const {app} = require('electron')
const {join} = require('path')
const {Analytics} = require("../analytics/sentry");
Analytics.init()

exports.InitializeBase = function () {
    console.log('[InitializeBase] Started.')

    // Set proper cache folder
    app.setPath("userData", join(app.getPath("cache"), app.name))

    // Disable CORS
    app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')

    // Media Key Hijacking
    if (app.preferences.value('advanced.preventMediaKeyHijacking').includes(true)) {
        console.log("[Apple-Music-Electron] Hardware Media Key Handling disabled.")
        app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,MediaSessionService');
    }

    // Sets the ModelId (For windows notifications)
    if (process.platform === "win32") app.setAppUserModelId("Apple Music");

    // Disable the Media Session to allow MPRIS to be the primary service
    if (process.platform === "linux") app.commandLine.appendSwitch('disable-features', 'MediaSessionService');

    // Assign Default Variables
    app.isQuiting = !app.preferences.value('window.closeButtonMinimize').includes(true);
    app.win = '';
    app.ipc = {existingNotification: false};

    // Detects if the application has been opened with --force-quit
    if (app.commandLine.hasSwitch('force-quit')) {
        console.log("[Apple-Music-Electron] User has closed the application via --force-quit")
        app.quit()
    }

    // Set Max Listener
    require('events').EventEmitter.defaultMaxListeners = Infinity;
}