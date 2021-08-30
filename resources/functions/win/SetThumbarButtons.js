const {app, nativeTheme} = require('electron')
const nativeImage = require('electron').nativeImage
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
                        if (app.preferences.value('advanced.verboseLogging').includes(true)) { console.log('[setThumbarButtons] Previous song button clicked.') }
                        app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToPreviousItem()").catch((err) => console.error(err))
                    }
                },
                {
                    tooltip: 'Play',
                    icon: Images.play,
                    click() {
                        if (app.preferences.value('advanced.verboseLogging').includes(true)) { console.log('[setThumbarButtons] Play song button clicked.') }

                        app.win.webContents.executeJavaScript("MusicKit.getInstance().play()").catch((err) => console.error(err))
                    }
                },
                {
                    tooltip: 'Next',
                    icon: Images.next,
                    click() {
                        if (app.preferences.value('advanced.verboseLogging').includes(true)) { console.log('[setThumbarButtons] Pause song button clicked.') }
                        app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToNextItem()").catch((err) => console.error(err))
                    }
                }
            ];
            break;

        // Inactive
        default:
        case "inactive":
            if (app.preferences.value('advanced.verboseLogging').includes(true)) { console.log('[setThumbarButtons] Thumbar has been set to default/inactive.') }
            array = [
                {
                    tooltip: 'Previous',
                    icon: Images.previousInactive,
                    flags: ["disabled"]
                },
                {
                    tooltip: 'Play',
                    icon: Images.playInactive,
                    flags: ["disabled"]
                },
                {
                    tooltip: 'Next',
                    icon: Images.nextInactive,
                    flags: ["disabled"]
                }
            ];
            break;

        // Playing
        case true:
        case "playing":
            if (app.preferences.value('advanced.verboseLogging').includes(true)) { console.log('[setThumbarButtons] Thumbar has been set to true/playing.') }
            array = [
                {
                    tooltip: 'Previous',
                    icon: Images.previous,
                    click() {
                        if (app.preferences.value('advanced.verboseLogging').includes(true)) { console.log('[setThumbarButtons] Previous song button clicked.') }
                        app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToPreviousItem()").catch((err) => console.error(err))
                    }
                },
                {
                    tooltip: 'Pause',
                    icon: Images.pause,
                    click() {
                        if (app.preferences.value('advanced.verboseLogging').includes(true)) { console.log('[setThumbarButtons] Play song button clicked.') }
                        app.win.webContents.executeJavaScript("MusicKit.getInstance().pause()").catch((err) => console.error(err))
                    }
                },
                {
                    tooltip: 'Next',
                    icon: Images.next,
                    click() {
                        if (app.preferences.value('advanced.verboseLogging').includes(true)) { console.log('[setThumbarButtons] Pause song button clicked.') }
                        app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToNextItem()").catch((err) => console.error(err))
                    }
                }
            ]
            break;
    }

    console.log((app.win.setThumbarButtons(array) ? '[setThumbarButtons] Thumbar Buttons Set.' : '[setThumbarButtons] Thumbar Buttons Failed to be set.'))
}