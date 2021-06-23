const {app} = require('electron')
const languages = require('../languages.json')


exports.GetLocale = function () {
    console.log('[GetLocale] Started.')

    const targetLocaleAs = app.config.advanced.forceApplicationLanguage;
    let localeAs = app.getLocaleCountryCode().toLowerCase()
    if (targetLocaleAs) {
        for (let key in languages) {
            if (languages.hasOwnProperty(key)) {
                key = key.toLowerCase()
                if (targetLocaleAs.toLowerCase() === key) {
                    console.log(`[Language] Found: ${key} | System Language: ${localeAs}`)
                    localeAs = key;
                }
            }
        }
    }
    return localeAs


}