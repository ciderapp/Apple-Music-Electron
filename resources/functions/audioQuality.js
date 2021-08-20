const { app, BrowserWindow } = require('electron')
const {Analytics} = require("./analytics/sentry");
Analytics.init()

exports.audioQuality = function() {
    function set() {
        if (app.preferences.value('general.audioQuality') === 'auto') {
            console.log("[Audio] Audio Quality has been set to automatic.")
        } else if (app.preferences.value('general.audioQuality') === 'high') {
            console.log("[Audio] User has requested the High preset. Contacting MusicKit to fulfill.")
            app.win.webContents.executeJavaScript("MusicKit.getInstance().Quality = HIGH").then(console.log("[Audio] Audio Quality has been set to High."))
        } else if (app.preferences.value('general.audioQuality') === 'standard') {
            console.log("[Audio] User has requested the Standard preset. Contacting MusicKit to fulfill.")
            app.win.webContents.executeJavaScript("MusicKit.getInstance().Quality = NORMAL")
        }
    }
}
// still unfinished. been busy so commiting for now, shouldn't effect app runtime. (this time)