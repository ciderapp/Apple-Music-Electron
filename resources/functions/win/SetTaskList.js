const {app} = require('electron')
const Sentry = require('@sentry/electron');
if (app.preferences.value('general.analyticsEnabled').includes(true)) {
    Sentry.init({ dsn: "https://20e1c34b19d54dfcb8231e3ef7975240@o954055.ingest.sentry.io/5903033" });
}

exports.SetTaskList = function () {

    if (process.platform !== "win32") return;

    app.setUserTasks([
        {
            program: process.execPath,
            arguments: '--force-quit',
            iconPath: process.execPath,
            iconIndex: 0,
            title: 'Quit Apple Music'
        }
    ]);
    return true


}