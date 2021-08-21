const {SetTaskList} = require('../win/SetTaskList')
const {InitializeTheme} = require('./Init-Theme')
const {InitializeTray} = require('./Init-Tray')
const {app} = require('electron')
const {Analytics} = require("../analytics/sentry");
Analytics.init()

exports.ApplicationReady = function () {
    console.log('[ApplicationReady] Started.')
    // Run the Functions
    SetTaskList()
    InitializeTheme()
    InitializeTray()

    // Startup
    if (app.preferences.value('window.appStartupBehavior').includes('hidden')) {
        app.setLoginItemSettings({
            openAtLogin: true,
            args: [
                '--process-start-args', `"--hidden"`
            ]
        })
    } else if (app.preferences.value('window.appStartupBehavior').includes('minimized')) {
        app.setLoginItemSettings({
            openAtLogin: true,
            args: [
                '--process-start-args', `"--minimized"`
            ]
        })
    } else if (app.preferences.value('window.appStartupBehavior').includes('true')) {
        app.setLoginItemSettings({
            openAtLogin: true,
            args: []
        })
    } else {
        app.setLoginItemSettings({
            openAtLogin: false,
            args: []
        })
    }


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