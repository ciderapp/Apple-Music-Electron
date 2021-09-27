try {
    function matchRuleShort(str, rule) {
        var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
        return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
    };

    if (matchRuleShort(window.location.href, '*account/settings*')) {
        document.getElementsByClassName('loading-inner commerce-iframe-wrapper')[0].innerHTML = ''
        /*Here we create the settings menu and add onclicks for all elements and use electron-store*/
    }
} catch (e) {
    console.error("[JS] Error while trying to apply settingsPage.js", e);
}