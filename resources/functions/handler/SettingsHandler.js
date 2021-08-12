const {app, dialog} = require('electron')
const Sentry = require('@sentry/electron');
if (app.preferences.value('general.analyticsEnabled').includes(true)) {
    Sentry.init({ dsn: "https://20e1c34b19d54dfcb8231e3ef7975240@o954055.ingest.sentry.io/5903033" });
}

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