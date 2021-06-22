const {app} = require('electron')
const {join} = require('os')
const {SetTaskList} = require('../win/SetTaskList')

const {InstanceHandler} = require('../handler/InstanceHandler')
const {InitializeAutoUpdater} = require('./Init-AutoUpdater')
const {InitializeLogging} = require('./Init-Logging')
const {InitializeTheme} = require('./Init-Theme')
const {InitializeTray} = require('./Init-Tray')

const {InitializeRPC} = require('../rpc/Init-DiscordRPC')
const {InitializeMpris} = require('../mpris/Init-Mpris')


exports.InitializeBase = function () {

    // Set proper cache folder
    app.setPath("userData", join(app.getPath("cache"), app.name))

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

    // Run the Functions
    SetTaskList()
    InstanceHandler()

    // Init
    InitializeLogging()
    InitializeAutoUpdater()
    InitializeTheme()
    InitializeTray()

    // Init (Other)
    InitializeMpris()
    InitializeRPC()

    // Detects if the application has been opened with --force-quit
    if (app.commandLine.hasSwitch('force-quit')) {
        console.log("[Apple-Music-Electron] User has closed the application via --force-quit")
        app.quit()
        return true;
    }


}