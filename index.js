require('v8-compile-cache');
const {app, globalShortcut, session} = require('electron');

// Creating the Application Window and Calling all the Functions
function CreateWindow() {
    console.log('[CreateWindow] Started.')
    const {InstanceHandler} = require('./resources/functions/handler/InstanceHandler')
    const ExistingInstance = InstanceHandler()
    if (ExistingInstance === true) {
        console.log('[Apple-Music-Electron] [InstanceHandler] Existing Instance Found. Terminating.')
        app.quit()
        return;
    } else {
        console.log('[Apple-Music-Electron] [InstanceHandler] No existing instances found.')
    }

    const {CreateBrowserWindow} = require('./resources/functions/CreateBrowserWindow')
    app.win = CreateBrowserWindow() // Create the Browser Window

    const {SetThumbarButtons} = require('./resources/functions/win/SetThumbarButtons')
    SetThumbarButtons() // Set Inactive Thumbar Icons

    const {LoadWebsite} = require('./resources/functions/load/LoadWebsite')
    LoadWebsite() // Load the Website

    const {SettingsHandler} = require('./resources/functions/handler/SettingsHandler')
    SettingsHandler() // Handles updates to settings

    const {WindowStateHandler} = require('./resources/functions/handler/WindowStateHandler')
    WindowStateHandler() // Handling the Window

    const {playbackStateDidChange} = require('./resources/functions/handler/PlaybackStateHandler')
    playbackStateDidChange() // IPCMain

    const {mediaItemStateDidChange} = require('./resources/functions/handler/MediaStateHandler')
    mediaItemStateDidChange() // IPCMain
}

// When its Ready call it all
app.on('ready', () => {
    // Apple Header tomfoolery.
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        details.responseHeaders['Content-Security-Policy'] = 'unsafe-inline'
        callback({ responseHeaders: details.responseHeaders })
    })

    const {InitializeLogging} = require('./resources/functions/init/Init-Logging')
    InitializeLogging()

    const {SettingsMenuInit} = require("./resources/functions/settings/OpenMenu");
    SettingsMenuInit()
    console.log('[Apple-Music-Electron] Current Configuration:')
    console.log(app.preferences._preferences)

    const {InitializeBase} = require('./resources/functions/init/Init-Base')
    InitializeBase()

    const {ApplicationReady} = require('./resources/functions/init/App-Ready')
    ApplicationReady()
    console.log("[Apple-Music-Electron] Application is Ready.")
    console.log("[Apple-Music-Electron] Creating Window...")
    setTimeout(CreateWindow, process.platform === "linux" ? 1000 : 0);
});

app.on('window-all-closed', () => {
    app.quit()
});

app.on('before-quit', function () {
    app.mpris.clearActivity()
    app.discord.rpc.disconnect()
    console.log("[DiscordRPC] Disconnecting from Discord.")
    console.log("---------------------------------------------------------------------")
    console.log("Application Closing...")
    console.log("---------------------------------------------------------------------")
    app.isQuiting = true;
    globalShortcut.unregisterAll()
});



