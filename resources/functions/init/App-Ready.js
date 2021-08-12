const {SetTaskList} = require('../win/SetTaskList')
const {InitializeTheme} = require('./Init-Theme')
const {InitializeTray} = require('./Init-Tray')
const {app} = require('electron')
const Sentry = require('@sentry/electron');
if (app.preferences.value('general.analyticsEnabled').includes(true)) {
    Sentry.init({ dsn: "https://20e1c34b19d54dfcb8231e3ef7975240@o954055.ingest.sentry.io/5903033" });
}

exports.ApplicationReady = function () {
    console.log('[ApplicationReady] Started.')
    // Run the Functions
    SetTaskList()
    InitializeTheme()
    InitializeTray()

    // Mpris
    app.mpris = {
        active: false,
        canQuit: true,
        canControl: true,
        canPause: true,
        canPlay: true,
        canGoNext: true,
        service: {}
    }
    app.mpris = require('../media/mpris')
    app.mpris.connect()

    // LastFM
    app.lastfm = {api: null, cachedAttributes: false}
    app.lastfm = require('../media/lastfm')
    app.lastfm.authenticate()

    // Discord
    app.discord = {client: null, rpc: {}, error: false, activityCache: null, connected: false};
    app.discord.rpc = require('../media/discordrpc')
    app.discord.rpc.connect('749317071145533440')
}