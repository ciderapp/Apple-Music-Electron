const {app} = require('electron')
const {autoUpdater} = require("electron-updater");
autoUpdater.logger = require("electron-log");

exports.InitializeAutoUpdater = function () {
    console.log('[InitializeAutoUpdater] Started.')

    if (app.config.advanced.autoUpdaterBetaBuilds) {
        autoUpdater.allowPrerelease = true
        autoUpdater.allowDowngrade = false
    }
    console.log("[AutoUpdater] Checking for updates...")
    autoUpdater.checkForUpdatesAndNotify().then(r => console.log(`[AutoUpdater] Latest Version is ${r.updateInfo.version}`))


}