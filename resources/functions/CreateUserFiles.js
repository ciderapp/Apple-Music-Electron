const {mkdir, writeFile, readFile, existsSync} = require('fs')
const HomeDirectory = require('os').homedir();
const {copySync} = require('fs-extra');
const {join} = require('path')
const {app} = require('electron')
let UserFilesDirectory,
    config = {themesPath: false, configPath: false, themeConfigPath: false};

exports.CreateUserFiles = function () {

    // Declare the Configuration File Location
    switch (process.platform) {
        case "linux":
            UserFilesDirectory = join(HomeDirectory, ".config/'Apple Music'/")
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

    // Declare all the Paths for Easy Access in Other Files
    const UserThemesDirectory = join(UserFilesDirectory, "Themes/")
    const UserConfigPath = join(UserFilesDirectory, 'config.json')
    const UserConfigSamplePath = join(UserFilesDirectory, 'config.sample.json')
    config.themesPath = UserThemesDirectory;
    config.configPath = UserConfigPath;
    config.samplePath = UserConfigSamplePath;
    config.themeConfigPath = join(UserThemesDirectory, 'theme-config.json');

    // Print it all
    console.log(`[CreateUserFiles] Current User Path Configuration:`)
    console.log(config)

    function LoadConfiguration() {
        // Once the file has been found and/or created - set app.config to it and merge it with the path configuration
        const ConfigurationFile = require(UserConfigPath)
        app.config = { // Merge the objects
            ...ConfigurationFile, // The normal config
            ...config // Path Config
        };
        console.log(`[CreateUserFiles] Configuration File: `)
        console.log(app.config)
    }

    // Checks if the configuration file exists
    console.log(`[CreateUserFiles] Checking if the config exists...`)
    if(existsSync(UserConfigPath)) {
        console.log(`[CreateUserFiles] Configuration file Does Exist!`)
        LoadConfiguration()
    } else {
        console.log(`[CreateUserFiles] Configuration file Does Not Exist! Attempting to Create File...`)
        try {
            console.log(`[CreateUserFiles] Calling readFile`)
            readFile('../config.json', 'utf8', readSample);
        } catch(err) {
            console.log(`[CreateUserFiles] Error when reading config: ${err}`)
        }

    }
    console.log(`[CreateUserFiles] Completed Checking Configuration.`)



    async function readSample(error, data) {
        if (error || !data) {
            console.log(`[CreateUserFiles] Error Encountered Wile Reading Configuration Sample: ${error}`);
        } else {
            console.log(`[CreateUserFiles] Configuration File Sample:`)
            console.log(data); // Logging config.json.sample to console.
            console.log('[fs] Beginning file write process...')
            console.log('[CreateUserFiles] Home Directory: ' + HomeDirectory)


            // Config File
            console.log(`[CreateUserFiles] Configuration File Path: ${UserConfigPath}`)
            await mkdir(UserFilesDirectory, writeDir)
            await writeFile(UserConfigSamplePath, data, 'utf8', writeSample);
            await writeFile(UserConfigPath, data, 'utf8', writeConfig);

            // Themes Folder
            console.log(`[CreateUserFiles] Themes Folder Path: ${UserThemesDirectory}`)
            await mkdir(UserThemesDirectory, writeDir)
            const srcDir = `./resources/themes/`;
            const destDir = HomeDirectory + `/AME/Themes/`;
            await copySync(srcDir, destDir, {overwrite: true});
            console.log('[CreateUserFiles] [fs-extras] Successfully wrote Themes directory into the user directory.');
            await LoadConfiguration()
        }
    }

    function writeDir(error) {
        if (error) {
            console.log(error)
        } else {
            console.log('[writeDir] Wrote directory successfully.')
        }
    }

    function writeSample(error) {
        if (error) {
            console.log(error)
        } else {
            console.log('[writeSample] [fs] Successfully wrote config.sample.json to the user directory.');
        }
    }

    function writeConfig(error) {
        if (error) {
            console.log(error)
        } else {
            console.log('[writeConfig] [fs] Successfully wrote config.json to the user directory.');
        }
    }
}