const {app} = require('electron')
const {Analytics} = require("./sentry");
Analytics.init()

module.exports = {
    LoadFiles: async function () {
        /* Remove Apple Music Logo */
        if (app.preferences.value('visual.removeAppleLogo').includes(true)) {
            app.funcs.LoadJS('removeAppleLogo.js')
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
        if (app.preferences.value('visual.emulateMacOS').includes('left')) {
            app.funcs.LoadJS('emulateMacOS.js')
        } else if (app.preferences.value('visual.emulateMacOS').includes('right')) {
            app.funcs.LoadJS('emulateMacOS_rightAlign.js')
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

        /* Remove the Scrollbar */
        if (app.preferences.value('advanced.removeScrollbars').includes(true)) app.win.webContents.insertCSS('::-webkit-scrollbar { display: none; }');

        /* Inject the MusicKitInterop file */
        await app.win.webContents.executeJavaScript('MusicKitInterop.init()');
    },

    LoadOneTimeFiles: function () {
        // Inject the custom stylesheet
        app.funcs.LoadCSS('custom-stylesheet.css')

        // Load the appropriate css file for transparency
        if (app.transparency) {
            app.funcs.LoadCSS('transparency.css')
        } else {
            app.funcs.LoadCSS('transparencyDisabled.css')
        }

        // Set the settings variables if needed
        if (app.preferences.value('visual.emulateMacOS').includes('left') || app.preferences.value('visual.emulateMacOS').includes('right')) {
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


    }
}