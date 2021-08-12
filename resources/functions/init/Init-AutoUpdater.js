const {app} = require('electron')
const {autoUpdater} = require("electron-updater");
autoUpdater.logger = require("electron-log");
const Sentry = require('@sentry/electron');
if (app.preferences.value('general.analyticsEnabled').includes(true)) {
    Sentry.init({ dsn: "https://20e1c34b19d54dfcb8231e3ef7975240@o954055.ingest.sentry.io/5903033" });
}

exports.InitializeAutoUpdater = function () {
    console.log('[InitializeAutoUpdater] Started.')

    if (app.preferences.value('advanced.autoUpdaterBetaBuilds').includes(true)) {
        autoUpdater.allowPrerelease = true
        autoUpdater.allowDowngrade = false
    }
    console.log("[AutoUpdater] Checking for updates...")
    try {
        autoUpdater.checkForUpdatesAndNotify().then(r => console.log(`[AutoUpdater] Latest Version is ${r.updateInfo.version}`))
    } catch (err) {
        console.error(`[AutoUpdater] Error whilst checking for Update: ${err}`)
    }
}