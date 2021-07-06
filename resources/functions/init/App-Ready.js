const {SetTaskList} = require('../win/SetTaskList')
const {InitializeTheme} = require('./Init-Theme')
const {InitializeTray} = require('./Init-Tray')
const {InitializeRPC} = require('../rpc/Init-DiscordRPC')
const {InitializeMpris} = require('../mpris/Init-Mpris')
const {app} = require('electron')
if (app.config.lastfm.enabled) {
    var {lfmauthenticate} = require("../lastfm/authenticate");
}

exports.ApplicationReady = function () {
    console.log('[ApplicationReady] Started.')
    // Run the Functions
    SetTaskList()
    InitializeTheme()
    InitializeTray()

    // Init (Other)
    InitializeMpris()
    InitializeRPC()
    if (app.config.lastfm.enabled) {
        lfmauthenticate()
    }
}