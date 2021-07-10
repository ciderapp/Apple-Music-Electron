const {app, nativeTheme} = require('electron')

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
}