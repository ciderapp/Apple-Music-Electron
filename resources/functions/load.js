const {join} = require("path");
const {app, ipcMain} = require("electron");
const {Analytics} = require("./sentry");
const {readFile, constants, chmodSync} = require("fs");
const {LocaleInit} = require("./init");
Analytics.init()

module.exports = {

    LoadCSS: function (path, theme) {
        if (theme) {
            path = join(app.userThemesPath, path.toLowerCase());
        } else {
            path = join(join(__dirname, '../css/'), path)
        }

        readFile(path, "utf-8", function (error, data) {
            if (error) {
                console.error(`[LoadCSS] Error while injecting: '${path}' - ${error}`)
                try {
                    chmodSync(path, constants.S_IRUSR | constants.S_IWUSR);
                } catch(err) {
                    console.error(`[LoadCSS] ${err}`)
                }

            } else {
                let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
                app.win.webContents.insertCSS(formattedData).then(() => {
                    if (app.preferences.value('advanced.verboseLogging').includes(true)) {
                        if (theme) {
                            console.log(`[LoadTheme] '${path}' successfully injected.`)
                        } else {
                            console.log(`[LoadCSS] '${path}' successfully injected.`)
                        }
                    }
                });
            }
        });
    },

    LoadJS: function (path) {
        path = join(join(__dirname, '../js/'), path)

        readFile(path, "utf-8", function (error, data) {
            if (!error) {
                try {
                    let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
                    app.win.webContents.executeJavaScript(formattedData).then(() => {
                        if (app.preferences.value('advanced.verboseLogging').includes(true)) {
                            console.log(`[LoadJSFile] '${path}' successfully injected.`)
                        }
                    });
                } catch (err) {
                    console.error(`[LoadJSFile] Error while injecting: ${path} - Error: ${err}`)
                }
            } else {
                console.error(`[LoadJSFile] Error while reading: '${path}' - Error: ${error}`)
            }
        });
    },

    LoadWebsite: function () {
        const [region, language] = LocaleInit()
        app.locale = [region, language]
        const urlBase = (app.preferences.value('advanced.useBetaSite').includes(true)) ? `https://beta.music.apple.com/${region}` : `https://music.apple.com/${region}`;
        const urlFallback = `https://music.apple.com/${region}?l=${language}`;
        const urlLanguage = `${urlBase}?l=${language}`;
        console.log(`[LoadWebsite] Attempting to load '${urlLanguage}'`)

        app.win.loadURL(urlLanguage).then(() => {
            if (app.preferences.value('general.startupPage') !== "browse") {
                app.funcs.LoadJS('CheckAuth.js')
                ipcMain.once('authorized', (e, args) => {
                    app.win.webContents.clearHistory()
                    console.log(`[LoadWebsite] User is authenticated. Loading '${app.preferences.value('general.startupPage')}'. (${args}).`)
                    app.isAuthorized = true
                })
            } else {
                console.log(`[LoadWebsite] Loaded '${urlLanguage}'`)
            }

        }).catch((err) => {
            app.win.loadURL(urlFallback).then(() => console.error(`[LoadWebsite] '${urlLanguage}' was unavailable, falling back to '${urlFallback}' | ${err}`))
        })
    },

    LoadFiles: async function () {
        /* Remove Apple Music Logo */
        if (app.preferences.value('visual.removeAppleLogo').includes(true)) {
            app.funcs.LoadJS('removeAppleLogo.js')
            app.win.webContents.insertCSS(`
            @media only screen and (max-width: 483px) {
                .web-navigation__nav-list {
                        margin-top: 50px;
                    }
                }
            }
            `)
        }

        /* Remove Footer */
        if (app.preferences.value('visual.removeFooter').includes(true)) {
            app.funcs.LoadJS('removeFooter.js')
        }

        /* Remove Upsell */
        if (app.preferences.value('visual.removeUpsell').includes(true)) {
            app.funcs.LoadJS('removeUpsell.js')
        }

        /* Load the Emulation Files */
        if (app.preferences.value('visual.frameType') === 'mac') {
            app.funcs.LoadJS('emulateMacOS.js')
        } else if (app.preferences.value('visual.frameType') === 'mac-right') {
            app.funcs.LoadJS('emulateMacOS_rightAlign.js')
        }

        if (process.platform === 'darwin' && !app.preferences.value('visual.frameType').includes('mac')) {
          app.funcs.LoadJS('macOS.js')
        }

        if (process.platform === 'win32' && !app.preferences.value('visual.frameType').includes('mac')) {
            app.funcs.LoadJS('windowsFrame.js')
        }

        app.funcs.LoadJS('custom.js')

        function matchRuleShort(str, rule) {
            var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
            return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
        }

        const urlBase = (app.preferences.value('advanced.useBetaSite')) ? `https://beta.music.apple.com` : `https://music.apple.com`;
        const backButtonBlacklist = [
            `${urlBase}/${app.locale[0]}/listen-now?l=${app.locale[1]}`,
            `${urlBase}/${app.locale[0]}/browse?l=${app.locale[1]}`,
            `${urlBase}/${app.locale[0]}/radio?l=${app.locale[1]}`,

            `${urlBase}/${app.locale[0]}/listen-now`,
            `${urlBase}/${app.locale[0]}/browse`,
            `${urlBase}/${app.locale[0]}/radio`,

            `${urlBase}/${app.locale[0]}/search`,
            `${urlBase}/${app.locale[0]}/search?*`,

            `${urlBase}/library/recently-added?l=${app.locale[1]}`,
            `${urlBase}/library/albums?l=${app.locale[1]}`,
            `${urlBase}/library/songs?l=${app.locale[1]}`,
            `${urlBase}/library/made-for-you?l=${app.locale[1]}`,

            `${urlBase}/library/recently-added`,
            `${urlBase}/library/albums`,
            `${urlBase}/library/songs`,
            `${urlBase}/library/made-for-you`,
            `${urlBase}/library/artists/*`,
            `${urlBase}/library/playlist/*`
        ];

        function backButtonChecks() {
            let returnVal = false
            backButtonBlacklist.forEach(function (item) {
                if (matchRuleShort(app.win.webContents.getURL(), item) || app.win.webContents.getURL() === item) {
                    returnVal = true
                }
            });
            return returnVal
        }

        /* Load Back Button */
        if (app.preferences.value('visual.backButton').includes(true) && !backButtonChecks() && app.win.webContents.canGoBack()) {
            app.funcs.LoadJS('backButton.js')
        } else { /* Remove it if user cannot go back */
            await app.win.webContents.executeJavaScript(`if (document.querySelector('#backButtonBar')) { document.getElementById('backButtonBar').remove() };`);
        }

        /* Inject the MusicKitInterop file */
        await app.win.webContents.executeJavaScript('MusicKitInterop.init()');
    },

    LoadOneTimeFiles: function () {
        // Inject the custom stylesheet
        app.funcs.LoadCSS('custom-stylesheet.css')

        if (process.platform === 'win32' && !app.preferences.value('visual.frameType').includes('mac')) {
            app.funcs.LoadCSS('windowsFrame.css')
        }

        // Load the appropriate css file for transparency
        if (app.transparency) {
            app.funcs.LoadCSS('transparency.css')
        } else {
            app.funcs.LoadCSS('transparencyDisabled.css')
        }

        // Set the settings variables if needed
        if (app.preferences.value('visual.frameType').includes('mac')) {
            app.preferences.value('visual.removeUpsell', [true]);
            app.preferences.value('visual.removeAppleLogo', [true]);
        }

        // Streamer Mode
        if (app.preferences.value('visual.streamerMode').includes(true)) {
            app.funcs.LoadCSS('streamerMode.css')
        }

        // Load Themes
        if (app.preferences.value('visual.theme') && !(app.preferences.value('visual.theme').includes('Template')) && !(app.preferences.value('visual.theme').includes('default'))) {
            app.funcs.LoadCSS(`${app.preferences.value('visual.theme')}.css`, true)
        }

        /* Remove the Scrollbar */
        if (app.preferences.value('advanced.removeScrollbars').includes(true)) {
            app.win.webContents.insertCSS('::-webkit-scrollbar { display: none; }');
        } else {
            app.funcs.LoadCSS('macosScrollbar.css')
        }
    }
}