const {app, Menu, nativeTheme, Notification, TouchBar} = require("electron");
const {TouchBarButton, TouchBarLabel, TouchBarSpacer} = TouchBar
const nativeImage = require('electron').nativeImage
const {join} = require("path");
const SentryInit = require("./init").SentryInit;
SentryInit()

const trayIconDir = (nativeTheme.shouldUseDarkColors ? join(__dirname, `../icons/media/light/`) : join(__dirname, `../icons/media/dark/`));
const AppleMusic = {
    pausePlay() {
        console.verbose('[AppleMusic] pausePlay run.')
        console.log(app.currentPlaybackActivity)
        if (app.currentPlaybackActivity.status) {
            console.verbose('[AppleMusic] pause run.')
            app.win.webContents.executeJavaScript("MusicKit.getInstance().pause()").catch((err) => console.error(err))
        } else {
            console.verbose('[AppleMusic] play run.')
            app.win.webContents.executeJavaScript("MusicKit.getInstance().play()").catch((err) => console.error(err))
        }
    },
    nextTrack() {
        console.verbose('[AppleMusic] nextTrack run.')
        app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToNextItem()").catch((err) => console.error(err))
    },
    previousTrack() {
        console.verbose('[AppleMusic] previousTrack run.')
        app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToPreviousItem()").catch((err) => console.error(err))
    },
    icons: {
        pause: nativeImage.createFromPath(join(trayIconDir, 'pause.png')).resize({width: 32, height: 32}),
        play: nativeImage.createFromPath(join(trayIconDir, 'play.png')).resize({width: 32, height: 32}),
        nextTrack: nativeImage.createFromPath(join(trayIconDir, 'next.png')).resize({width: 32, height: 32}),
        previousTrack: nativeImage.createFromPath(join(trayIconDir, 'previous.png')).resize({width: 32, height: 32}),
        inactive: {
            play: nativeImage.createFromPath(join(trayIconDir, 'play-inactive.png')).resize({width: 32, height: 32}),
            nextTrack: nativeImage.createFromPath(join(trayIconDir, 'next-inactive.png')).resize({width: 32, height: 32}),
            previousTrack: nativeImage.createFromPath(join(trayIconDir, 'previous-inactive.png')).resize({width: 32, height: 32}),
        }
    }
};

