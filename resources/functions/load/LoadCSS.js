const {readFile} = require('fs')
const {app} = require('electron')
const {join} = require('path')
const {Analytics} = require("../analytics/sentry");
Analytics.init()

exports.LoadCSS = function (path, theme) {
    if (theme) {
        path = join(app.userThemesPath, path.toLowerCase());
    } else {
        path = join(join(__dirname, '../../css/'), path)
    }


    readFile(path, "utf-8", function (error, data) {
        if (!error) {
            let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
            app.win.webContents.insertCSS(formattedData).then(() => {
                if (theme) {
                    console.log(`[Themes] '${path}' successfully injected.`)
                } else {
                    console.log(`[CSS] '${path}' successfully injected.`)
                }
            });
        } else {
            console.error(`[LoadCSS] Error while injecting: '${path}' - Error: ${error}`)
        }
    });
}