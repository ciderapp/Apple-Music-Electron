const {app, nativeTheme} = require('electron')

exports.InitializeTheme = function () {
    console.log('[InitializeTheme] Started.')
    if (app.config.advanced.forceDarkMode === true) {
        app.config.systemTheme = "dark"
        if (nativeTheme.shouldUseDarkColors === true) {
            app.config.systemTheme = "dark"
        } else {
            app.config.systemTheme = "light"
        }
    } else {
        app.config.systemTheme = "system"
    }
    nativeTheme.themeSource = app.config.systemTheme

}