const {app} = require('electron')
const languages = require('../languages.json')


exports.GetLocale = function () {
    console.log('[GetLocale] Started.')
    let Region, Language, foundKey;

    // Check the Language
    for (let key in languages) {
        if (languages.hasOwnProperty(key)) {
            key = key.toLowerCase()
            if (app.getLocaleCountryCode().toLowerCase() === key) {
                console.log(`[GetLocale] Found: ${key} | System Language: ${app.getLocaleCountryCode().toLowerCase()}`)
                foundKey = key
            }
        }
    }

    // Check if the Region is being forced
    if (!app.config.advanced.forceApplicationRegion) {
        Region = foundKey;
    } else {
        Region = app.config.advanced.forceApplicationRegion.toLowerCase();
    }
    console.log(`[GetLocale] Chosen Region: ${Region}`)

    // Check if the Language is being forced
    if (!app.config.advanced.forceApplicationLanguage) {
        Language = foundKey;
    } else {
        Language = app.config.advanced.forceApplicationLanguage.toLowerCase();
    }
    console.log(`[GetLocale] Chosen Language: ${Language}`)

    // Return it
    console.log(`[GetLocale] Outputting Locale.`)
    return [Region, Language]


}