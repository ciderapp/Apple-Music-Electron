const {readFile} = require('fs')
const {app, nativeTheme} = require('electron')
const themeConfig = require(app.config.user.theme.cfg)
const {join} = require('path')

exports.LoadCSS = function (path, theme) {
    const fileName = path
    path = join(join(__dirname, '../../css/'), fileName.toLowerCase())
    if (theme) {
        path = join(app.config.user.theme.pathto, fileName.toLowerCase())

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

    readFile(path + '.css', "utf-8", function (error, data) {
        if (!error) {
            let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
            app.win.webContents.insertCSS(formattedData).then(() => console.log(`[Themes] '${path}' successfully injected.`));
        } else {
            console.log(`[LoadTheme] Error while injecting: ${path} - Error: ${error}`)
        }
    });
}