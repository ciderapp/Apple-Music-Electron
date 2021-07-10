const {app} = require('electron')
const fs = require('fs')
const {join} = require('path')
const HomeDirectory = require('os').homedir();
const { Notification } = require('electron')
const path = require('path')

let lastfmsessionpath = path.resolve(app.getPath('userData'), 'session.json')

exports.lfmauthenticate = function (){
    if (!app.preferences.value('general.lastfmEnabled')) return;

    const LastfmAPI = require('lastfmapi')
    const apistuff = require('./creds.json')

    const lfm = new LastfmAPI({
        'api_key': apistuff.apikey,
        'secret': apistuff.secret
    });

    fs.stat(lastfmsessionpath, 'utf8', function(err){
        if (err) {
            console.log("[LastFM] [Session] Session file couldn't be opened or doesn't exist,", err)
            console.log("[LastFM] [Auth] Beginning authentication from configuration")
            lfm.authenticate(app.preferences.value('general.lastfmAuthKey'), function (err, session) {
                if (err) {
                    throw err;
                }
                console.log("[LastFM] Successfully obtained LastFM session info,", session); // {"name": "LASTFM_USERNAME", "key": "THE_USER_SESSION_KEY"}
                console.log("[LastFM] Saving session info to disk.")
                let tempdata = JSON.stringify(session)
                fs.writeFile(lastfmsessionpath, tempdata, (err) => {
                    if (err)
                        console.log("[LastFM] [fs]", err)
                    else {
                        console.log("[LastFM] [fs] File was written successfully.")
                        authenticatefromfile()
                        new Notification({ title: "Apple Music", body: "Successfully logged into LastFM using Authentication Key." }).show()
                    }
                })
            });
        } else {
            authenticatefromfile()
        }
    })
}

function authenticatefromfile () {
    const LastfmAPI = require('lastfmapi')
    const apistuff = require('./creds.json')
    const lfm = new LastfmAPI({
        'api_key': apistuff.apikey,
        'secret': apistuff.secret
    });

    let sessiondata = require(lastfmsessionpath)
    console.log("[LastFM] [Auth] Logging in with sessioninfo.")
    lfm.setSessionCredentials(sessiondata.name, sessiondata.key)
    console.log("[LastFM] [Auth] Logged in.")
}