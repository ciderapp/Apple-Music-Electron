const {app, nativeTheme} = require('electron');
const {resolve, join} = require('path');
const {copySync} = require('fs-extra');

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
    copySync(join(__dirname, '../../themes/'), app.ThemesFolderPath, {overwrite: true})
    console.log(`[InitializeTheme] [copyThemes] Themes copied to '${app.ThemesFolderPath}'`)
}