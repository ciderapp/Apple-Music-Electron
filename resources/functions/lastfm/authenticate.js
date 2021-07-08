const {app} = require('electron')
const fs = require('fs')
const {join} = require('path')
const HomeDirectory = require('os').homedir();
const { Notification } = require('electron')

let UserFilesDirectory;

exports.lfmauthenticate = function (){
    if (!app.config.lastfmEnabled.includes(true)) return;

    const LastfmAPI = require('lastfmapi')
    const apistuff = require('./creds.json')

    const lfm = new LastfmAPI({
        'api_key': apistuff.apikey,
        'secret': apistuff.secret
    });

    fs.stat(app.config.lastFMsessionPath, 'utf8', function(err){
        if (err) {
            console.log("[LastFM] [Session] Session file couldn't be opened or doesn't exist,", err)
            console.log("[LastFM] [Auth] Beginning authentication from config.json")
            lfm.authenticate(app.config.lastfmAuthKey, function (err, session) {
                if (err) {
                    throw err;
                }
                console.log("[LastFM] Successfully obtained LastFM session info,", session); // {"name": "LASTFM_USERNAME", "key": "THE_USER_SESSION_KEY"}
                console.log("[LastFM] Saving session info to disk.")
                let tempdata = JSON.stringify(session)
                fs.writeFile(app.config.lastFMsessionPath, tempdata, (err) => {
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
    const lfm = new LastfmAPI({
        'api_key': apistuff.apikey,
        'secret': apistuff.secret
    });
    switch (process.platform) {
        case "linux":
            UserFilesDirectory = join(HomeDirectory, ".config/Apple Music/")
            break;

        case "win32": // Windows
            UserFilesDirectory = join(HomeDirectory, 'Documents/Apple Music/')
            break;

        case "darwin": // MacOS
            UserFilesDirectory = join(HomeDirectory, 'Library/Application Support/Apple Music/')
            break;

        default:
            UserFilesDirectory = join(HomeDirectory, 'apple-music-electron/')
            break;
    }


    let sessiondata = require(app.config.lastFMsessionPath)
    console.log("[LastFM] [Auth] Logging in with sessioninfo.")
    lfm.setSessionCredentials(sessiondata.name, sessiondata.key)
    console.log("[LastFM] [Auth] Logged in.")
}