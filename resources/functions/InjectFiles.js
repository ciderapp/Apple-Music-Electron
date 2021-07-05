const {app} = require('electron')
const {LoadJavascript} = require('./load/LoadJavascript')
const {LoadCSS} = require('./load/LoadCSS')

exports.InjectFiles = function () {
    console.log('[InjectFilesIntoBrowserWindow] Started.')
    app.win.webContents.on('did-stop-loading', async () => {
        LoadCSS('init.css')

        /* Load the Emulation Files */
        if (app.config.css.emulateMacOS) {
            if (app.config.css.emulateMacOS_rightAlign) {
                LoadJavascript('emulatemacos_rightalign.js')
            } else {
                LoadJavascript('emulatemacos.js')
            }
        }

        if (app.config.transparency.transparencyEnabled) {
            LoadCSS('glasstron.css')
            if (app.config.transparency.oledDark) {
                LoadCSS('glasstron-oled.css')
            }
        }

        /* Load a Theme if it is Found in the Configuration File */
        if (app.config.preferences.cssTheme) {
            LoadCSS(`${app.config.preferences.cssTheme.toLowerCase()}.css`, true)
        }

        /* Remove the Scrollbar */
        app.win.webContents.insertCSS('::-webkit-scrollbar { display: none; }');

        /* Inject the MusicKitInterop file */
        await app.win.webContents.executeJavaScript('MusicKitInterop.init()');
    });


}