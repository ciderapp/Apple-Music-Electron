const {CreateBrowserWindow} = require('./functions/CreateBrowserWindow')
const {InstanceHandler} = require('./functions/handler/InstanceHandler')
const {LoadWebsite} = require('./functions/LoadWebsite')
const {LoadJavascript} = require('./functions/LoadJavascript')
const {WindowStateHandler} = require('./functions/handler/WindowStateHandler')
const {playbackStateDidChange} = require('./functions/handler/PlaybackStateHandler')
const {mediaItemStateDidChange} = require('./functions/handler/MediaStateHandler')

exports.CreateWindow = function () {
    if (InstanceHandler) return;

    CreateBrowserWindow() // Create the Browser Window

    LoadWebsite() // Load the Website

    LoadJavascript() // Load the Website Javascript

    WindowStateHandler() // Handling the Window

    playbackStateDidChange() // IPCMain

    mediaItemStateDidChange() // IPCMain
}