const {app, dialog} = require('electron')

exports.SettingsHandler = function () {
    console.log('[InstanceHandler] Started.')
    let DialogMessage;

    app.preferences.on('save', (_preferences) => {
        if (!DialogMessage) {
            DialogMessage = dialog.showMessageBox(app.win, {
                title: "Restart Required",
                message: "A restart is required.",
                type: "warning",
                buttons: ['Relaunch Now', 'Relaunch Later']
            }).then(({response}) => {
                if (response === 0) {
                    app.relaunch()
                    app.quit()
                }
            })
        }
    });

}