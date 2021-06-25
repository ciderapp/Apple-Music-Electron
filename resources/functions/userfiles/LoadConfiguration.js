const {app} = require('electron')
const {join} = require('path')

exports.LoadConfiguration = function (pathConfiguration) {


    // Once the file has been found and/or created - set app.config to it and merge it with the path configuration
    try {
        let ConfigurationFile = require(join(pathConfiguration.user.pathto, 'config'))
        ConfigurationFile = { // Merge the objects
            ...ConfigurationFile, // The normal config
            ...pathConfiguration // Path Config
        };
        console.log(`[CreateUserFiles] Configuration File: `)
        console.log(ConfigurationFile)
        return ConfigurationFile
    } catch(err) {
        console.log(`[CreateUserFiles] [LoadConfiguration] ${err}`)
        app.quit()
    }


}