const LastfmAPI = require('lastfmapi')
const apistuff = require('./creds.json')
const {app} = require('electron')
const fs = require('fs')
const {join} = require('path')
const HomeDirectory = require('os').homedir();

let UserFilesDirectory;

exports.lfmauthenticate = function () {
    if (!app.config.lastfm.enabled) return;
    if (app.config.lastfm.enabled) {
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

        let sessionfile = join(UserFilesDirectory, "session.json")

        fs.readFile(sessionfile, 'utf8', function(err, sessioninfo){
            if (err) {
                console.log("[LastFM] [Session] Session file couldn't be opened or doesn't exist,", err)
                console.log("[LastFM] [Auth] Beginning authentication from config.json")
                lfm.authenticate(app.config.lastfm.authKey, function (err, session) {
                    if (err) {
                        throw err;
                    }
                    console.log("[LastFM] Successfully obtained LastFM session info,", session); // {"name": "LASTFM_USERNAME", "key": "THE_USER_SESSION_KEY"}
                    console.log("[LastFM] Saving session info to disk.")
                    let tempdata = JSON.stringify(session)
                    fs.writeFile(sessionfile, tempdata, (err) => {
                        if (err)
                            console.log("[LastFM] [fs]")
                        else {
                            console.log("[LastFM] [fs] File was written successfully.")
                            authenticatefromfile()
                        }
                    })
                });
            } else {
                authenticatefromfile()
            }
        })
    } else {
        console.log("[LastFM] LastFM is not enabled. Ignoring.")
    }
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

    let sessionfile = join(UserFilesDirectory, "session.json")
    let sessiondata = require(sessionfile)
    console.log("[LastFM] [Auth] Logging in with sessioninfo.")
    lfm.setSessionCredentials(sessiondata.name, sessiondata.key)
    console.log("[LastFM] [Auth] Logged in.")
}