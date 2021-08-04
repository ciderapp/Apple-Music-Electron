const {app, ipcMain} = require('electron')
const {GetLocale} = require('../GetLocale')
const {LoadJS} = require('./LoadJS')
const {LoadFiles} = require('../InjectFiles')

exports.LoadWebsite = function () {
    const locale = GetLocale()
    const urlBase = (app.preferences.value('advanced.useBetaSite')) ? `https://beta.music.apple.com/${locale[0]}` : `https://music.apple.com/${locale[0]}`;
    const urlFallback = `https://music.apple.com/${locale[0]}?l=${locale[0]}`;
    const urlLanguage = `${urlBase}?l=${locale[0]}`;

    app.win.loadURL(urlLanguage).then(() => {
        if (app.preferences.value('advanced.listenNow').includes(true)) {
            LoadJS('CheckAuth.js')
            ipcMain.on('authorized', (e, args) => {
                console.log(args)
                LoadFiles()
                app.win.webContents.clearHistory()
                console.log(`[LoadWebsite] User is authenticated. Loading listen-now page (${args}).`)
            })
        } else {
            console.log(`[LoadWebsite] Loaded ${urlLanguage}`)
        }

    }).catch((err) => {
        app.win.loadURL(urlFallback).then(() => console.error(`[LoadWebsite] ${urlLanguage} was unavailable, falling back to ${urlFallback} | ${err}`))
    })
}