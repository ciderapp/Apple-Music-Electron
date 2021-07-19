const {app, nativeTheme} = require('electron');
const {resolve, join} = require('path');
const {copySync} = require('fs-extra');

exports.InitializeTheme = function () {
    console.log('[InitializeTheme] Started.')
    if (app.preferences.value('advanced.forceDarkMode').includes(true)) {
        nativeTheme.themeSource = "dark"
    } else {
        if (nativeTheme.shouldUseDarkColors === true) {
            nativeTheme.themeSource = "dark"
        } else {
            nativeTheme.themeSource = "light"
        }
    }

    app.ThemesFolderPath = resolve(app.getPath('userData'), 'Themes');
    copySync(join(__dirname, '../../themes/'), app.ThemesFolderPath, {overwrite: true})
    console.log(`[InitializeTheme] [copyThemes] Themes copied to ${app.ThemesFolderPath}`)
}