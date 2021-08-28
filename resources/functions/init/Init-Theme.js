const {app, nativeTheme} = require('electron');
const {resolve, join} = require('path');
const {copySync} = require('fs-extra');
const fs = require('fs');
const {Analytics} = require("../analytics/sentry");
Analytics.init()

exports.InitializeTheme = function () {
    console.log('[InitializeTheme] Started.')
    if (app.preferences.value('advanced.forceApplicationMode') === 'dark') {
        nativeTheme.themeSource = "dark"
    } else if (app.preferences.value('advanced.forceApplicationMode') === 'light') {
        nativeTheme.themeSource = "light"
    } else {
        if (nativeTheme.shouldUseDarkColors === true) {
            app.preferences.value('advanced.forceApplicationMode', 'dark');
        } else {
            app.preferences.value('advanced.forceApplicationMode', 'light');
        }
    }

    // Set the folder
    app.userThemesPath = resolve(app.getPath('userData'), 'themes');
    app.themesPath = join(__dirname, '../../themes/')
    console.log('---------------------------------------------------------------------')
    console.log(`User Themes Path: '${app.userThemesPath}'`)
    console.log(`Application Themes Path: '${app.themesPath}'`)
    console.log('---------------------------------------------------------------------')

    // Make sure you can access the folder with the correct permissions
    console.log(`[InitializeTheme][access] Attempting to access '${app.userThemesPath}'`)

    // Checks if the Folder is readable
    try {
        fs.accessSync(app.userThemesPath, fs.constants.F_OK)
    } catch (err) {
        console.error(err)
        copySync(app.themesPath, app.userThemesPath)
        console.log(`[InitializeTheme] [copyThemes] Themes copied to '${app.userThemesPath}'`)
    }

    // Copy the Files
    if (!app.preferences.value('advanced.themeDevelopment').includes(true)) {
        copySync(app.themesPath, app.userThemesPath, {overwrite: true})
        console.log(`[InitializeTheme] [copyThemes] Themes overwritten at '${app.userThemesPath}'`)
    }

    // Save all the file names to array and log it
    try {
        app.themesList = fs.readdirSync(app.userThemesPath);
        console.log('---------------------------------------------------------------------')
        console.log(`Available Themes: ${app.themesList.join(', ')}`)
        console.log('---------------------------------------------------------------------')
    } catch (err) {
        console.error(err)
    }

    console.log('[InitializeTheme][access] Checking permissions...')

    // Check the Permissions
    if (app.themesList) {
        app.themesList.forEach((value, _index) => {
            fs.readFile(join(app.userThemesPath, value), "utf-8", function (error) {
                if (error) {
                    fs.chmodSync(join(app.userThemesPath, value), fs.constants.S_IRUSR | fs.constants.S_IWUSR);
                    console.log(`[InitializeTheme][access] Setting permissions of '${join(app.userThemesPath, value)}'`)
                }
            })
        })
    }

}