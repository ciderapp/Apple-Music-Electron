const {app, Notification} = require('electron')
const {join} = require('path')

exports.CreatePlaybackNotification = function (attributes) {
    console.log('[CreatePlaybackNotification] Started.')

    if (!app.config.preferences.playbackNotifications || !Notification.isSupported()) return;

    if (app.config.preferences.notificationsMinimized && (!app.win.isMinimized() || app.win.isVisible())) return;


    if (process.platform === "win32") app.setAppUserModelId("Apple Music");
    console.log(`[CreatePlaybackNotification] Notification Generating | Function Parameters: SongName: ${attributes.name} | Artist: ${attributes.artistName} | Album: ${attributes.albumName}`)

    try {
        if (NOTIFICATION) {
            console.log("[CreatePlaybackNotification] Existing Notification Found - Removing. ")
            NOTIFICATION.close()
            NOTIFICATION = false
        }
    } catch (err) {
        console.log(`[CreatePlaybackNotification] No Existing Notification Found: ${err}. `)
    }


    const NOTIFICATION_OBJECT = {
        title: attributes.name,
        body: `${attributes.artistName} - ${attributes.albumName}`,
        silent: true,
        icon: join(__dirname, './icons/icon.png')
    }

    NOTIFICATION = new Notification(NOTIFICATION_OBJECT).show()
    return true


}