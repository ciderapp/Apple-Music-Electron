const {readFile} = require('fs')
const {app} = require('electron')
const {join} = require('path')
const {Analytics} = require("../analytics/sentry");
Analytics.init()

exports.LoadJS = function (path) {
    path = join(join(__dirname, '../../js/'), path)

    readFile(path, "utf-8", function (error, data) {
        if (!error) {
            try {
                let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
                app.win.webContents.executeJavaScript(formattedData).then(() => console.log(`[LoadJSFile] '${path}' successfully injected.`));
            } catch (err) {
                console.error(`[LoadJSFile] Error while injecting: ${path} - Error: ${err}`)
            }
        } else {
            console.error(`[LoadJSFile] Error while reading: '${path}' - Error: ${error}`)
        }
    });


}