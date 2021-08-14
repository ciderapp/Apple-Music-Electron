const {app, nativeTheme, nativeImage} = require('electron')
const {join} = require('path')
const {Analytics} = require("../analytics/sentry");
Analytics.init()

let Images;

exports.SetThumbarButtons = function (state) {
    if (process.platform !== "win32") return;

    let trayIconDir;

    if (nativeTheme.shouldUseDarkColors) {
        trayIconDir = join(__dirname, `./media/light/`);
    } else {
        trayIconDir = join(__dirname, `./media/dark/`);
    }

    if (!Images) {
        Images = {
            next: nativeImage.createFromPath(trayIconDir + `next.png`).resize({width: 32, height: 32}),
            nextInactive: nativeImage.createFromPath(trayIconDir + `next-inactive.png`).resize({width: 32, height: 32}),

            pause: nativeImage.createFromPath(trayIconDir + `pause.png`).resize({width: 32, height: 32}),
            pauseInactive: nativeImage.createFromPath(trayIconDir + `pause-inactive.png`).resize({width: 32, height: 32}),

            play: nativeImage.createFromPath(trayIconDir + `play.png`).resize({width: 32, height: 32}),
            playInactive: nativeImage.createFromPath(trayIconDir + `play-inactive.png`).resize({width: 32, height: 32}),

            previous: nativeImage.createFromPath(trayIconDir + `previous.png`).resize({width: 32, height: 32}),
            previousInactive: nativeImage.createFromPath(trayIconDir + `previous-inactive.png`).resize({width: 32, height: 32}),
        }
    }

    let array;
    switch (state) {

        // Paused
        case false:
        case "paused":
            console.log('[setThumbarButtons] Thumbar has been set to false/paused.')
            array = [
                {
                    tooltip: 'Previous',
                    icon: Images.previous,
                    click() {
                        console.log('[setThumbarButtons] Previous song button clicked.')
                        app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToPreviousItem()").then(() => console.log("[ThumbarPlaying] skipToPreviousItem"))
                    }
                },
                {
                    tooltip: 'Play',
                    icon: Images.play,
                    click() {
                        console.log('[setThumbarButtons] Play song button clicked.')
                        app.win.webContents.executeJavaScript("MusicKit.getInstance().play()").then(() => console.log("[ThumbarPlaying] play"))
                    }
                },
                {
                    tooltip: 'Next',
                    icon: Images.next,
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
            console.log('[setThumbarButtons] Thumbar has been set to default/inactive.')
            array = [
                {
                    tooltip: 'Previous',
                    icon: Images.previousInactive,
                    flags: "disabled"
                },
                {
                    tooltip: 'Play',
                    icon: Images.playInactive,
                    flags: "disabled"
                },
                {
                    tooltip: 'Next',
                    icon: Images.nextInactive,
                    flags: "enabled"
                }
            ];
            break;

        // Playing
        case true:
        case "playing":
            console.log('[setThumbarButtons] Thumbar has been set to true/playing.')
            array = [
                {
                    tooltip: 'Previous',
                    icon: Images.previous,
                    click() {
                        console.log('[setThumbarButtons] Previous song button clicked.')
                        app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToPreviousItem()").then(() => console.log("[ThumbarPaused] skipToPreviousItem"))
                    }
                },
                {
                    tooltip: 'Pause',
                    icon: Images.pause,
                    click() {
                        console.log('[setThumbarButtons] Play song button clicked.')
                        app.win.webContents.executeJavaScript("MusicKit.getInstance().pause()").then(() => console.log("[ThumbarPaused] pause"))
                    }
                },
                {
                    tooltip: 'Next',
                    icon: Images.next,
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