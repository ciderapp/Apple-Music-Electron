const {settingsmenuinit} = require("../settings/openmenu");
const {SetTaskList} = require('../win/SetTaskList')
const {InitializeTheme} = require('./Init-Theme')
const {InitializeTray} = require('./Init-Tray')
const {InitializeRPC} = require('../rpc/Init-DiscordRPC')
const {InitializeMpris} = require('../mpris/Init-Mpris')

exports.ApplicationReady = function () {
    console.log('[ApplicationReady] Started.')
    // Run the Functions
    settingsmenuinit()
    SetTaskList()
    InitializeTheme()
    InitializeTray()

    // Init (Other)
    InitializeMpris()
    InitializeRPC()
}