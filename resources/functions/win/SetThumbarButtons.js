const {nativeImage} = require("electron");
const {app} = require('electron')
const {join} = require('path')

exports.SetThumbarButtons = function (state) {

    if (process.platform !== "win32") return;

    let theme = app.config.systemTheme
    if (theme === "dark") {
        theme = "light"
    }
    // please dont add this again.

    let array;
    switch (state) {

        // Paused
        case false:
        case "paused":
            array = [
                {
                    tooltip: 'Previous',
                    icon: nativeImage.createFromPath(join(__dirname, `./media/${theme}/previous.png`)).resize({ width: 32, height: 32 }),
                    click() {
                        console.log('[setThumbarButtons] Previous song button clicked.')
                        app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToPreviousItem()").then(() => console.log("[ThumbarPlaying] skipToPreviousItem"))
                    }
                },
                {
                    tooltip: 'Play',
                    icon: nativeImage.createFromPath(join(__dirname, `./media/${theme}/play.png`)).resize({ width: 32, height: 32 }),
                    click() {
                        console.log('[setThumbarButtons] Play song button clicked.')
                        app.win.webContents.executeJavaScript("MusicKit.getInstance().play()").then(() => console.log("[ThumbarPlaying] play"))
                    }
                },
                {
                    tooltip: 'Next',
                    icon: nativeImage.createFromPath(join(__dirname, `./media/${theme}/next.png`)).resize({ width: 32, height: 32 }),
                    click() {
                        console.log('[setThumbarButtons] Pause song button clicked.')
                        app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToNextItem()").then(() => console.log("[ThumbarPlaying] skipToNextItem"))
                    }
                }
            ];
            break;

        // Inactive
        default:
        case "inactive":
            array = [
                {
                    tooltip: 'Previous',
                    icon: nativeImage.createFromPath(join(__dirname, `./media/${theme}/previous-inactive.png`)).resize({ width: 32, height: 32 })
                },
                {
                    tooltip: 'Play',
                    icon: nativeImage.createFromPath(join(__dirname, `./media/${theme}/play-inactive.png`)).resize({ width: 32, height: 32 })
                },
                {
                    tooltip: 'Next',
                    icon: nativeImage.createFromPath(join(__dirname, `./media/${theme}/next-inactive.png`)).resize({ width: 32, height: 32 })
                }
            ];
            break;

        // Playing
        case true:
        case "playing":
            array = [
                {
                    tooltip: 'Previous',
                    icon: nativeImage.createFromPath(join(__dirname, `./media/${theme}/previous.png`)).resize({ width: 32, height: 32 }),
                    click() {
                        console.log('[setThumbarButtons] Previous song button clicked.')
                        app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToPreviousItem()").then(() => console.log("[ThumbarPaused] skipToPreviousItem"))
                    }
                },
                {
                    tooltip: 'Pause',
                    icon: nativeImage.createFromPath(join(__dirname, `./media/${theme}/pause.png`)).resize({ width: 32, height: 32 }),
                    click() {
                        console.log('[setThumbarButtons] Play song button clicked.')
                        app.win.webContents.executeJavaScript("MusicKit.getInstance().pause()").then(() => console.log("[ThumbarPaused] pause"))
                    }
                },
                {
                    tooltip: 'Next',
                    icon: nativeImage.createFromPath(join(__dirname, `./media/${theme}/next.png`)).resize({ width: 32, height: 32 }),
                    click() {
                        console.log('[setThumbarButtons] Pause song button clicked.')
                        app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToNextItem()").then(() => console.log("[ThumbarPaused] skipToNextItem"))
                    }
                }
            ]
            break;
    }
    app.win.setThumbarButtons(array)
}