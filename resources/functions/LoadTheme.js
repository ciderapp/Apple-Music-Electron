const {readFile} = require('fs')
const {app, nativeTheme} = require('electron')
const themeConfig = require(app.config.themeConfigPath)

exports.LoadTheme = function (path) {


    readFile(app.config.themesPath, "utf-8", function (error, data) {
        if (!error) {
            let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
            app.win.webContents.insertCSS(formattedData).then(() => console.log(`[Themes] '${path}' successfully injected.`));
        }
    });

    for (let v in themeConfig.dark) {
        if (path === v) {
            nativeTheme.themeSource = "dark"
        }
    }
    for (let v in themeConfig.light) {
        if (path === v) {
            nativeTheme.themeSource = "light"
        }
    }


}