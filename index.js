require('v8-compile-cache');
const {app, session} = require('electron');

// Initialize the Preferences so verbose doesnt fuck up
const appFuncs = require('./resources/functions/app-init');
app.ame = appFuncs()

// Run all the Before App is Ready Stuff
app.ame.init.LoggingInit();
app.ame.handler.LaunchHandler();
app.ame.handler.InstanceHandler();
app.ame.init.BaseInit();
app.ame.handler.VersionHandler();

// Creating the Application Window and Calling all the Functions
function CreateWindow() {
    if (app.isQuiting) { app.quit(); return; }

    app.win = app.ame.win.CreateBrowserWindow() // Create the BrowserWindow

    app.ame.handler.SettingsHandler(); // Handles updates to settings
    app.ame.handler.WindowStateHandler(); // Handling the Window
    app.ame.handler.PlaybackStateHandler(); // Playback Change Listener
    app.ame.handler.MediaStateHandler(); // Media Change Listener
    app.ame.handler.LyricsHandler(); // Lyrics Handling
    app.ame.handler.RendererListenerHandlers(); // Renderer Listeners

    if (process.platform === 'win32' && app.transparency) { app.win.show() } // Show the window so SetThumbarButtons doesnt break
    app.ame.win.SetButtons() // Set Inactive Thumbnail Toolbar Icons or TouchBar
    app.ame.win.SetApplicationMenu()
}

// When its Ready call it all
app.on('ready', () => {
    if (app.isQuiting) { app.quit(); return; }

    // Apple Header tomfoolery.
    session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
        details.responseHeaders['Content-Security-Policy'] = 'unsafe-inline'
        callback({ responseHeaders: details.responseHeaders })
    })

    const {AppReady} = require('./resources/functions/init')
    AppReady()
    
    console.log('[Apple-Music-Electron] Application is Ready. Creating Window.')
    CreateWindow()
});

app.on('activate', () => {
    if (app.win === null) {
        CreateWindow()
    } else {
        app.win.show()
    }
})

app.on('widevine-ready', (version, lastVersion) => {
    if (null !== lastVersion) {
        console.log('[Apple-Music-Electron][Widevine] Widevine ' + version + ', upgraded from ' + lastVersion + ', is ready to be used!')
    } else {
        console.log('[Apple-Music-Electron][Widevine] Widevine ' + version + ' is ready to be used!')
    }
})

app.on('widevine-update-pending', (currentVersion, pendingVersion) => {
    console.log('[Apple-Music-Electron][Widevine] Widevine ' + currentVersion + ' is ready to be upgraded to ' + pendingVersion + '!')
})

app.on('widevine-error', (error) => {
    console.log('[Apple-Music-Electron][Widevine] Widevine installation encountered an error: ' + error)
    app.exit()
})

app.on("window-all-closed", app.quit);

app.on('before-quit', () => {
    app.win.removeAllListeners('close');
    app.win.close();
    app.ame.mpris.clearActivity()
    app.ame.discord.disconnect()
    console.log('---------------------------------------------------------------------')
    console.log('Application Closing...')
    console.log('---------------------------------------------------------------------')
});