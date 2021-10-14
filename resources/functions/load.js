const {join} = require("path"),
    {app, ipcMain, systemPreferences} = require("electron"),
    {readFile, constants, chmodSync} = require("fs"),
    {initAnalytics} = require('./utils');
initAnalytics();

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
                } catch (err) {
                    console.error(`[LoadCSS] ${err}`)
                }

            } else {
                let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
                app.win.webContents.insertCSS(formattedData).then(() => {
                    console.verbose(`[${theme ? 'LoadTheme' : 'LoadCSS'}] '${path}' successfully injected.`)
                });
            }
        });
    },

    LoadJS: function (path, formatting = true) {
        path = join(join(__dirname, '../js/'), path)

        readFile(path, "utf-8", function (error, data) {
            if (!error) {
                try {
                    let formattedData = data
                    if(formatting) {
                        formattedData = data.replace(/\s{2,10}/g, ' ').trim();
                    }
                    app.win.webContents.executeJavaScript(formattedData).then(() => {
                        console.verbose(`[LoadJSFile] '${path}' successfully injected.`)
                    });
                } catch (err) {
                    console.error(`[LoadJSFile] Error while injecting: ${path} - Error: ${err}`)
                }
            } else {
                console.error(`[LoadJSFile] Error while reading: '${path}' - Error: ${error}`)
            }
        });
    },

    LoadWebsite: function (win) {
        if (!win) return;

        app.locale = app.ame.init.LocaleInit();
        const [region, language] = app.locale,
            urlBase = (app.preferences.value('advanced.useBetaSite').includes(true)) ? `https://beta.music.apple.com` : `https://music.apple.com`,
            urlFallback = `https://music.apple.com/`,
            urlLanguage = `${urlBase}`;

        console.log(`[LoadWebsite] Attempting to load '${urlLanguage}'`)
        win.loadURL(urlLanguage).then(() => {
            let authedUrl;

            ipcMain.once('authorized', (e, args) => {
                app.isAuthorized = true
                authedUrl = args
            })

            if (app.preferences.value('general.startupPage') !== "browse") {
                app.ame.load.LoadJS('checkAuth.js')
                if (app.isAuthorized) {
                    win.webContents.clearHistory()
                    console.log(`[LoadWebsite] User is authenticated. Loading '${app.preferences.value('general.startupPage')}'. (${authedUrl}).`)
                }
            } else {
                console.log(`[LoadWebsite] Loaded '${urlLanguage}'`)
            }
        }).catch((err) => {
            win.loadURL(urlFallback).then(() => console.error(`[LoadWebsite] '${urlLanguage}' was unavailable, falling back to '${urlFallback}' | ${err}`))
        })
    },

    LoadFiles: function () {
        app.ame.load.LoadJS('settingsPage.js');
        if (app.preferences.value('visual.removeAppleLogo').includes(true)) {
            app.win.webContents.insertCSS(`
            @media only screen and (max-width: 483px) {
                .web-navigation__nav-list {
                        margin-top: 50px;
                    }
                }
            }
            `).catch((e) => console.error(e));
        }

        if (app.preferences.value('visual.useOperatingSystemAccent').includes(true)) {
            if (systemPreferences.getAccentColor()) {
                const accent = '#' + systemPreferences.getAccentColor().slice(0, -2)
                app.win.webContents.insertCSS(`
                :root {
                        --keyColor: ${accent} !important;
                        --systemAccentBG: ${accent} !important;
                        --keyColor-rgb: ${app.ame.utils.hexToRgb(accent).r} ${app.ame.utils.hexToRgb(accent).g} ${app.ame.utils.hexToRgb(accent).b} !important;
                    }
                }
                `).catch((e) => console.error(e));
            }
        } else {

        }

        /* Load Window Frame */
        if (app.preferences.value('visual.frameType') === 'mac') {
            app.ame.load.LoadJS('frame_macOS.js')
        } else if ((app.preferences.value('visual.frameType') === 'mac-right')) {
            app.ame.load.LoadJS('frame_Windows.js')
        } else if (process.platform === 'darwin' && !app.preferences.value('visual.frameType')) {
            app.ame.load.LoadJS('frame_macOS.js')
        } else if (process.platform === 'win32' && !app.preferences.value('visual.frameType')) {
            app.ame.load.LoadJS('frame_Windows.js')
            if (app.win.isMaximized()) {
                app.win.webContents.executeJavaScript(`if (document.querySelector("#maximize")) { document.querySelector("#maximize").classList.add("maxed"); }`).catch((e) => console.error(e));
            }
        }
        
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
        if (!backButtonChecks() && app.win.webContents.canGoBack()) {
            app.ame.load.LoadJS('backButton.js')
        } else {
            /* Remove it if user cannot go back */
            app.win.webContents.executeJavaScript(`if (document.querySelector('#backButtonBar')) { document.getElementById('backButtonBar').remove() };`).catch((e) => console.error(e));
        }

        /* Load the Startup JavaScript Function */
        app.win.webContents.executeJavaScript('if (AMJavaScript) { AMJavaScript.LoadCustom(); }').catch((e) => console.error(e));
    },

    LoadOneTimeFiles: function () {
        // Inject the custom stylesheet
        app.ame.load.LoadCSS('custom-stylesheet.css')

        // Inject Plugin Interaction
        if(app.pluginsEnabled) {
            app.ame.load.LoadJS('pluginSystem.js', false)
        }

        // Lyrics
        app.ame.load.LoadJS('lyrics.js')

        // Vue Test
        // app.ame.load.LoadJS('vue-managed.js')
        // app.ame.load.LoadJS('vue.js')

        // Bulk JavaScript Functions
        app.ame.load.LoadJS('custom.js')

        // Window Frames
        if (app.preferences.value('visual.frameType') === 'mac') {
            app.ame.load.LoadCSS('frame_macOS_emulation.css')
        } else if (app.preferences.value('visual.frameType') === 'mac-right') {
            app.ame.load.LoadCSS('frame_macOS_emulation_right.css')
        } else if (process.platform === 'win32' && !app.preferences.value('visual.frameType')) {
            app.ame.load.LoadCSS('frame_Windows.css')
        }

        // Set the settings variables if needed
        if (app.preferences.value('visual.frameType') === 'mac' || app.preferences.value('visual.frameType') === 'mac-right') {
            app.preferences.value('visual.removeUpsell', [true]);
            app.preferences.value('visual.removeAppleLogo', [true]);
        }

        // Streamer Mode
        if (app.preferences.value('visual.streamerMode').includes(true)) {
            app.ame.load.LoadCSS('streamerMode.css')
        }

        /* Remove the Scrollbar */
        if (app.preferences.value('advanced.removeScrollbars').includes(true)) {
            app.win.webContents.insertCSS('::-webkit-scrollbar { display: none; }');
        } else {
            app.ame.load.LoadCSS('macosScrollbar.css')
        }

        /* Inject the MusicKitInterop file */
        app.win.webContents.executeJavaScript('MusicKitInterop.init()').catch((e) => console.error(e));
    }
}