require('v8-compile-cache');
const { app} = require('electron');

const {InitializeLogging} = require('./resources/functions/init/Init-Logging')
InitializeLogging()

const { LoadUserFiles } = require('./resources/functions/LoadUserFiles')
app.config = LoadUserFiles()

const { InitializeBase } = require('./resources/functions/init/Init-Base')
InitializeBase()

// Creating the Application Window and Calling all the Functions
function CreateWindow() {
    console.log('[CreateWindow] Started.')

    const {InstanceHandler} = require('./resources/functions/handler/InstanceHandler')
    const ExistingInstance = InstanceHandler()
    if (ExistingInstance) return;

    const {CreateBrowserWindow} = require('./resources/functions/CreateBrowserWindow')
    app.win = CreateBrowserWindow() // Create the Browser Window

    const {SetThumbarButtons} = require('./resources/functions/win/SetThumbarButtons')
    SetThumbarButtons() // Set Inactive Thumbar Icons

    const {LoadWebsite} = require('./resources/functions/LoadWebsite')
    LoadWebsite() // Load the Website

    const {LoadJavascript} = require('./resources/functions/LoadJavascript')
    LoadJavascript() // Load the Website Javascript

    const {WindowStateHandler} = require('./resources/functions/handler/WindowStateHandler')
    WindowStateHandler() // Handling the Window

    const {playbackStateDidChange} = require('./resources/functions/handler/PlaybackStateHandler')
    playbackStateDidChange() // IPCMain

    const {mediaItemStateDidChange} = require('./resources/functions/handler/MediaStateHandler')
    mediaItemStateDidChange() // IPCMain
}

// When its Ready call it all
app.on('ready', () => {
    const { ApplicationReady } = require('./resources/functions/init/App-Ready')
    ApplicationReady()
    console.log("[Apple-Music-Electron] Application is Ready.")

    console.log("[Apple-Music-Electron] Creating Window...")
    if (app.config.css.glasstron) { setTimeout(CreateWindow, process.platform === "linux" ? 1000 : 0); } else CreateWindow()

    const {CheckUserFiles} = require('./resources/functions/userfiles/CheckUserFiles')
    CheckUserFiles()
});

app.on('window-all-closed', () => {
    if (app.mpris) { // Reset Mpris when app is closed
        app.mpris.metadata = {'mpris:trackid': '/org/mpris/MediaPlayer2/TrackList/NoTrack'}
        app.mpris.playbackStatus = 'Stopped';
    }
    app.quit()
});

app.on('before-quit', function () {
    if (app.mpris) { // Reset Mpris when app is closed
        app.mpris.metadata = {'mpris:trackid': '/org/mpris/MediaPlayer2/TrackList/NoTrack'}
        app.mpris.playbackStatus = 'Stopped';
    }
    if (app.config.preferences.discordRPC && app.discord.client) app.discord.client.disconnect
    console.log("[DiscordRPC] Disconnecting from Discord.")
    console.log("---------------------------------------------------------------------")
    console.log("Application Closing...")
    console.log("---------------------------------------------------------------------")
    app.isQuiting = true;
});