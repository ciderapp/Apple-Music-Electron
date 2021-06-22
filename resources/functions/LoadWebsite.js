const {app} = require('electron')
const {GetLocale} = require('./GetLocale')

exports.LoadWebsite = function () {


    let locale = GetLocale()
    let url = (app.config.advanced.useBeta) ? `https://beta.music.apple.com/${locale}?l=${locale}` : `https://music.apple.com/${locale}?l=${locale}`;
    let fallback = `https://music.apple.com/${locale}?l=${locale}`

    console.log(`[Apple-Music-Electron] The chosen website is ${url}`)
    app.win.loadURL(url).catch(() => {
        app.win.loadURL(fallback).then(() => console.log(`[Apple-Music-Electron] ${url} was unavailable, falling back to ${fallback}`))
    })


}