const LastfmAPI = require('lastfmapi')
const apistuff = require('./creds.json')
const fs = require('fs');
const {lfmauthenticate} = require("./authenticate");
const {join} = require('path')
const {app} = require('electron')

exports.scrobble = function(attributes) {
    if (!app.config.lastfm.enabled) return;

    const lfm = new LastfmAPI({
        'api_key': apistuff.apikey,
        'secret': apistuff.secret
    });

    app.config.user.lastFMsessionPath = join(app.config.user.pathto, "session.json")

    if (fs.existsSync(app.config.user.lastFMsessionPath)) {
        var sessiondata = require(app.config.user.lastFMsessionPath)
        lfm.setSessionCredentials(sessiondata.name, sessiondata.key)
    } else {
        lfmauthenticate()
    }

    // Scrobble playing song.
    if (attributes.status === true) {
        lfm.setSessionCredentials(sessiondata.name, sessiondata.key)
        if (app.discord.cachedAttributes !== attributes) {
            lfm.track.scrobble({
                'artist': attributes.artistName,
                'track': attributes.name,
                'timestamp': new Date().getTime() / 1000
            }, function (err, scrobbled) {
                if (err) {
                    return console.log('[LastFM] An error occurred while scrobbling', err);
                }

                console.log('[LastFM] Successfully scrobbled: ', scrobbled)
            });
        }
    }
}