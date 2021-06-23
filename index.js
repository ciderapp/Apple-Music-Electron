require('v8-compile-cache');
const { app } = require('electron');

const { CreateUserFiles } = require('./resources/functions/CreateUserFiles')
CreateUserFiles()

const { InitializeBase } = require('./resources/functions/init/Init-Base')
InitializeBase()

const { CreateWindow } = require('./resources/init')

// This method will be called when Electron has finished initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
    console.log("[Apple-Music-Electron] Application is Ready.")
    console.log("[Apple-Music-Electron] Creating Window...")
    if (app.config.css.glasstron) { setTimeout(CreateWindow, process.platform === "linux" ? 1000 : 0); } else CreateWindow()
    // Electron has a bug on linux where it won't initialize properly when using transparency. To work around that, it is necessary to delay the window spawn function.
});


app.on('before-quit', function () {
    if (app.mpris) { // Reset Mpris when app is closed
        app.mpris.metadata = {'mpris:trackid': '/org/mpris/MediaPlayer2/TrackList/NoTrack'}
        app.mpris.playbackStatus = 'Stopped';
    }
    if (app.config.preferences.discordRPC) app.discord.client.disconnect()
    console.log("[DiscordRPC] Disconnecting from Discord.")
    console.log("---------------------------------------------------------------------")
    console.log("Application Closing...")
    console.log("---------------------------------------------------------------------")
    app.isQuiting = true;
});