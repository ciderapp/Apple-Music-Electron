const {existsSync} = require('fs');
const {LoadConfiguration} = require('./userfiles/LoadConfiguration')
const {FetchPathConfiguration} = require('./userfiles/FetchPathConfiguration')
const {CreateUserFiles} = require('./userfiles/CreateUserFiles')

exports.LoadUserFiles = function () {
    console.log('[LoadUserFiles] Started.')
    const paths = FetchPathConfiguration()
    console.log(`[LoadUserFiles] Current User Path Configuration on Platform '${process.platform}':`)
    console.log(paths)

    if (existsSync(paths.user.pathto) && existsSync(paths.user.cfg) && existsSync(paths.user.sampleConfig) && existsSync(paths.user.theme.cfg)) {
        CreateUserFiles("CopyThemes", paths)
        console.log(`[CreateUserFiles] All user files found! Located at '${paths.user.pathto}'`)
        return LoadConfiguration(paths)
    } else {
        console.log(`[CreateUserFiles] Some configuration files were not found. Attempting to create the missing files.`)
        try {
            if (!existsSync(paths.user.pathto)) {
                // Main
                CreateUserFiles("UserDir", paths)
                CreateUserFiles("Config", paths)
                CreateUserFiles("SampleConfig", paths)
                // Themes
                CreateUserFiles("ThemesDir", paths)
                CreateUserFiles("CopyThemes", paths)
            }
            if (!existsSync(paths.user.cfg)) {
                CreateUserFiles("Config", paths)
            }
            if (!existsSync(paths.user.sampleConfig)) {
                CreateUserFiles("SampleConfig", paths)
            }
            if (!existsSync(paths.user.theme.pathto)) {
                CreateUserFiles("ThemesDir", paths)
                CreateUserFiles("CopyThemes", paths)
            }
        } catch (err) {
            console.log(`[CreateUserFiles] Error Whilst Creating User Files: ${err}`)
        }
        return LoadConfiguration(paths)
    }
}