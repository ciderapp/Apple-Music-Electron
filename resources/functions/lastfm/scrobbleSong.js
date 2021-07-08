const fs = require('fs');
const {join} = require('path')
const {app} = require('electron')

exports.scrobble = function(attributes) {
    if (!app.config.lastfmEnabled.includes(true)) return;

    const LastfmAPI = require('lastfmapi')
    const apistuff = require('./creds.json')
    const {lfmauthenticate} = require("./authenticate");

    const lfm = new LastfmAPI({
        'api_key': apistuff.apikey,
        'secret': apistuff.secret
    });

    app.config.lastFMsessionPath = join(join(__dirname, '../../'), "session.json")

    if (fs.existsSync(app.config.lastFMsessionPath)) {
        var sessiondata = require(app.config.lastFMsessionPath)
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