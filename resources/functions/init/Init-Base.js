const {app, Notification} = require('electron')
const {join} = require('path')

exports.InitializeBase = function () {
    console.log('[InitializeBase] Started.')
    // Set proper cache folder
    app.setPath("userData", join(app.getPath("cache"), app.name))

    // Detects if the application has been opened with --force-quit
    if (app.commandLine.hasSwitch('force-quit')) {
        console.log("[Apple-Music-Electron] User has closed the application via --force-quit")
        app.quit()
    }

    // Detect if the application has been opened with --minimized
    if (app.commandLine.hasSwitch('minimized')) {
        console.log("[Apple-Music-Electron] Application opened with --minimized");
        app.win.minimize();
    }

    // Detect if the application has been opened with --hidden
    if (app.commandLine.hasSwitch('hidden')) {
        console.log("[Apple-Music-Electron] Application opened with --hidden");
        app.win.hide();
    }

    // Disable CORS
    if (app.preferences.value('general.authMode').includes(true)) {
        console.log("[Apple-Music-Electron] Application started wth disable CORS.")
        new Notification({
            title: "Apple Music",
            body: `Applications has been started using authMode. Disable authMode once you have successfully logged in.`
        }).show()
        app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
    }

    // Media Key Hijacking
    if (app.preferences.value('advanced.preventMediaKeyHijacking').includes(true)) {
        console.log("[Apple-Music-Electron] Hardware Media Key Handling disabled.")
        app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,MediaSessionService');
    }

    // Sets the ModelId (For windows notifications)
    if (process.platform === "win32") app.setAppUserModelId("Apple Music");

    if (app.preferences.value('window.appStartupBehavior').includes('hidden')) {
        app.setLoginItemSettings({
            openAtLogin: true,
            args: [
                '--process-start-args', `"--hidden"`
            ]
        })
    } else if (app.preferences.value('window.appStartupBehavior').includes('minimized')) {
        app.setLoginItemSettings({
            openAtLogin: true,
            args: [
                '--process-start-args', `"--minimized"`
            ]
        })
    } else if (app.preferences.value('window.appStartupBehavior').includes('true')) {
        app.setLoginItemSettings({
            openAtLogin: true,
            args: []
        })
    } else {
        app.setLoginItemSettings({
            openAtLogin: false,
            args: []
        })
    }

    // Assign Default Variables
    app.isQuiting = !app.preferences.value('window.closeButtonMinimize').includes(true);
    app.win = '';
    app.ipc = {existingNotification: false};

    // Init
    const {InitializeAutoUpdater} = require('./Init-AutoUpdater')
    InitializeAutoUpdater()
}