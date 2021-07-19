const {app, dialog} = require('electron')

exports.SettingsHandler = function () {
    console.log('[InstanceHandler] Started.')
    let DialogMessage;

    app.preferences.on('save', (preferences) => {
        if ((preferences.general.authMode !== app.preferences.value('general.authMode')) && !DialogMessage) {
            DialogMessage = dialog.showMessageBox(app.win, {
                title: "Restart Required",
                message: "A restart is required.",
                type: "warning",
                buttons: ['Relaunch Now', 'Relaunch Later']
            }).then(({response, checked}) => {
                if (response === 0) {
                    app.relaunch()
                    app.quit()
                }
            })


        }
    });

}