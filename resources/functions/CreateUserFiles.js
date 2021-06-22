const {mkdir, writeFile, readFile, access, promises: fs} = require('fs')
const HomeDirectory = require('os').homedir();
const {copySync} = require('fs-extra');
const {join} = require('path')
const {app} = require('electron')
let UserFileDirectory;

exports.CreateUserFiles = function () {

    // Declare the Configuration File Location
    switch (process.platform) {
        case "linux":
            UserFileDirectory = join(HomeDirectory, ".config/'Apple Music'/")
            break;

        case "win32": // Windows
            UserFileDirectory = join(HomeDirectory, 'Documents/AME/')
            break;

        case "darwin": // MacOS
            UserFileDirectory = join(HomeDirectory, 'Library/Application Support/Apple Music/')
            break;

        default:
            UserFileDirectory = join(HomeDirectory, 'AME/')
            break;
    }

    // Declare all the Paths for Easy Access in Other Files
    const UserThemesDirectory = join(UserFileDirectory, "Themes/")
    const UserConfigPath = join(UserFileDirectory, 'config.json')
    app.config.themesPath = UserThemesDirectory;
    app.config.configPath = UserConfigPath;
    app.config.themeConfigPath = join(UserThemesDirectory, 'theme-config.json')

    // Checks if the configuration file exists
    access(UserConfigPath, (err) => {
        console.log(`[CreateUserFiles] ${UserConfigPath} ${err ? ' does Not Exist' : 'does Exist!'}`);
        if (!err) {
            console.log('[CreateUserFiles] Initialized!')
            app.config = require(UserConfigPath)
        } else {
            readFile('../config.json', 'utf8', readSample);

            async function getContent(filePath, encoding = "utf-8") {
                if (!filePath) {
                    throw new Error("filePath required");
                }

                return fs.readFile(filePath, {encoding});
            }

            (async () => {
                app.config = await getContent(UserConfigPath)
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
            await mkdir(UserFileDirectory, writeDir)
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


}