const {app} = require('electron')
const Sentry = require('@sentry/electron');
if (app.preferences.value('general.analyticsEnabled').includes(true)) {
    Sentry.init({ dsn: "https://20e1c34b19d54dfcb8231e3ef7975240@o954055.ingest.sentry.io/5903033" });
}

exports.SetTrayTooltip = function (attributes) {


    if (!app.preferences.value('general.trayTooltipSongName').includes(true)) return;

    console.log(`[UpdateTooltip] Updating Tooltip for ${attributes.name} to ${attributes.status}`)

    if (attributes.status === true) {
        app.tray.setToolTip(`Playing ${attributes.name} by ${attributes.artistName} on ${attributes.albumName}`);
    } else {
        app.tray.setToolTip(`Paused ${attributes.name} by ${attributes.artistName} on ${attributes.albumName}`);
    }

}