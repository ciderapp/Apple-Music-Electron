const {app} = require('electron')

exports.InstanceHandler = function () {
    console.log('[InstanceHandler] Started.')
    const gotTheLock = app.requestSingleInstanceLock();

    if (!gotTheLock && !app.preferences.value('advanced.allowMultipleInstances').includes(true)) {
        console.log("[InstanceHandler] Existing Instance is Blocking Second Instance.")
        app.quit();
        return true
    } else {
        app.on('second-instance', (_e, argv) => {
            if (argv.includes("--force-quit") > -1) {
                app.quit()
                return true
            } else if (app.win && !app.preferences.value('advanced.allowMultipleInstances').includes(true)) {
                app.win.show()
                app.win.focus()
            }
        })
    }
    return false

}