const {readFile} = require('fs')
const {app} = require('electron')
const {join} = require('path')

exports.LoadCSS = function (path, theme) {
    if (theme) {
        path = join(join(__dirname, '../../themes/'), path.toLowerCase());
    } else {
        path = join(join(__dirname, '../../css/'), path.toLowerCase())
    }


    readFile(path, "utf-8", function (error, data) {
        if (!error) {
            let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
            app.win.webContents.insertCSS(formattedData).then(() => console.log(`[Themes] '${path}' successfully injected.`));
        } else {
            console.log(`[LoadTheme] Error while injecting: '${path}' - Error: ${error}`)
        }
    });
}