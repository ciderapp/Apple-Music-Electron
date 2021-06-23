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

    app.ipc.existingNotification = new Notification({
        title: attributes.name,
        body: `${attributes.artistName} - ${attributes.albumName}`,
        silent: true,
        icon: join(__dirname, '../icons/icon.png')
    })

    app.ipc.existingNotification.show()
}