const {mkdir, existsSync, copyFile} = require('fs')
const HomeDirectory = require('os').homedir();
const {copySync} = require('fs-extra');
const {join} = require('path')
let UserFilesDirectory;

exports.LoadUserFiles = function () {
    console.log('[LoadUserFiles] Started.')

    // Declare the Configuration File Location
    switch (process.platform) {
        case "linux":
            UserFilesDirectory = join(HomeDirectory, ".config/Apple Music/")
            break;

        case "win32": // Windows
            UserFilesDirectory = join(HomeDirectory, 'Documents/AME/')
            break;

        case "darwin": // MacOS
            UserFilesDirectory = join(HomeDirectory, 'Library/Application Support/Apple Music/')
            break;

        default:
            UserFilesDirectory = join(HomeDirectory, 'AME/')
            break;
    }

    const paths = {
        app: {
            pathto: join(__dirname, '../'),
            cfg: join(__dirname, '../config.json'),
            sampleConfig: join(__dirname, '../config.json'),
            theme: {
                pathto: join(__dirname, '../themes/'),
                cfg: join(join(__dirname, '../themes/'), 'theme-config.json')
            }
        },

        user: {
            pathto: UserFilesDirectory,
            cfg: join(UserFilesDirectory, 'config.json'),
            sampleConfig: join(UserFilesDirectory, 'config.sample.json'),
            theme: {
                pathto: join(UserFilesDirectory, 'Themes/'),
                cfg: join(join(UserFilesDirectory, 'Themes/'), 'theme-config.json')
            }
        }
    }


    // Print it all
    console.log(`[CreateUserFiles] Current User Path Configuration on ${process.platform}:`)
    console.log(paths)

    function LoadConfiguration() {
        // Once the file has been found and/or created - set app.config to it and merge it with the path configuration
        try {
            let ConfigurationFile = require(join(UserFilesDirectory, 'config'))
            ConfigurationFile = { // Merge the objects
                ...ConfigurationFile, // The normal config
                ...paths // Path Config
            };
            console.log(`[CreateUserFiles] Configuration File: `)
            console.log(ConfigurationFile)
            return ConfigurationFile
        } catch(err) {
            console.log(`[CreateUserFiles] [LoadConfiguration] ${err}`)
        }
    }

    function CreateUserFiles() {

        // Create Configuration Directory
        mkdir(paths.user.pathto, (err) => {
            if (err) {
                console.log(`[CreateUserFiles] [mkdir] Error while creating ${paths.user.pathto} - Error: ${err}`)
            } else {
                console.log(`[CreateUserFiles] [mkdir] ${paths.user.pathto} has been created!`)
            }
        })

        // Create Standard Configuration
        copyFile(paths.app.cfg, paths.user.cfg, (err) => {
            if (err) {
                console.log(`[CreateUserFiles] [copyFile] ${err}`)
            } else {
                console.log(`[CreateUserFiles] [copyFile] Configuration File Created at: '${config.pathto.user.cfg}'`)
            }
        })

        // Copy all Themes and Overwrite All ones in User Files
        copySync(paths.app.theme.pathto, paths.user.theme.pathto, {overwrite: true});
        console.log(`[CreateUserFiles] [copySync] Themes copied to ${paths.app.theme.pathto}`)
    }

    // Checks if the configuration file exists
    console.log(`[CreateUserFiles] Checking if the config exists...`)

    // Create Sample Configuration
    copyFile(paths.app.cfg, paths.user.sampleConfig, (err) => {
        if (err) {
            console.log(`[CreateUserFiles] [copyFile] ${err}`)
        } else {
            console.log(`[CreateUserFiles] [copyFile] ${paths.user.sampleConfig} has been created/replaced.`)
        }
    })

    if(existsSync(paths.user.cfg)) {
        console.log(`[CreateUserFiles] Configuration file Does Exist!`)
        return LoadConfiguration()
    } else {
        console.log(`[CreateUserFiles] Configuration file Does Not Exist! Attempting to Create File...`)
        try {
            console.log(`[CreateUserFiles] Creating User Files...`)
            CreateUserFiles()
        } catch(err) {
            console.log(`[CreateUserFiles] [readFile] Error creating User Files: ${err}`)
        }
        return LoadConfiguration()
    }
}