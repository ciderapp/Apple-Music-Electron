const {app} = require('electron')

exports.InstanceHandler = function () {
    console.log('[InstanceHandler] Started.')
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock && !app.config.advanced.allowMultipleInstances) {
        console.log("[InstanceHandler] Existing Instance is Blocking Second Instance.")
        app.quit();
        return true
    } else {
        app.on('second-instance', (_e, argv) => {
            if (argv.indexOf("--force-quit") > -1) {
                app.quit()
                return true
            } else if (app.win && !app.config.advanced.allowMultipleInstances) {
                app.win.show()
                app.win.focus()
            }
        })
    }
    return false

}