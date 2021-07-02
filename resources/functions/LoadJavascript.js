const { app, nativeTheme } = require('electron')
const { LoadJSFile } = require('./LoadJSFile')
const { LoadTheme } = require('./LoadTheme')

exports.LoadJavascript = function() {
    console.log('[LoadJavascript] Started.')

    nativeTheme.themeSource = app.config.systemTheme;
    app.win.webContents.on('did-stop-loading', async() => {

        console.log('[Did-stop-loading] [LoadJavascript] Page Reloaded - Reloading Scripts.')
            // MacOS Emaulation
        if (app.config.css.macOS.emulateMacOS) {
            // Needs some time
            setTimeout(() => { LoadJSFile('macosAppEmu.min.js') }, 2000)
            app.config.css.removeAppleLogo = true
            app.config.css.removeUpsell = true
        }

        // Apple Music Logo
        if (app.config.css.removeAppleLogo) {
            LoadJSFile('removeAppleLogo.js')
        }

        // Removes Upsell
        if (app.config.css.removeUpsell) {
            LoadJSFile('removeUpsell.js')
        }

        // MacOS Window Controls
        if (app.config.css.macOS.windowControls) {
            LoadJSFile('macosWindowFrame.js')
            app.config.css.macOS.WindowsStyleWindowControls = false
        }

        // MacOS Window Controls (Windows Style)
        if (app.config.css.macOS.WindowsStyleWindowControls) {
            LoadJSFile('macosWindowFrame-WindowsStyle.js')
        }

        // MacOS Scrollbar
        if (app.config.css.macOS.scrollbar) {
            LoadTheme('macosScrollbar.css')
            app.config.advanced.removeScrollbars = false
        }

        // Glasstron (Add a case here if you are creating a theme)
        if (app.config.css.glasstron) {

            switch (app.config.preferences.cssTheme.toLowerCase()) {

                case 'glasstron-blurple': // Glasstron-Blurple THeme
                    app.win.webContents.executeJavaScript(`document.getElementsByTagName('body')[0].style = 'background-color: rgb(19 21 25 / 84%) !important;';`).then(() => console.log(`[JS] 'glasstron-blurple' successfully injected.`));
                    break;

                default: // Default Glasstron Theme
                    app.win.webContents.executeJavaScript(`document.getElementsByTagName('body')[0].style = 'background-color: rgb(25 24 24 / 84%) !important;';`).then(() => console.log(`[JS] 'glasstron' successfully injected.`));
                    break
            }
        }

        // Loading Themes
        if (app.config.preferences.cssTheme) {
            LoadTheme(`${app.config.preferences.cssTheme.toLowerCase()}.css`)
        }

        // Remove Scrollbar
        if (app.config.advanced.removeScrollbars) {
            await app.win.webContents.insertCSS('::-webkit-scrollbar { display: none; }');
        }

        // Inject the MusicKitInterop File
        await app.win.webContents.executeJavaScript('MusicKitInterop.init()');
    });


}