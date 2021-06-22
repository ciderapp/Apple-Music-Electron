const {app, nativeTheme} = require('electron')

exports.InitializeTheme = function () {


    let theme;
    if (app.config.preferences.defaultTheme) {
        theme = app.config.preferences.defaultTheme.toLowerCase()
    } else if (nativeTheme.shouldUseDarkColors === true) {
        theme = "dark"
    } else if (nativeTheme.shouldUseDarkColors === false) {
        theme = "light"
    } else {
        theme = "system"
    }
    app.config.systemTheme = theme


}