const {readFile, chmod} = require('fs')
const {app} = require('electron')
const {join} = require('path')

exports.LoadCSS = function (path, theme) {
    if (theme) {
        path = join(app.ThemesFolderPath, path.toLowerCase());
    } else {
        path = join(join(__dirname, '../../css/'), path)
    }


    readFile(path, "utf-8", function (error, data) {
        if (!error) {
            let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
            app.win.webContents.insertCSS(formattedData).then(() => console.log(`[Themes] '${path}' successfully injected.`));
        } else {
            console.log(`[LoadTheme] Error while injecting: '${path}' - Error: ${error}`)
            if (theme) {
                try {
                    chmod(path, 0o600, () => {
                        console.log(`[LoadTheme][chmod] Successfully updated file permissions for ${path}`)
                    })
                } catch(err) {
                    console.log(`[LoadTheme][chmod] ${err}`)
                }
            }
        }
    });
}