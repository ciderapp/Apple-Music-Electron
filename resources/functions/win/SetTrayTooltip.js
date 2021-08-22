const {app} = require('electron')
const {Analytics} = require("../analytics/sentry");
Analytics.init()
exports.SetTrayTooltip = function (attributes) {


    if (!app.preferences.value('general.trayTooltipSongName').includes(true)) return;

    if (app.preferences.value('advanced.verboseLogging').includes(true)) {
        console.log(`[UpdateTooltip] Updating Tooltip for ${attributes.name} to ${attributes.status}`)
    }

    if (attributes.status === true) {
        app.tray.setToolTip(`Playing ${attributes.name} by ${attributes.artistName} on ${attributes.albumName}`);
    } else {
        app.tray.setToolTip(`Paused ${attributes.name} by ${attributes.artistName} on ${attributes.albumName}`);
    }

}