const {app, nativeTheme} = require('electron');
const {resolve, join} = require('path');
const {copySync} = require('fs-extra');
const {chmodr} = require("chmodr");

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

    app.ThemesFolderPath = resolve(app.getPath('userData'), 'Themes');
    try {
        copySync(join(__dirname, '../../themes/'), app.ThemesFolderPath, {overwrite: true})
    } catch(err) {
        console.log(`[InitializeTheme] [copyThemes] ${err}`)
        try {
            chmodr(app.ThemesFolderPath, 0o777, (err) => {
                if (err) {
                    console.log(`[InitializeTheme][chmodr] ${err}`)
                } else {
                    console.log('[InitializeTheme][chmodr] Theme folder permissions set.');
                }
            });
            copySync(join(__dirname, '../../themes/'), app.ThemesFolderPath, {overwrite: true})
        } catch(err) {
            console.log(`[InitializeTheme][chmodr] ${err}`)
        }
    }

    console.log(`[InitializeTheme] [copyThemes] Themes copied to '${app.ThemesFolderPath}'`)
}