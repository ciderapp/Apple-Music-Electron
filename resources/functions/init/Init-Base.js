const {app} = require('electron')
const {join} = require('path')
const Sentry = require('@sentry/electron');
if (app.preferences.value('general.analyticsEnabled').includes(true)) {
    Sentry.init({ dsn: "https://20e1c34b19d54dfcb8231e3ef7975240@o954055.ingest.sentry.io/5903033" });
}

exports.InitializeBase = function () {
    console.log('[InitializeBase] Started.')

    // Set proper cache folder
    app.setPath("userData", join(app.getPath("cache"), app.name))

    // Disable CORS
    if (app.preferences.value('general.authMode').includes(true)) {
        console.log("[Apple-Music-Electron] Application started wth disable CORS.")
        app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
    }

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

    // Init
    const {InitializeAutoUpdater} = require('./Init-AutoUpdater')
    InitializeAutoUpdater()

    // Set Max Listener
    require('events').EventEmitter.defaultMaxListeners = Infinity;
}