module.exports = {

    SetDockMenu: function () {
        if (process.platform !== 'darwin') return;

        app.dock.setMenu(Menu.buildFromTemplate([
            {
                label: 'Show Preferences',
                click() {
                    app.preferences.show()
                }
            }
        ]))

    },

    SetApplicationMenu: function () {
        if (process.platform !== "darwin") return;
        Menu.setApplicationMenu(Menu.buildFromTemplate([
            {
                label: app.getName(),
                submenu: [
                    {
                        label: 'Show Preferences',
                        accelerator: 'CommandOrControl+Alt+S',
                        click() {
                            app.preferences.show()
                        }
                    }
                ]
            },
            {
                label: 'Support',
                submenu: [
                    {
                        label: 'Discord',
                        click() {
                            require("shell").openExternal("https://discord.gg/CezHYdXHEM")
                        }
                    },
                    {
                        label: 'GitHub Wiki',
                        click() {
                            require("shell").openExternal("https://github.com/Apple-Music-Electron/Apple-Music-Electron/wiki")
                        }
                    }
                ]
            },
            {
                label: 'Development',
                submenu: [
                    {
                        label: 'Open Dev Tools',
                        accelerator: 'CommandOrControl+Shift+I',
                        click() {
                            app.win.webContents.openDevTools()
                        }
                    }
                ]
            }
        ]));
    },

    SetContextMenu: function (visibility) {

        if (visibility) {
            app.tray.setContextMenu(Menu.buildFromTemplate([
                {
                    label: 'Check for Updates',
                    click: function () {
                        app.checkUpdates(true)
                    }
                },
                {
                    label: 'Minimize to Tray',
                    click: function () {
                        if (typeof app.win.hide === 'function') {
                            app.win.hide();
                        }
                    }
                },
                {
                    label: 'Quit',
                    click: function () {
                        app.isQuiting = true
                        app.quit();
                    }
                }
            ]));
        } else {
            app.tray.setContextMenu(Menu.buildFromTemplate([
                {
                    label: 'Check for Updates',
                    click: function () {
                        app.checkUpdates(true)
                    }
                },
                {
                    label: 'Show Apple Music',
                    click: function () {
                        if (typeof app.win.show === 'function') {
                            app.win.show();
                        }
                    }
                },
                {
                    label: 'Quit',
                    click: function () {
                        app.isQuiting = true
                        app.quit();
                    }
                }
            ]));
        }
        return true

    },

    SetTaskList: function () {
        if (process.platform !== "win32") return;

        app.setUserTasks([
            {
                program: process.execPath,
                arguments: '--force-quit',
                iconPath: process.execPath,
                iconIndex: 0,
                title: 'Quit Apple Music'
            }
        ]);
        return true
    },

    SetButtons: function () {

        if (process.platform === 'win32') { // Set the Windows Thumbnail Toolbar Buttons
            if (app.currentPlaybackActivity) {
                app.win.setThumbarButtons([
                    {
                        tooltip: 'Previous',
                        icon: AppleMusic.icons.previousTrack,
                        click() {
                            AppleMusic.previousTrack()
                        }
                    },
                    {
                        tooltip: app.currentPlaybackActivity.status ? 'Pause' : 'Play',
                        icon: app.currentPlaybackActivity.status ? AppleMusic.icons.pause : AppleMusic.icons.play,
                        click() {
                            AppleMusic.pausePlay()
                        }
                    },
                    {
                        tooltip: 'Next',
                        icon: AppleMusic.icons.nextTrack,
                        click() {
                            AppleMusic.nextTrack()
                        }
                    }
                ]);
            } else {
                app.win.setThumbarButtons([
                    {
                        tooltip: 'Previous',
                        icon: AppleMusic.icons.inactive.previousTrack,
                        flags: ["disabled"]
                    },
                    {
                        tooltip: 'Play',
                        icon: AppleMusic.icons.inactive.play,
                        flags: ["disabled"]
                    },
                    {
                        tooltip: 'Next',
                        icon: AppleMusic.icons.inactive.nextTrack,
                        flags: ["disabled"]
                    }
                ]);
            }
        } else if (process.platform === 'darwin') { // Set the macOS Touchbar
            if (!app.currentPlaybackActivity) return;

            const nextTrack = new TouchBarButton({
                icon: AppleMusic.icons.nextTrack,
                click: () => {
                    AppleMusic.nextTrack()
                }
            })

            const previousTrack = new TouchBarButton({
                icon: AppleMusic.icons.previousTrack,
                click: () => {
                    AppleMusic.previousTrack()
                }
            })

            const playPause = new TouchBarButton({
                icon: app.currentPlaybackActivity.status ? AppleMusic.icons.pause : AppleMusic.icons.play,
                click: () => {
                    AppleMusic.pausePlay()
                }
            })

            const trackInfo = new TouchBarLabel({
                label: app.currentPlaybackActivity ? `${app.currentPlaybackActivity.name} by ${app.currentPlaybackActivity.artistName}` : `Nothing is Playing`
            })

            const touchBar = new TouchBar({
                items: [
                    previousTrack,
                    playPause,
                    nextTrack,
                    new TouchBarSpacer({size: 'flexible'}),
                    trackInfo,
                    new TouchBarSpacer({size: 'flexible'})
                ]
            })

            app.win.setTouchBar(touchBar)
        }
    },

    SetTrayTooltip: function (attributes) {
        if (!app.preferences.value('general.trayTooltipSongName').includes(true)) return;

        console.verbose(`[UpdateTooltip] Updating Tooltip for ${attributes.name} to ${attributes.status}`)

        if (attributes.status === true) {
            app.tray.setToolTip(`Playing ${attributes.name} by ${attributes.artistName} on ${attributes.albumName}`);
        } else {
            app.tray.setToolTip(`Paused ${attributes.name} by ${attributes.artistName} on ${attributes.albumName}`);
        }
    },

    CreateNotification: function (attributes) {
        if (!Notification.isSupported() || !(app.preferences.value('general.playbackNotifications').includes(true) || app.preferences.value('general.playbackNotifications').includes('minimized'))) return;

        if (app.preferences.value('general.playbackNotifications').includes("minimized") && !(!app.win.isVisible() || app.win.isMinimized())) {
            return;
        }

        console.verbose(`[CreateNotification] Notification Generating | Function Parameters: SongName: ${attributes.name} | Artist: ${attributes.artistName} | Album: ${attributes.albumName}`)

        if (app.ipc.existingNotification) {
            console.log("[CreateNotification] Existing Notification Found - Removing. ")
            app.ipc.existingNotification.close()
            app.ipc.existingNotification = false
        }

        const NOTIFICATION_OBJECT = {
            title: attributes.name,
            body: `${attributes.artistName} - ${attributes.albumName}`,
            silent: true,
            icon: join(__dirname, '../icons/icon.png'),
            actions: [{
                type: 'button',
                text: 'Skip'
            }]
        }

        app.ipc.existingNotification = new Notification(NOTIFICATION_OBJECT)
        app.ipc.existingNotification.show()


        app.ipc.existingNotification.addListener('action', (_event) => {
            app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToNextItem()").then(() => console.log("[CreateNotification] skipToNextItem"))
        });
    }
}