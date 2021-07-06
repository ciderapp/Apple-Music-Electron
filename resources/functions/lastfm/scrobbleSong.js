const LastfmAPI = require('lastfmapi')
const apistuff = require('./creds.json')
const {join} = require('path')
const HomeDirectory = require('os').homedir();

const lfm = new LastfmAPI({
    'api_key': apistuff.apikey,
    'secret': apistuff.secret
});

let UserFilesDirectory;

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
lfm.setSessionCredentials(sessiondata.name, sessiondata.key)

exports.scrobble = function(attributes) {
    // Scrobble playing song.
    if (attributes.status === true) {
        lfm.setSessionCredentials(sessiondata.name, sessiondata.key)
        lfm.track.scrobble({
            'artist': attributes.artistName,
            'track': attributes.name,
            'timestamp': new Date().getTime() / 1000
        }, function (err, scrobbled) {
            if (err) {
                return console.log('[LastFM] An error occurred while scrobbling', err);
            }

            console.log('[LastFM] Successfully scrobbled:', scrobbled)
        });
    }
}