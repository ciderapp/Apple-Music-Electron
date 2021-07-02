const {app} = require('electron')
const {join} = require('path')
const {InitializeAutoUpdater} = require('./Init-AutoUpdater')



exports.InitializeBase = function () {
    console.log('[InitializeBase] Started.')
    // Set proper cache folder
    app.setPath("userData", join(app.getPath("cache"), app.name))

    // Detects if the application has been opened with --force-quit
    if (app.commandLine.hasSwitch('force-quit')) {
        console.log("[Apple-Music-Electron] User has closed the application via --force-quit")
        app.quit()
    }

    // Hide the Application with Startup Params
    if (app.commandLine.hasSwitch('hidden')) {
        console.log("[Apple-Music-Electron] Application hidden with --hidden")
        app.hide()
    }

    // Disable CORS (NO LONGER REQUIRED Thanks Apple ❤️)
    if (app.config.advanced.disableCORS) app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

    // Media Key Hijacking
    if (app.config.advanced.preventMediaKeyHijacking) app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling');

    // Sets the ModelId (For windows notifications)
    if (process.platform === "win32") app.setAppUserModelId("Apple Music");

    // Assign Default Variables
    app.isQuiting = !app.config.preferences.closeButtonMinimize;
    app.config.css.glasstron = app.config.preferences.cssTheme.toLowerCase().split('-').includes('glasstron');
    app.win = '';
    app.ipc = {
        ThumbarUpdate: true,
        TooltipUpdate: true,
        DiscordUpdate: true,
        MprisUpdate: true,
        MprisStatusUpdate: true,
        MediaNotification: true,
        cache: false,
        cacheNew: false,
        existingNotification: false
    };
    app.discord = {client: false, error: false, cachedAttributes: false};
    app.mpris = {}


    // Init
    InitializeAutoUpdater()
}