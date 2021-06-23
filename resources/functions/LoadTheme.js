const {readFile} = require('fs')
const {app, nativeTheme} = require('electron')
const themeConfig = require(app.config.user.theme.cfg)
const {join} = require('path')

exports.LoadTheme = function (path) {
    const filePath = join(app.config.user.theme.pathto, path)
    console.log(`[LoadTheme] Attempting to load: '${filePath}`)

    readFile(filePath, "utf-8", function (error, data) {
        if (!error) {
            let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
            app.win.webContents.insertCSS(formattedData).then(() => console.log(`[Themes] '${path}' successfully injected.`));
        } else {
            console.log(`[LoadTheme] Error while injecting: ${path} - Error: ${error}`)
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