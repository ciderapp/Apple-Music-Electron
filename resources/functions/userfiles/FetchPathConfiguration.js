const {join} = require('path')
const HomeDirectory = require('os').homedir();

exports.FetchPathConfiguration = function () {
    let UserFilesDirectory;


    // Declare the Configuration File Location
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

    return {
        application: {
            pathto: join(__dirname, '../../'),
            cfg: join(__dirname, '../../config.json'),
            sampleConfig: join(__dirname, '../../config.json'),
            theme: {
                pathto: join(__dirname, '../../themes/'),
            }
        },

        user: {
            pathto: UserFilesDirectory,
            cfg: join(UserFilesDirectory, 'config.json'),
            sampleConfig: join(UserFilesDirectory, 'config.sample.json'),
            theme: {
                pathto: join(UserFilesDirectory, 'Themes/'),
            }
        }
    }


}