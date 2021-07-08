const {app} = require('electron')
const {LoadJS} = require('./load/LoadJS')
const {LoadCSS} = require('./load/LoadCSS')

exports.InjectFiles = function () {
    console.log('[InjectFilesIntoBrowserWindow] Started.')
    app.win.webContents.on('did-stop-loading', async () => {
        LoadCSS('init.css')

        /* Load the Emulation Files */
        if (app.config.css.emulateMacOS.indexOf(true)) {
            if (app.config.css.emulateMacOS_rightAlign) {
                LoadJS('emulatemacos_rightalign.js')
            } else {
                LoadJS('emulatemacos.js')
            }
        }

        /* Load Glasstron */
        if (app.config.css.transparencyMode.indexOf(true)) {
            LoadCSS('glasstron.css')
        } else {
            LoadCSS('glasstronDisabled.css')
        }

        /* Streamer Mode */
        if (app.config.css.streamerMode.indexOf(true)) {
            LoadCSS('streamerMode.css')
        }

        /* Stop the Banner Popping up */
        if (app.config.advanced.forceApplicationRegion || app.config.advanced.forceApplicationLanguage) {
            LoadJS('regionChange.js')
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