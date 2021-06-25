const {app, nativeTheme} = require('electron')
const {LoadJSFile} = require('./LoadJSFile')
const {LoadTheme} = require('./LoadTheme')

exports.LoadJavascript = function () {
    console.log('[LoadJavascript] Started.')

    nativeTheme.themeSource = app.config.systemTheme;
    app.win.webContents.on('did-stop-loading', async () => {
        console.log('[Did-stop-loading] [LoadJavascript] Page Reloaded - Reloading Scripts.')
        if (app.config.css.removeAppleLogo) {
            LoadJSFile('removeAppleLogo.js')
        }
        if (app.config.css.removeUpsell) {
            LoadJSFile('removeUpsell.js')
        }
        if (app.config.css.macosWindow) {
            LoadJSFile('macosWindowFrame.js')
        }
        if (app.config.css.macosScrollbar) {
            LoadTheme('macosScrollbar.css')
            app.config.advanced.removeScrollbars = false
        }
        if (app.config.css.glasstron) {

            switch (app.config.preferences.cssTheme.toLowerCase()) {
                case 'glasstron-blurple':
                    app.win.webContents.executeJavaScript(`document.getElementsByTagName('body')[0].style = 'background-color: rgb(19 21 25 / 84%) !important;';`).then(() => console.log(`[JS] 'glasstron-blurple' successfully injected.`));
                    break;

                default:
                    app.win.webContents.executeJavaScript(`document.getElementsByTagName('body')[0].style = 'background-color: rgb(25 24 24 / 84%) !important;';`).then(() => console.log(`[JS] 'glasstron' successfully injected.`));
                    break
            }
        }

        if (app.config.preferences.cssTheme) {
            LoadTheme(`${app.config.preferences.cssTheme.toLowerCase()}.css`)
        }

        if (app.config.advanced.removeScrollbars) await app.win.webContents.insertCSS('::-webkit-scrollbar { display: none; }');
        await app.win.webContents.executeJavaScript('MusicKitInterop.init()');
    });


}