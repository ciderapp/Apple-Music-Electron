const {app} = require('electron')
const {join} = require('path')
const {InitializeAutoUpdater} = require('./Init-AutoUpdater')
const {InitializeLogging} = require('./Init-Logging')


exports.InitializeBase = function () {
    InitializeLogging()

    console.log('[InitializeBase] Started.')
    // Set proper cache folder
    app.setPath("userData", join(app.getPath("cache"), app.name))

    // Detects if the application has been opened with --force-quit
    if (app.commandLine.hasSwitch('force-quit')) {
        console.log("[Apple-Music-Electron] User has closed the application via --force-quit")
        app.quit()
    }

    // Disable CORS (NO LONGER REQUIRED Thanks Apple ❤️)
    app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

    // Media Key Hijacking
    if (app.config.advanced.preventMediaHijacking) app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling');

    // Assign Default Variables
    app.isQuiting = !app.config.preferences.closeButtonMinimize;
    app.config.css.glasstron = app.config.preferences.cssTheme.toLowerCase().split('-').includes('glasstron');
    app.win = '';
    app.ipc = {
        ThumbarUpdate: false,
        TooltipUpdate: false,
        DiscordUpdate: false,
        MediaNotification: false,
        cache: false,
        cacheNew: false
    };
    app.discord = {}
    app.mpris = {}


    // Init
    InitializeAutoUpdater()
}