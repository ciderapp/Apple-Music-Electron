const {mkdir, writeFile, readFile, access, promises: fs} = require('fs')
const HomeDirectory = require('os').homedir();
const {copySync} = require('fs-extra');
const {join} = require('path')
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
    config.themesPath = UserThemesDirectory;
    config.configPath = UserConfigPath;
    config.themeConfigPath = join(UserThemesDirectory, 'theme-config.json')

    // Checks if the configuration file exists
    access(UserConfigPath, (err) => {
        console.log(`[CreateUserFiles] ${UserConfigPath} ${err ? ' does Not Exist' : 'does Exist!'}`);
        if (!err) {
            console.log('[CreateUserFiles] Initialized!')
            config = require(UserConfigPath)
        } else {
            readFile('../config.json', 'utf8', readSample);

            async function getContent(filePath, encoding = "utf-8") {
                if (!filePath) {
                    throw new Error("filePath required");
                }

                return fs.readFile(filePath, {encoding});
            }

            (async () => {
                config = await getContent(UserConfigPath)
            })();
        }
    })

    async function readSample(error, data) {
        if (error) {
            console.log(error);
        } else {
            console.log(data); // Logging config.json.sample to console.
            console.log('[fs] Beginning file write process...')
            console.log('[CreateUserFiles] Home Directory: ' + HomeDirectory)


            // Config File
            console.log(`[CreateUserFiles] Configuration File Path: ${UserConfigPath}`)
            await mkdir(UserFilesDirectory, writeDir)
            await writeFile(UserFilesDirectory + 'config.sample.json', data, 'utf8', writeSample);
            await writeFile(UserFilesDirectory + 'config.json', data, 'utf8', writeConfig);

            // Themes Folder
            console.log(`[CreateUserFiles] Themes Folder Path: ${UserThemesDirectory}`)
            await mkdir(UserThemesDirectory, writeDir)
            const srcDir = `./resources/themes/`;
            const destDir = HomeDirectory + `/AME/Themes/`;
            await copySync(srcDir, destDir, {overwrite: true});
            console.log('[CreateUserFiles] [fs-extras] Successfully wrote Themes directory into the user directory.');
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
    console.log(config)
    return config


}