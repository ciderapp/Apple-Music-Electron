const {app} = require('electron')

exports.UpdateLFMActivity = function (attributes) {
    if (!app.config.quick.lastfmEnabled.includes(true)) return;

    console.log(`[UpdateLFMActivity] Scrobbling LastFM`)
    var {scrobble} = require("../lastfm/scrobbleSong");

    if (app.config.quick.lastfmEnabled.includes(true)) {
        scrobble(attributes)
    }
}

