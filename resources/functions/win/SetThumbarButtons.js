const {nativeImage} = require("electron");
const {app, nativeTheme} = require('electron')
const {join} = require('path')
const { systemPreferences } = require('electron')

exports.SetThumbarButtons = function (state) {

    let trayicondir;
    if (process.platform !== "win32") return;

    let preferredtheme = nativeTheme.themeSource

    if (preferredtheme === "") {
        if (systemPreferences.isDarkMode()) {
            trayicondir = join(__dirname, `./media/light/`);
        } else {
            trayicondir = join(__dirname, `./media/dark/`);
        }
    } else if (preferredtheme === "dark") {
        trayicondir = join(__dirname, `./media/light/`);
    } else {
        trayicondir = join(__dirname, `./media/dark/`);
    }

    let array;
    switch (state) {

        // Paused
        case false:
        case "paused":
            array = [
                {
                    tooltip: 'Previous',
                    icon: nativeImage.createFromPath(trayicondir+`previous.png`),
                    click() {
                        console.log('[setThumbarButtons] Previous song button clicked.')
                        app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToPreviousItem()").then(() => console.log("[ThumbarPlaying] skipToPreviousItem"))
                    }
                },
                {
                    tooltip: 'Play',
                    icon: nativeImage.createFromPath(trayicondir+`play.png`),
                    click() {
                        console.log('[setThumbarButtons] Play song button clicked.')
                        app.win.webContents.executeJavaScript("MusicKit.getInstance().play()").then(() => console.log("[ThumbarPlaying] play"))
                    }
                },
                {
                    tooltip: 'Next',
                    icon: nativeImage.createFromPath(trayicondir+`next.png`),
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
                    icon: nativeImage.createFromPath(trayicondir+`previous-inactive.png`).resize({ width: 32, height: 32 }),
                    flags: "disabled"
                },
                {
                    tooltip: 'Play',
                    icon: nativeImage.createFromPath(trayicondir+`play-inactive.png`).resize({ width: 32, height: 32 }),
                    flags: "disabled"
                },
                {
                    tooltip: 'Next',
                    icon: nativeImage.createFromPath(trayicondir+`next-inactive.png`).resize({ width: 32, height: 32 }),
                    flags: "enabled"
                }
            ];
            break;

        // Playing
        case true:
        case "playing":
            array = [
                {
                    tooltip: 'Previous',
                    icon: nativeImage.createFromPath(trayicondir+`previous.png`).resize({ width: 32, height: 32 }),
                    click() {
                        console.log('[setThumbarButtons] Previous song button clicked.')
                        app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToPreviousItem()").then(() => console.log("[ThumbarPaused] skipToPreviousItem"))
                    }
                },
                {
                    tooltip: 'Pause',
                    icon: nativeImage.createFromPath(trayicondir+`pause.png`).resize({ width: 32, height: 32 }),
                    click() {
                        console.log('[setThumbarButtons] Play song button clicked.')
                        app.win.webContents.executeJavaScript("MusicKit.getInstance().pause()").then(() => console.log("[ThumbarPaused] pause"))
                    }
                },
                {
                    tooltip: 'Next',
                    icon: nativeImage.createFromPath(trayicondir+`next.png`).resize({ width: 32, height: 32 }),
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