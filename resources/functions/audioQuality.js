const { app, BrowserWindow } = require('electron')
const {Analytics} = require("./analytics/sentry");
Analytics.init()

exports.audioQuality = {
    if (app.preferences.value('general.audioQuality').includes("auto")) {
        console.log("[AudioQuality] Audio Quality has been set to automatic.")
    } else {
        if (app.preferences.value('general.audioQuality').includes("high")) {
            app.win.webContents.executeJavaScript("").then(() => console.log(`[AudioQuality] Audio Quality has been set to High.`));
        }
    }
}

// still unfinished. been busy so commiting for now, shouldn't effect app runtime.