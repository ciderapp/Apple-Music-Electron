const {app} = require('electron')
const {LoadJS} = require('./load/LoadJS')
const {LoadCSS} = require('./load/LoadCSS')

exports.InjectFiles = function () {
    console.log('[InjectFilesIntoBrowserWindow] Started.')
    app.win.webContents.on('did-stop-loading', async () => {
        LoadCSS('init.css')

        /* Load the Emulation Files */
        if (app.config.css.emulateMacOS.includes(true)) {
            if (app.config.css.emulateMacOS.includes("rightAlign")) {
                LoadJS('emulatemacos_rightalign.js')
            } else {
                LoadJS('emulatemacos.js')
            }
        }

        /* Load Glasstron */
        if (app.config.css.transparencyMode.includes(true)) {
            LoadCSS('glasstron.css')
        } else {
            LoadCSS('glasstronDisabled.css')
        }

        /* Streamer Mode */
        if (app.config.css.streamerMode.includes(true)) {
            LoadCSS('streamerMode.css')
        }

        /* Stop the Banner Popping up */
        if (app.config.advanced.forceApplicationRegion.includes(true) || app.config.advanced.forceApplicationLanguage.includes(true)) {
            LoadJS('regionChange.js')
        }

        /* Load a Theme if it is Found in the Configuration File */
        if (app.config.css.cssTheme) {
            LoadCSS(`${app.config.css.cssTheme.toLowerCase()}.css`, true)
        }

        /* Remove the Scrollbar */
        app.win.webContents.insertCSS('::-webkit-scrollbar { display: none; }');

        /* Inject the MusicKitInterop file */
        await app.win.webContents.executeJavaScript('MusicKitInterop.init()');
    });


}