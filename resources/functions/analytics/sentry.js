const {app} = require('electron')
const ElectronSentry = require('@sentry/electron');

exports.Analytics = {
    init: function () {
        if (app.preferences.value('general.analyticsEnabled').includes(true)) {
            ElectronSentry.init({ dsn: "https://20e1c34b19d54dfcb8231e3ef7975240@o954055.ingest.sentry.io/5903033" });
        }
    }
}
