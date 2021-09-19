require('v8-compile-cache');
const {app, globalShortcut, session} = require('electron');

// Run all the Before App is Ready Stuff
const {PreferencesInit} = require('./resources/functions/init');
PreferencesInit()

const {LaunchHandler} = require('./resources/functions/handler')
LaunchHandler()

const {LoggingInit} = require('./resources/functions/init')
LoggingInit()

const {BaseInit} = require('./resources/functions/init')
BaseInit()

const winFuncs = require('./resources/functions/win')
const loadFuncs = require('./resources/functions/load')
app.funcs = Object.assign(winFuncs, loadFuncs)
app.funcs.discord = require('./resources/functions/media/discordrpc')
app.funcs.lastfm = require('./resources/functions/media/lastfm')
app.funcs.mpris = require('./resources/functions/media/mpris')

const {VersionHandler} = require('./resources/functions/handler');
VersionHandler()

// Creating the Application Window and Calling all the Functions
function CreateWindow() {
    if (app.preferences.value('advanced.verboseLogging').includes(true)) console.log('[CreateWindow] Started.');
    const InstanceHandler = require('./resources/functions/handler').InstanceHandler
    const ExistingInstance = InstanceHandler()
    if (ExistingInstance === true) {
        if (app.preferences.value('advanced.verboseLogging').includes(true)) console.warn('[Apple-Music-Electron][InstanceHandler] Existing Instance Found. Terminating.');
        app.quit()
        return;
    } else {
        if (app.preferences.value('advanced.verboseLogging').includes(true)) console.warn('[Apple-Music-Electron][InstanceHandler] No existing instances found.');
    }

    const {LinkHandler} = require('./resources/functions/handler')
    LinkHandler() // Handles Protocols

    const {CreateBrowserWindow} = require('./resources/functions/CreateBrowserWindow')
    app.win = CreateBrowserWindow() // Create the Browser Window

    app.funcs.LoadWebsite() // Load the Website

    const {SettingsHandler} = require('./resources/functions/handler')
    SettingsHandler() // Handles updates to settings

    const {WindowStateHandler} = require('./resources/functions/handler')
    WindowStateHandler() // Handling the Window

    const {PlaybackStateHandler} = require('./resources/functions/handler')
    PlaybackStateHandler() // IPCMain

    const {MediaStateHandler} = require('./resources/functions/handler')
    MediaStateHandler() // IPCMain

    app.funcs.SetThumbarButtons(null) // Set Inactive Thumbnail Toolbar Icons
    app.funcs.SetDockMenu() // Set the Dock for macOS
    // app.funcs.SetApplicationMenu() // Set the Menu for OS's that use it (Mainly macOS)
}

// When its Ready call it all
app.on('ready', () => {
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

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
});

app.on('activate', () => {
    if (app.win === null) {
        CreateWindow()
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
    process.exit(1)
})

app.on('before-quit', function () {
    app.funcs.mpris.clearActivity()
    app.funcs.discord.disconnect()
    console.log('---------------------------------------------------------------------')
    console.log('Application Closing...')
    console.log('---------------------------------------------------------------------')
    app.isQuiting = true;
    globalShortcut.unregisterAll()
});



