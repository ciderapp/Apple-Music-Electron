const {app} = require('electron')

exports.UpdateLFMActivity = function (attributes) {
    if (!app.preferences.value('general.lastfmEnabled')) return;

    console.log(`[UpdateLFMActivity] Scrobbling LastFM`)
    var {scrobble} = require("./scrobbleSong");
    scrobble(attributes);
}