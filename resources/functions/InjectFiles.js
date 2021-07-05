const {app} = require('electron')
const {LoadJavascript} = require('./load/LoadJavascript')
const {LoadCSS} = require('./load/LoadCSS')

exports.InjectFiles = function () {
    console.log('[InjectFilesIntoBrowserWindow] Started.')
    app.win.webContents.on('did-stop-loading', async () => {

        /* Load the Emulation Files */
        if (app.config.css.emulateMacOS) {
            if (app.config.css.emulateMacOS_rightAlign) {
                LoadJavascript('emulateMacOS_rightAlign.js')
            } else {
                LoadJavascript('emulateMacOS.js')
            }
        }

        if (app.isUsingGlasstron) {
            LoadCSS('glasstron.css', true)
        }

        /* Load a Theme if it is Found in the Configuration File */
        if (app.config.preferences.cssTheme) {
            LoadCSS(app.config.preferences.cssTheme.toLowerCase(), true)
        }

        /* Remove the Scrollbar */
        app.win.webContents.insertCSS('::-webkit-scrollbar { display: none; }');

        /* Inject the MusicKitInterop file */
        await app.win.webContents.executeJavaScript('MusicKitInterop.init()');
    });


}