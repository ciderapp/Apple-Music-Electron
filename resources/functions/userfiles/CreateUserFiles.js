const {mkdir, copyFile} = require('fs');
const {copySync} = require('fs-extra');

exports.CreateUserFiles = function (fileToCreate, pathConfiguration) {

    switch (fileToCreate.toLowerCase()) {

        case "createconfigdirectory": // Create Configuration Directory
            mkdir(pathConfiguration.user.pathto, (err) => {
                if (err) console.log(`[CreateUserFiles] [ConfigDirectory] Error while creating ${pathConfiguration.user.pathto} | ${err}`)
            })
            console.log(`[CreateUserFiles] [ConfigDirectory] ${pathConfiguration.user.pathto} has been created / replaced.`)
            break;

        case "createthemesdirectory": // Create Themes Directory
            mkdir(pathConfiguration.user.theme.pathto, (err) => {
                if (err) console.log(`[CreateUserFiles] [ThemesDirectory] Error while creating ${pathConfiguration.user.theme.pathto} | ${err}`)
            });
            console.log(`[CreateUserFiles] [ThemesDirectory] ${pathConfiguration.user.theme.pathto} has been created / replaced.`);
            break;

        case "copyconfig": // Create Standard Configuration
            copyFile(pathConfiguration.app.cfg, pathConfiguration.user.cfg, (err) => {
                if (err) console.log(`[CreateUserFiles] [Config] Error while creating ${pathConfiguration.user.cfg} | ${err}`)
            });
            console.log(`[CreateUserFiles] [Config] ${pathConfiguration.user.cfg} has been created / replaced.`);
            break;

        case "copysampleconfig": // Create Sample Configuration
            copyFile(pathConfiguration.app.cfg, pathConfiguration.user.sampleConfig, (err) => {
                if (err) console.log(`[CreateUserFiles] [SampleConfig] Error while creating ${pathConfiguration.user.sampleConfig} | ${err}`)
            });
            console.log(`[CreateUserFiles] [SampleConfig] ${pathConfiguration.user.sampleConfig} has been created / replaced.`)
            break;

        case "copythemes": // Copy all Themes and Overwrite All ones in User Files
            try {
                copySync(pathConfiguration.app.theme.pathto, pathConfiguration.user.theme.pathto, { overwrite: true })
            } catch(err) {
                console.log(`[CreateUserFiles] [ThemesDirectory] [copySync] Error while copying to ${pathConfiguration.user.theme.pathto} | ${err}`)
            }
            console.log(`[CreateUserFiles] [ThemesDirectory] [copySync] Themes copied to ${pathConfiguration.app.theme.pathto}`)
            break;
    }

}