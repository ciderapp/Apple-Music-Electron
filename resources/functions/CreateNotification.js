const {app, Notification} = require('electron')
const {join} = require('path')

exports.CreateNotification = function (attributes) {
    console.log(`[CreateNotification] Attempting to CreateNotification with parameters:`)
    console.log(`[CreateNotification] Config Option: ${app.config.preferences.playbackNotifications}`)
    console.log(`[CreateNotification] Notification Supported: ${Notification.isSupported()}`)
    if (!app.config.preferences.playbackNotifications || !Notification.isSupported()) return;


    if (app.config.preferences.notificationsMinimized) {
        const isAppHidden = !app.win.isVisible()
        console.log(`[CreateNotification] [notificationsMinimized] Config Notification Minimized: ${app.config.preferences.notificationsMinimized}`)
        console.log(`[CreateNotification] [notificationsMinimized] App Minimized: ${app.win.isMinimized()}`)
        console.log(`[CreateNotification] [notificationsMinimized] App Hidden: ${isAppHidden}`)
        if (isAppHidden || app.win.isMinimized()) {

        } else {
            return;
        }
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
            actions: [ {
                type: 'button',
                text: 'Skip'
            }]
        }
    }

    app.ipc.existingNotification = new Notification(NOTIFICATION_OBJECT)
    app.ipc.existingNotification.show()

    if (process.platform === "darwin") {
        app.ipc.existingNotification.addListener('action', (_event, index) => {
            app.win.webContents.executeJavaScript("MusicKit.getInstance().skipToNextItem()").then(() => console.log("[CreateNotification] skipToNextItem"))
        });
    }
}