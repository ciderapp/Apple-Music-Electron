const {app} = require('electron')
const languages = require('../languages.json')
const {Analytics} = require("./analytics/sentry");
Analytics.init()


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
    if (!app.preferences.value('advanced.forceApplicationRegion')) {
        Region = foundKey;
        app.preferences.value('advanced.forceApplicationRegion', foundKey);
    } else {
        Region = app.preferences.value('advanced.forceApplicationRegion');
    }
    console.log(`[GetLocale] Chosen Region: ${Region}`);

    // Check if the Language is being forced
    if (!app.preferences.value('general.language')) {
        Language = foundKey;
        app.preferences.value('general.language', foundKey);
    } else {
        Language = app.preferences.value('general.language');
    }
    console.log(`[GetLocale] Chosen Language: ${Language}`);

    // Return it
    console.log(`[GetLocale] Outputting Locale.`)
    return [Region, Language]


}