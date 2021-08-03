const {app} = require('electron')
const {GetLocale} = require('../GetLocale')

exports.LoadWebsite = function () {
    const locale = GetLocale()
    const urlExtension = `${locale[0]}?l=${locale[1]}`
    const url = (app.preferences.value('advanced.useBetaSite')) ? `https://beta.music.apple.com/${urlExtension}` : `https://music.apple.com/${urlExtension}`;
    const fallback = `https://music.apple.com/${urlExtension}`
    app.win.loadURL(url)
    console.log(`[LoadWebsite] The chosen website is ${url}`)
    app.win.loadURL(url).catch(() => {
        app.win.loadURL(fallback).then(() => console.error(`[LoadWebsite] ${url} was unavailable, falling back to ${fallback}`))
    })
}