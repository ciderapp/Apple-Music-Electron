const {app} = require('electron')

exports.UpdateLFMActivity = function (attributes) {
    if (!app.preferences.value('general.lastfmEnabled').includes(true)) return;

    console.log(`[UpdateLFMActivity] Scrobbling LastFM`)
    var {scrobble} = require("./scrobbleSong");
    scrobble(attributes);
}