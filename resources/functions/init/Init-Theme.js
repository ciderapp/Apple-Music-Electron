const {app, nativeTheme} = require('electron');
const {resolve, join} = require('path');
const {copySync} = require('fs-extra');
const fs = require('fs');
const chmodr = require('chmodr');

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

    fs.access(`${app.ThemesFolderPath}/Template.css`, fs.constants.W_OK, err => {
        if (err) { // File is not accessible
            fs.chmodSync(app.ThemesFolderPath, '777');

            chmodr(app.ThemesFolderPath, 0o777, (_e) => {
                if (_e) {
                    console.error(`[InitializeTheme][chmodr] ${_e}`)
                } else {
                    console.log('[InitializeTheme][chmodr] Theme folder permissions set.');
                }
            });
        } else {
            try {
                if (app.preferences.value('advanced.themeDevelopment').includes(true)) return;
                copySync(join(__dirname, '../../themes/'), app.ThemesFolderPath, {overwrite: true})
                console.log(`[InitializeTheme] [copyThemes] Themes copied to '${app.ThemesFolderPath}'`)
            } catch (_err) {
                console.log(_err)
            }
        }
    });
}