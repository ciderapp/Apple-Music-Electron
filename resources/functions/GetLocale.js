const {app} = require('electron')
const languages = require('../languages.json')
const targetLocaleAs = app.config.advanced.forceApplicationLanguage.toLowerCase();

exports.GetLocale = function () {


    let localeAs = app.getLocaleCountryCode().toLowerCase()
    if (targetLocaleAs) {
        for (let key in languages) {
            if (languages.hasOwnProperty(key)) {
                key = key.toLowerCase()
                if (targetLocaleAs === key) {
                    console.log(`[Language] Found: ${key} | System Language: ${SystemLang}`)
                    localeAs = key;
                }
            }
        }
    }
    return localeAs


}