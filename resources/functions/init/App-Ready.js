const {SetTaskList} = require('../win/SetTaskList')
const {InitializeTheme} = require('./Init-Theme')
const {InitializeTray} = require('./Init-Tray')
const {InitializeRPC} = require('../rpc/Init-DiscordRPC')
const {InitializeMpris} = require('../mpris/Init-Mpris')
const {lfmauthenticate} = require("../lastfm/authenticate");


exports.ApplicationReady = function () {
    console.log('[ApplicationReady] Started.')
    // Run the Functions
    SetTaskList()
    InitializeTheme()
    InitializeTray()

    // Init (Other)
    InitializeMpris()
    InitializeRPC()
    lfmauthenticate()
}