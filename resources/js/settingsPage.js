try {
    function matchRuleShort(str, rule) {
        var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
        return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
    };

    if (matchRuleShort(window.location.href, '*account/settings*')) {
        document.getElementsByClassName('loading-inner commerce-iframe-wrapper')[0].innerHTML = `
            <div class="application-preferences">
                <div class="app-prefs-section app-prefs-general">
                    <span class="app-prefs-title">General Settings</span>
                    <ul class="settings-list">
                    <li class="app-prefs-togg">
                        <span>Toggle Slider</span>
                        <label class="switch">
                            <input type="checkbox" checked>
                            <span class="slider round"></span>
                        </label>
                    </li>
                    <li class="app-prefs-dropdown">List Elements</li>
                    </ul>
                </div>
            </div>
        `
        /*Here we create the settings menu and add onclicks for all elements and use electron-store*/
    }
} catch (e) {
    console.error("[JS] Error while trying to apply settingsPage.js", e);
}