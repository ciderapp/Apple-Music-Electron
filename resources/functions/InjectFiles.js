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
            app.win.webContents.executeJavaScript(`document.getElementsByTagName('body')[0].style = 'background-color: rgb(25 24 24 / 84%) !important;';`).then(() => console.log(`[JS] 'glasstron' successfully injected.`));
            LoadCSS('glasstron.css')

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