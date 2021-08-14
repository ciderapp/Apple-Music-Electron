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
    app.ThemesFolderPath = resolve(app.getPath('userData'), 'themes');

    // Copy the Files
    copySync(join(__dirname, '../../themes/'), app.ThemesFolderPath)

    // Make sure you can access the folder with the correct permissions
    console.log(`[InitializeTheme][access] Attempting to access '${join(app.ThemesFolderPath, 'Template.css')}'`)
    fs.access(join(app.ThemesFolderPath, 'Template.css'), fs.constants.W_OK, err => {

        if (err) { // File is not accessible
            console.log(`[InitializeTheme][access] ${err}`)

            chmodr(app.ThemesFolderPath, 0o777, (_e) => { // Change permissions of the folder recursively
                if (_e) {
                    console.error(`[InitializeTheme][chmodr] ${_e}`)
                } else {
                    console.log('[InitializeTheme][chmodr] Theme folder permissions set.');
                }
            });

        } else {
            console.log(`[InitializeTheme][access] Successfully able to access '${app.ThemesFolderPath}'`)

            try {
                if (!app.preferences.value('advanced.themeDevelopment').includes(true)) {
                    copySync(join(__dirname, '../../themes/'), app.ThemesFolderPath, {overwrite: true})
                    console.log(`[InitializeTheme] [copyThemes] Themes copied to '${app.ThemesFolderPath}'`)
                }
            } catch (_err) {
                console.log(_err)
            }
        }
    });
}