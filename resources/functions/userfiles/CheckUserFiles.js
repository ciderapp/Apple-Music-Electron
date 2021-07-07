const {app, dialog} = require('electron')
const {CreateUserFiles} = require('./CreateUserFiles')
const baseConfiguration = require('../../config.json');

exports.CheckUserFiles = function (paths) {
    let MissingKeys = []
    CreateUserFiles("SampleConfig", paths)

    try {
        const userConfiguration = require(paths.user.cfg)
        console.log('[CheckUserFiles] Checking Configuration File...')
        Object.keys(baseConfiguration).forEach(function (parentKey) {
            if (parentKey in userConfiguration) {
                Object.keys(baseConfiguration[parentKey]).forEach(function (childKey) {
                    if (!userConfiguration[parentKey].hasOwnProperty(childKey)) {
                        console.log(`[MissingKey] ${childKey}`)
                        MissingKeys.push(`${parentKey}.${childKey}`)
                    }
                })
            } else {
                MissingKeys.push(parentKey)
                console.log(`[CheckUserFiles] ${parentKey} not found in userConfiguration!`)
                app.config = none;
            }
        })
    } catch(err) {
        console.log(`[CheckUserFiles] File check failed. ${err}`)
        app.configInitializationFailed = true
        MissingKeys.push('ConfigurationInitializationFailure')
    }

    CreateUserFiles('CopyThemes', paths)

    if (MissingKeys.length !== 0 || app.configInitializationFailed) {
        MissingKeys = MissingKeys.toString()
        if (!app.configInitializationFailed) CreateUserFiles("SampleConfig", paths);
        dialog.showMessageBox(app.win, {
            message: `Your current configuration is incompatible, make a backup of your current configuration. Pressing OK will overwrite your current configuration.`,
            title: "Missing Keys in Configuration",
            type: "warning",
            detail: `Missing Keys: \n${MissingKeys}`,
            buttons: ['Update Configuration and Relaunch', 'Quit Application']
        }).then(({response, checked}) => {
            if (response === 0) {
                CreateUserFiles("Config", paths);
                app.relaunch({ args: process.argv.slice(1).concat(['--relaunch']) });
                app.quit();
            } else if (response === 1) {
                app.quit();
            }
        })
        app.configInitializationFailed = true
    }
}