const {readFile} = require('fs')
const {app} = require('electron')

exports.LoadJSFile = function (path) {


    readFile(`../js/${path}`, "utf-8", function (error, data) {
        if (!error) {
            let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
            app.win.webContents.executeJavaScript(formattedData).then(() => console.log(`[JS] '${path}' successfully injected.`));
        }
    });


}