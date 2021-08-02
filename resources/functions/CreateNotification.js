const {app, Notification} = require('electron')
const {join} = require('path')

exports.CreateNotification = function (attributes) {
    if (!Notification.isSupported() || !(app.preferences.value('general.playbackNotifications').includes(true) || app.preferences.value('general.playbackNotifications').includes('minimized'))) return;

    if (app.preferences.value('general.playbackNotifications').includes("minimized") && !(!app.win.isVisible() || app.win.isMinimized())) {
        return;
    }


    console.log(`[CreateNotification] Notification Generating | Function Parameters: SongName: ${attributes.name} | Artist: ${attributes.artistName} | Album: ${attributes.albumName}`)

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
        actions: []
    }

    if (process.platform === "darwin") {
        NOTIFICATION_OBJECT.actions = {
            actions: [{
                type: 'button',
                text: 'Skip'
            }]
        }
    }

    app.ipc.existingNotification = new Notification(NOTIFICATION_OBJECT)
    app.ipc.existingNotification.show()

    if (process.platform === "darwin") {
        app.ipc.existingNotification.addListener('action', (_event) => {
            app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToNextItem()").then(() => console.log("[CreateNotification] skipToNextItem"))
        });
    }
}