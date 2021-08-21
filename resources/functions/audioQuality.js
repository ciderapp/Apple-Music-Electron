const { app } = require('electron')
const {Analytics} = require("./analytics/sentry");
Analytics.init()

exports.audioQuality = function() {
        // Check for incognito mode
        if (app.preferences.value('general.incognitoMode').includes(true)) {
            app.win.webContents.executeJavaScript("MusicKit.privateEnabled = true")
        }

        // Audio Quality
        if (app.preferences.value('general.audioQuality') === 'auto') {
            console.log("[Audio] Audio Quality has been set to automatic.")
        } else if (app.preferences.value('general.audioQuality') === 'high') {
            console.log("[Audio] User has requested the High preset. Contacting MusicKit to fulfill.")
            app.win.webContents.executeJavaScript("MusicKit.PlaybackBitrate = 256")
            console.log("[Audio] Audio Quality has been set to High (256kbps).")
        } else if (app.preferences.value('general.audioQuality') === 'normal') {
            console.log("[Audio] User has requested the Normal preset. Contacting MusicKit to fulfill.")
            app.win.webContents.executeJavaScript("MusicKit.PlaybackBitrate = 64")
            console.log("[Audio] Audio Quality has been set to Normal (64kbps).")
        }
}