const {app} = require('electron')
const ElectronSentry = require('@sentry/electron');

exports.Analytics = {
    init: function () {
        if (app.preferences.value('general.analyticsEnabled').includes(true) && app.isPackaged) {
            console.warn('[Sentry] Sentry logging is enabled, any errors you receive will be presented to the development team to fix for the next release.')
            ElectronSentry.init({dsn: "https://20e1c34b19d54dfcb8231e3ef7975240@o954055.ingest.sentry.io/5903033"});
        }
    }
}
