const {app} = require('electron')

exports.SetTrayTooltip = function (attributes) {


    if (!app.config.preferences.trayTooltipSongName.includes(true)) return;

    console.log(`[UpdateTooltip] Updating Tooltip for ${attributes.name} to ${attributes.status}`)

    if (attributes.status === true) {
        app.tray.setToolTip(`Playing ${attributes.name} by ${attributes.artistName} on ${attributes.albumName}`);
    } else {
        app.tray.setToolTip(`Paused ${attributes.name} by ${attributes.artistName} on ${attributes.albumName}`);
    }

}