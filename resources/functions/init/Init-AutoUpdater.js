const {app} = require('electron')
const {autoUpdater} = require("electron-updater");
autoUpdater.logger = require("electron-log");
const {Analytics} = require("../analytics/sentry");
Analytics.init()

exports.InitializeAutoUpdater = function () {
    console.log('[InitializeAutoUpdater] Started.')

    if (app.preferences.value('advanced.autoUpdaterBetaBuilds').includes(true)) {
        autoUpdater.allowPrerelease = true
        autoUpdater.allowDowngrade = false
    }
    console.log("[AutoUpdater] Checking for updates...")
    try {
        autoUpdater.checkForUpdatesAndNotify().then(r => {
            if (r) {
                console.log(`[AutoUpdater] Latest Version is ${r.updateInfo.version}. Current Version: ${process.env.npm_package_version}`)
            }
        })
    } catch (err) {
        console.error(`[AutoUpdater] Error whilst checking for Update: ${err}`)
    }
}