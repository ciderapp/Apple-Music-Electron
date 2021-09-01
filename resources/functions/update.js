const {autoUpdater} = require('electron-updater')
const {app, dialog, Notification} = require('electron')
const {Analytics} = require("./sentry");
Analytics.init()

autoUpdater.logger = require("electron-log");
autoUpdater.logger.transports.file.level = "info";

exports.checkUpdates = function (manual) {

    if (app.preferences.value('advanced.autoUpdaterBetaBuilds').includes(true)) {
        autoUpdater.allowPrerelease = true
        autoUpdater.allowDowngrade = false
    }

    try {
        if (app.isPackaged) {
            autoUpdater.checkForUpdates()
        } else {
            console.warn('[checkUpdates] Application not packed. Check for Updates Unavailable.')
        }
    } catch (err) {
        console.error(`[checkUpdates] An error occurred while checking for updates: ${err}`)
    }

    autoUpdater.on('update-not-available', () => {
        if (manual === true) {
            let bodyVer = `You are on the latest version. (v${app.getVersion()})`
            new Notification({title: "Apple Music", body: bodyVer}).show()
        }
    })

    autoUpdater.on('download-progress', (progress) => {
        let convertedProgress = parseFloat(progress);
        app.win.setProgressBar(convertedProgress)
    })

    autoUpdater.on('update-downloaded', (_UpdateInfo) => {
        console.log('[checkUpdates] New version downloaded. Starting user prompt.');

        if (process.env.NODE_ENV === 'production') {
            dialog.showMessageBox({
                type: 'info',
                title: 'Updates Available',
                message: `Update was found and downloaded, would you like to install the update now?`,
                buttons: ['Sure', 'No']
            }, (buttonIndex) => {
                if (buttonIndex === 0) {
                    const isSilent = true;
                    const isForceRunAfter = true;
                    autoUpdater.quitAndInstall(isSilent, isForceRunAfter);
                } else {
                    updater.enabled = true
                    updater = null
                }
            })
        }

    })
}