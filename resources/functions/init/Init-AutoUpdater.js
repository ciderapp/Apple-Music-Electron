const {app} = require('electron')
const {autoUpdater} = require("electron-updater");
autoUpdater.logger = require("electron-log");

exports.InitializeAutoUpdater = function () {
    console.log('[InitializeAutoUpdater] Started.')

    if (app.preferences.value('advanced.autoUpdaterBetaBuilds').includes(true)) {
        autoUpdater.allowPrerelease = true
        autoUpdater.allowDowngrade = false
    }
    console.log("[AutoUpdater] Checking for updates...")
    try {
        autoUpdater.checkForUpdatesAndNotify().then(r => console.log(`[AutoUpdater] Latest Version is ${r.updateInfo.version}`))
    } catch(err) {
        console.log(`[AutoUpdater] Error whilst checking for Update: ${err}`)
    }



}