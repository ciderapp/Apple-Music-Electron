try {
    function matchRuleShort(str, rule) {
        var escapeRegex = (str) => str.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
        return new RegExp("^" + rule.split("*").map(escapeRegex).join(".*") + "$").test(str);
    }
    if (typeof preferences == "undefined") {
        var preferences = ipcRenderer.sendSync('getPreferences');
    }

    if (!storedInnerHTML) {
        var storedInnerHTML = document.getElementsByClassName('dt-footer')[0].innerHTML;
    }

    if (matchRuleShort(window.location.href, '*settings*') && document.getElementsByClassName('application-preferences').length === 0) {
        AMJavaScript.getRequest("ameres://html/preferences-main.html", (content)=>{
            document.getElementsByClassName('commerce-full-content')[0].innerHTML = content;

            if (document.querySelector('footer')) {
                document.querySelector('.dt-footer').style.display = "block";
                document.querySelector('.dt-footer').classList.add('app-prefs-credits');
                AMJavaScript.getRequest("ameres://html/preferences-footer.html", (content)=>{
                    document.querySelector('.dt-footer').innerHTML = content;
                })
            }
    
            AMSettings.themes.updateThemesListing(AM.themesListing);
    
            if (AM.acrylicSupported) {
                document.getElementById('transparencyEffect').innerHTML = document.getElementById('transparencyEffect').innerHTML + "\n<option value='acrylic'>Acrylic (W10 1809+)</option>";
            } else {
                document.getElementById('transparencyDisableBlurToggleLI').remove();
            }
    
            /* General Settings */
            AMSettings.HandleField('language');
            AMSettings.HandleField('incognitoMode');
            AMSettings.HandleField('playbackNotifications');
            AMSettings.HandleField('trayTooltipSongName');
            AMSettings.HandleField('startupPage');
            AMSettings.HandleField('analyticsEnabled');
            AMSettings.HandleField('discordRPC');
            AMSettings.HandleField('discordClearActivityOnPause');
            AMSettings.HandleField('lfmConnect');
            AMSettings.HandleField('lastfmRemoveFeaturingArtists');
    
            /* Visual Settings */
            AMSettings.HandleField('theme');
            AMSettings.HandleField('frameType');
            AMSettings.HandleField('transparencyEffect');
            AMSettings.HandleField('transparencyTheme');
            AMSettings.HandleField('transparencyDisableBlur');
            AMSettings.HandleField('transparencyMaximumRefreshRate');
            AMSettings.HandleField('streamerMode');
            AMSettings.HandleField('removeUpsell');
            AMSettings.HandleField('removeAppleLogo');
            AMSettings.HandleField('removeFooter');
            AMSettings.HandleField('useOperatingSystemAccent');
            AMSettings.HandleField('mxmon');
            AMSettings.HandleField('mxmlanguage');
    
            /* Audio Settings */
            AMSettings.HandleField('audioQuality');
            AMSettings.HandleField('gaplessEnabled');
    
            /* Window Settings */
            AMSettings.HandleField('appStartupBehavior');
            AMSettings.HandleField('closeButtonMinimize');
    
            /* Advanced Settings */
            AMSettings.HandleField('forceApplicationRegion');
            AMSettings.HandleField('verboseLogging');
            AMSettings.HandleField('alwaysOnTop');
            AMSettings.HandleField('autoUpdaterBetaBuilds');
            AMSettings.HandleField('useBetaSite');
            AMSettings.HandleField('preventMediaKeyHijacking');
            AMSettings.HandleField('menuBarVisible');
            AMSettings.HandleField('removeScrollbars');
            AMSettings.HandleField('devTools');
            AMSettings.HandleField('devToolsOpenDetached');
            AMSettings.HandleField('allowMultipleInstances');
            AMSettings.HandleField('allowOldMenuAccess');
        })


    } else {
        document.getElementsByClassName('dt-footer')[0].innerHTML = storedInnerHTML; /* Revert the footer */
    }

} catch (e) {
    console.error("[JS] Error while trying to apply settingsPage.js", e);
}