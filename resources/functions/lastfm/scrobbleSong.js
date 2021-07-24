const fs = require('fs');
const {app} = require('electron')
const path = require('path')

let lastfmsessionpath = path.resolve(app.getPath('userData'), 'session.json')

exports.ScrobbleLFM = function (attributes) {
    if (!app.preferences.value('general.lastfmEnabled').includes(true) || app.preferences.value('general.lastfmAuthKey')[0] === 'Put your Auth Key here.' || !app.preferences.value('general.lastfmAuthKey')) {
        app.preferences.value('general.lastfmEnabled', [])
        return
    }

    // This prevents the script from running constantly when the attributes are:
    // - the same
    // - only just been created
    if (!app.lastfm.cachedAttributes) {
        app.lastfm.cachedAttributes = attributes
        return // Generate First Activity Cache
    } else if (app.lastfm.cachedAttributes === attributes) {
        return // Same Song and Activity State
    }

    const LastfmAPI = require('lastfmapi')
    const apistuff = require('./creds.json')
    const {lfmAuthenticate} = require("./authenticate");

    const lfm = new LastfmAPI({
        'api_key': apistuff.apikey,
        'secret': apistuff.secret
    });

    function FilterArtistName(artist) {
        if (!app.preferences.value('general.lastfmRemoveFeaturingArtists').includes(true)) return artist;

        artist = artist.split(' ');
        if (artist.includes('&')) {
            artist.length = artist.indexOf('&');
        }
        if (artist.includes('and')) {
            artist.length = artist.indexOf('and');
        }
        artist = artist.join(' ');
        if (artist.includes(',')) {
            artist = artist.split(',')
            artist = artist[0]
        }
        return artist.charAt(0).toUpperCase() + artist.slice(1);
    }


    if (fs.existsSync(lastfmsessionpath)) {
        var sessionData = require(lastfmsessionpath)
        lfm.setSessionCredentials(sessionData.name, sessionData.key)
        // Scrobble playing song.
        if (attributes.status === true) {
            console.log(`[UpdateLFMActivity] Scrobbling LastFM`)
            lfm.setSessionCredentials(sessionData.name, sessionData.key)
            if (app.lastfm.cachedAttributes !== attributes) {
                setTimeout(() => { // I didnt know how to do this any other way, woulda liked to use the timer but idk how to call it without using this.
                    lfm.track.scrobble({
                        'artist': FilterArtistName(attributes.artistName),
                        'track': attributes.name,
                        'album': attributes.albumName,
                        'albumArtist': attributes.artistName,
                        'timestamp': new Date().getTime() / 1000
                    }, function (err, scrobbled) {
                        if (err) {
                            return console.log('[LastFM] An error occurred while scrobbling', err);
                        }
                        console.log('[LastFM] Successfully scrobbled: ', scrobbled)
                    });
                }, 15000)
            }
        }
    } else {
        lfmAuthenticate()
    }

    return false
}