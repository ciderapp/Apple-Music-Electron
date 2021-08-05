const {app} = require('electron')
const {LoadJS} = require('./load/LoadJS')
const {LoadCSS} = require('./load/LoadCSS')

module.exports = {
    LoadFiles: async function () {
        /* Custom UWP Window Frame (WIP) */
        /*if (app.preferences.value('visual.emulateMacOS').includes(false)) {
            LoadCSS('uwpWindowFrame.css')
            LoadJS('uwpWindowFrame.js')
        }*/

        /* Remove Apple Music Logo */
        if (app.preferences.value('visual.removeAppleLogo').includes(true)) {
            LoadJS('removeAppleLogo.js')
        }

        /* Remove Upsell */
        if (app.preferences.value('visual.removeUpsell').includes(true)) {
            LoadJS('removeUpsell.js')
        }

        /* Load the Emulation Files */
        if (app.preferences.value('visual.emulateMacOS').includes('left')) {
            LoadJS('emulateMacOS.js')
        } else if (app.preferences.value('visual.emulateMacOS').includes('right')) {
            LoadJS('emulateMacOS_rightAlign.js')
        }

        LoadJS('custom.js')

        /* Load Back Button */
        const urlBase = (app.preferences.value('advanced.useBetaSite')) ? `https://beta.music.apple.com` : `https://music.apple.com`;
        const backButtonBlacklist = [`${urlBase}/${app.locale[0]}/listen-now?l=${app.locale[0]}`, `${urlBase}/${app.locale[0]}/browse?l=${app.locale[0]}`, `${urlBase}/${app.locale[0]}/radio?l=${app.locale[0]}`, `${urlBase}/${app.locale[0]}/search?l=${app.locale[0]}`, `${urlBase}/library/recently-added?l=${app.locale[0]}`, `${urlBase}/library/artists?l=${app.locale[0]}`, `${urlBase}/library/albums?l=${app.locale[0]}`, `${urlBase}/library/songs?l=${app.locale[0]}`, `${urlBase}/library/made-for-you?l=${app.locale[0]}`, `${urlBase}/${app.locale[0]}/listen-now`, `${urlBase}/${app.locale[0]}/browse`, `${urlBase}/${app.locale[0]}/radio`, `${urlBase}/${app.locale[0]}/search`, `${urlBase}/library/recently-added`, `${urlBase}/library/artists`, `${urlBase}/library/albums`, `${urlBase}/library/songs`, `${urlBase}/library/made-for-you`];

        if (app.win.webContents.canGoBack() && app.preferences.value('visual.backButton').includes(true) && !backButtonBlacklist.includes(app.win.webContents.getURL()) && !app.win.webContents.getURL().includes('library/artists')) {
            LoadJS('backButton.js')
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
        LoadCSS('custom-stylesheet.css')

        // Load the appropriate css file for glasstron
        if (app.preferences.value('visual.transparencyMode').includes(true)) {
            LoadCSS('glasstron.css')
        } else {
            LoadCSS('glasstronDisabled.css')
        }

        // Set the settings variables if needed
        if (app.preferences.value('visual.emulateMacOS').includes('left') || app.preferences.value('visual.emulateMacOS').includes('right')) {
            app.preferences.value('visual.removeUpsell', [true]);
            app.preferences.value('visual.removeAppleLogo', [true]);
        }

        // Streamer Mode
        if (app.preferences.value('visual.streamerMode').includes(true)) {
            LoadCSS('streamerMode.css')
        }

        // Load Themes
        if (app.preferences.value('visual.theme') && !(app.preferences.value('visual.theme').includes('Template')) && !(app.preferences.value('visual.theme').includes('default'))) {
            LoadCSS(`${app.preferences.value('visual.theme')}.css`, true)
        }


    }
}