const {join} = require("path");
const {app, ipcMain} = require("electron");
const {Analytics} = require("./sentry");
const {readFile, constants, chmodSync} = require("fs");
const {GetLocale} = require("./GetLocale");
Analytics.init()

module.exports = {

    LoadCSS: function (path, theme) {
        if (theme) {
            path = join(app.userThemesPath, path.toLowerCase());
        } else {
            path = join(join(__dirname, '../css/'), path)
        }

        readFile(path, "utf-8", function (error, data) {
            if (error) {
                console.error(`[LoadCSS] Error while injecting: '${path}' - ${error}`)
                chmodSync(path, constants.S_IRUSR | constants.S_IWUSR);
            } else {
                let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
                app.win.webContents.insertCSS(formattedData).then(() => {
                    if (app.preferences.value('advanced.verboseLogging').includes(true)) {
                        if (theme) {
                            console.log(`[LoadTheme] '${path}' successfully injected.`)
                        } else {
                            console.log(`[LoadCSS] '${path}' successfully injected.`)
                        }
                    }
                });
            }
        });
    },

    LoadJS: function (path) {
        path = join(join(__dirname, '../../js/'), path)

        readFile(path, "utf-8", function (error, data) {
            if (!error) {
                try {
                    let formattedData = data.replace(/\s{2,10}/g, ' ').trim();
                    app.win.webContents.executeJavaScript(formattedData).then(() => {
                        if (app.preferences.value('advanced.verboseLogging').includes(true)) {
                            console.log(`[LoadJSFile] '${path}' successfully injected.`)
                        }
                    });
                } catch (err) {
                    console.error(`[LoadJSFile] Error while injecting: ${path} - Error: ${err}`)
                }
            } else {
                console.error(`[LoadJSFile] Error while reading: '${path}' - Error: ${error}`)
            }
        });
    },

    LoadWebsite: function () {
        const [region, language] = GetLocale()
        app.locale = [region, language]
        const urlBase = (app.preferences.value('advanced.useBetaSite').includes(true)) ? `https://beta.music.apple.com/${region}` : `https://music.apple.com/${region}`;
        const urlFallback = `https://music.apple.com/${region}?l=${language}`;
        const urlLanguage = `${urlBase}?l=${language}`;
        console.log(`[LoadWebsite] Attempting to load '${urlLanguage}'`)

        app.win.loadURL(urlLanguage).then(() => {
            if (app.preferences.value('general.startupPage') !== "browse") {
                app.funcs.LoadJS('CheckAuth.js')
                ipcMain.once('authorized', (e, args) => {
                    app.win.webContents.clearHistory()
                    console.log(`[LoadWebsite] User is authenticated. Loading '${app.preferences.value('general.startupPage')}'. (${args}).`)
                })
            } else {
                console.log(`[LoadWebsite] Loaded '${urlLanguage}'`)
            }

        }).catch((err) => {
            app.win.loadURL(urlFallback).then(() => console.error(`[LoadWebsite] '${urlLanguage}' was unavailable, falling back to '${urlFallback}' | ${err}`))
        })
    }
}