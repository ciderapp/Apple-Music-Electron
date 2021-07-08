const fs = require('fs');
const {app} = require('electron')
const path = require('path')

let lastfmsessionpath = path.resolve(app.getPath('userData'), 'session.json')

exports.scrobble = function(attributes) {
    if (!app.config.quick.lastfmEnabled.includes(true) || app.config.quick.lastfmAuthKey.includes('Put your Auth Key here.') || !app.config.quick.lastfmAuthKey) {
        app.config.quick.lastfmEnabled = []
        return
    }

    const LastfmAPI = require('lastfmapi')
    const apistuff = require('./creds.json')
    const {lfmauthenticate} = require("./authenticate");

    const lfm = new LastfmAPI({
        'api_key': apistuff.apikey,
        'secret': apistuff.secret
    });

    if (fs.existsSync(lastfmsessionpath)) {
        var sessiondata = require(lastfmsessionpath)
        lfm.setSessionCredentials(sessiondata.name, sessiondata.key)
    } else {
        lfmauthenticate()
        var sessiondata = require(lastfmsessionpath)
        // Scrobble playing song.
        if (attributes.status === true) {
            lfm.setSessionCredentials(sessiondata.name, sessiondata.key)
            if (app.discord.cachedAttributes !== attributes) {
                lfm.track.scrobble({
                    'artist': attributes.artistName,
                    'track': attributes.name,
                    'album': attributes.albumName,
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
}