const {app, nativeTheme} = require('electron');
const {resolve, join} = require('path');
const {copySync} = require('fs-extra');
const fs = require('fs');
const chmodr = require('chmodr');
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
    fs.access(app.userThemesPath, fs.constants.W_OK, err => {

        if (err) { // File is not accessible

            // Copy the Files
            if (!app.preferences.value('advanced.themeDevelopment').includes(true)) {
                copySync(app.themesPath, app.userThemesPath)
                console.log(`[InitializeTheme] [copyThemes] Themes copied to '${app.userThemesPath}'`)
            }

            console.log(`[InitializeTheme][access] ${err}`)

            chmodr(app.userThemesPath, 0o777, (_e) => { // Change permissions of the folder recursively
                if (_e) {
                    console.error(`[InitializeTheme][chmodr] ${_e}`)
                } else {
                    console.log('[InitializeTheme][chmodr] Theme folder permissions set.');
                }
            });

        } else {
            console.log(`[InitializeTheme][access] Successfully able to access '${app.userThemesPath}'`)

            try {
                if (!app.preferences.value('advanced.themeDevelopment').includes(true)) {
                    copySync(app.themesPath, app.userThemesPath, {overwrite: true})
                    console.log(`[InitializeTheme] [copyThemes] Themes copied to '${app.userThemesPath}'`)
                }
            } catch (_err) {
                console.log(_err)
            }
        }
    });
}