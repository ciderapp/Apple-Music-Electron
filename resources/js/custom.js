try {
    if (!preferences) {
        var preferences = ipcRenderer.sendSync('getPreferences');
    }

    function GetXPath(path) {
        return document.evaluate(path, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
    }

    /* Remove the Region Banner */
    while (document.getElementsByClassName('locale-switcher-banner').length > 0) {
        document.getElementsByClassName('locale-switcher-banner')[0].remove()
    }

    /* Get the Button Path */
    let buttonPath;
    if (preferences.visual.frameType === 'mac-right') {
        buttonPath = '//*[@id="web-main"]/div[4]/div/div[3]/div[3]/button'
    } else {
        buttonPath = '//*[@id="web-main"]/div[3]/div/div[3]/div[3]/button'
    }

    /* Create the Settings / Discord buttons */
    if (GetXPath(buttonPath)) {
        GetXPath(buttonPath).addEventListener('click', function () {
            if (document.querySelector('.context-menu__option--app-settings')) {
                if (preferences.advanced.verboseLogging.includes(true)) console.log("[settingsInit] Preventing second button.");
                return;
            }

            const ul = GetXPath("/html/body/div[6]/ul");

            const amPreferencesNew = GetXPath('/html/body/div[6]/ul/li[2]');
            GetXPath('/html/body/div[6]/ul/li[2]/span/span').innerHTML = 'Preferences (New)';
            ul.insertBefore(amPreferencesNew, ul.childNodes[9]);

            /* GetXPath('/html/body/div[6]/ul/li[2]').remove(); */
            const amSettings = document.createElement("li");
            amSettings.innerHTML = `
                    <span class="context-menu__option-text" tabindex="0" role="menuitem">
                        <span class="context-menu__option-text-clamp">Account Settings</span>
                        <svg width="24" height="24" viewBox="0 0 24 24" stroke="#212b36" stroke-width="2" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" clip-rule="evenodd" xml:space="preserve" class="context-menu__option-icon">
                            <circle cx="12" cy="8" r="5" />
                            <path d="M3,21 h18 C 21,12 3,12 3,21"/>
                        </svg>
                    </span>
                `;
            amSettings.classList.add("context-menu__option--am-settings");
            amSettings.classList.add("context-menu__option");
            amSettings.onclick = function () {
                window.open(`https://music.apple.com/account/settings`)
            };
            ul.insertBefore(amSettings, ul.childNodes[8]);

            const amPreferences = document.createElement("li");
            amPreferences.innerHTML = `
                    <span class="context-menu__option-text" tabindex="0" role="menuitem">
                        <span class="context-menu__option-text-clamp">Preferences</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" clip-rule="evenodd" viewBox="0 0 16 16" xml:space="preserve" class="context-menu__option-icon">
                            <path fill-rule="nonzero" d="M31.475,57.622C32.114,57.622 32.702,57.571 33.34,57.52L34.77,60.228C35.077,60.891 35.766,61.249 36.558,61.12C37.298,60.994 37.809,60.43 37.912,59.665L38.346,56.651C39.546,56.32 40.696,55.885 41.845,55.4L44.066,57.392C44.629,57.928 45.369,58.031 46.085,57.648C46.749,57.263 47.005,56.575 46.877,55.809L46.238,52.82C47.26,52.115 48.218,51.321 49.098,50.445L51.883,51.62C52.597,51.928 53.313,51.748 53.849,51.11C54.334,50.548 54.411,49.806 53.977,49.143L52.367,46.537C53.079,45.524 53.695,44.446 54.207,43.318L57.247,43.472C58.012,43.498 58.677,43.089 58.907,42.349C59.163,41.658 58.933,40.876 58.345,40.432L55.945,38.543C56.249,37.393 56.505,36.143 56.606,34.866L59.468,33.946C60.234,33.716 60.694,33.128 60.694,32.362C60.694,31.571 60.234,31.008 59.468,30.752L56.606,29.834C56.505,28.557 56.249,27.357 55.945,26.157L58.318,24.265C58.932,23.806 59.162,23.091 58.906,22.375C58.676,21.66 58.012,21.226 57.245,21.252L54.206,21.38C53.645,20.23 53.083,19.183 52.368,18.135L53.977,15.555C54.387,14.965 54.334,14.17 53.849,13.64C53.312,12.977 52.597,12.825 51.883,13.105L49.098,14.254C48.198,13.4 47.242,12.606 46.237,11.878L46.877,8.915C47.005,8.149 46.723,7.434 46.085,7.077C45.369,6.692 44.629,6.769 44.066,7.332L41.846,9.298C40.702,8.821 39.535,8.404 38.348,8.048L37.914,5.058C37.834,4.32 37.267,3.722 36.534,3.603C35.768,3.5 35.078,3.833 34.772,4.471L33.342,7.178C32.703,7.154 32.115,7.102 31.477,7.102C30.838,7.102 30.251,7.154 29.612,7.178L28.182,4.471C27.849,3.832 27.186,3.501 26.394,3.603C25.654,3.731 25.144,4.293 25.04,5.058L24.606,8.048C23.406,8.405 22.231,8.814 21.108,9.298L18.885,7.332C18.298,6.769 17.583,6.694 16.842,7.077C16.203,7.434 15.949,8.149 16.075,8.942L16.714,11.878C15.709,12.606 14.753,13.4 13.852,14.254L11.069,13.104C10.329,12.824 9.639,12.977 9.077,13.64C8.618,14.179 8.566,14.96 8.949,15.555L10.559,18.135C9.875,19.17 9.269,20.255 8.746,21.38L5.68,21.252C4.941,21.219 4.264,21.677 4.02,22.375C3.79,23.091 3.995,23.806 4.608,24.266L6.982,26.154C6.7,27.354 6.445,28.554 6.343,29.831L3.457,30.751C2.717,30.981 2.282,31.569 2.282,32.36C2.282,33.126 2.717,33.714 3.457,33.945L6.343,34.889C6.445,36.14 6.675,37.392 6.982,38.542L4.606,40.43C4.022,40.877 3.785,41.65 4.018,42.347C4.253,43.052 4.938,43.515 5.68,43.47L8.745,43.316C9.28,44.466 9.868,45.539 10.557,46.534L8.947,49.141C8.551,49.751 8.604,50.554 9.077,51.107C9.64,51.745 10.329,51.924 11.069,51.617L13.828,50.442C14.722,51.312 15.688,52.107 16.714,52.817L16.075,55.807C15.948,56.573 16.203,57.262 16.868,57.645C17.583,58.028 18.298,57.925 18.86,57.415L21.106,55.397C22.231,55.882 23.406,56.317 24.606,56.648L25.04,59.664C25.143,60.428 25.654,60.991 26.394,61.144C27.186,61.247 27.849,60.888 28.182,60.225L29.612,57.517C30.251,57.568 30.838,57.619 31.477,57.619L31.475,57.621L31.475,57.622ZM38.168,30.345C36.891,27.049 34.337,25.262 31.322,25.262C30.762,25.261 30.205,25.33 29.662,25.466L22.766,13.64C25.492,12.368 28.466,11.714 31.474,11.724C42.254,11.724 50.732,19.822 51.729,30.344L38.168,30.344L38.168,30.345ZM11.145,32.362C11.145,25.543 14.286,19.515 19.242,15.762L26.188,27.637C24.834,29.145 24.222,30.752 24.222,32.438C24.222,34.074 24.809,35.58 26.188,37.138L19.063,48.835C14.209,45.055 11.145,39.105 11.145,32.362ZM28.283,32.412C28.283,30.702 29.738,29.374 31.373,29.374C33.085,29.374 34.489,30.702 34.489,32.412C34.481,34.114 33.076,35.509 31.374,35.505C29.738,35.505 28.282,34.125 28.282,32.412L28.283,32.412ZM31.475,53.025C28.257,53.025 25.218,52.285 22.562,50.982L29.637,39.386C30.377,39.565 30.887,39.616 31.322,39.616C34.362,39.616 36.915,37.776 38.168,34.405L51.729,34.405C50.732,44.903 42.252,53.025 31.475,53.025Z" transform="matrix(.27119 0 0 .27119 -.54 -.78)"></path>
                        </svg>
                    </span>
                `;

            amPreferences.classList.add("context-menu__option--app-settings");
            amPreferences.classList.add("context-menu__option");
            amPreferences.onclick = function () {
                ipcRenderer.send("showPreferences");
            };
            ul.insertBefore(amPreferences, ul.childNodes[9]);

            const amDiscord = document.createElement("li");
            amDiscord.innerHTML = `
                    <span class="context-menu__option-text" tabindex="0" role="menuitem">
                        <span class="context-menu__option-text-clamp">Discord</span>
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="20" fill-rule="evenodd" stroke-linejoin="round" stroke-miterlimit="2" clip-rule="evenodd" viewBox="0 0 28 20" xml:space="preserve" class="context-menu__option-icon">
                            <path d="M23.0212 1.67671C21.3107 0.879656 19.5079 0.318797 17.6584 0C17.4062 0.461742 17.1749 0.934541 16.9708 1.4184C15.003 1.12145 12.9974 1.12145 11.0283 1.4184C10.819 0.934541 10.589 0.461744 10.3368 0.00546311C8.48074 0.324393 6.67795 0.885118 4.96746 1.68231C1.56727 6.77853 0.649666 11.7538 1.11108 16.652C3.10102 18.1418 5.3262 19.2743 7.69177 20C8.22338 19.2743 8.69519 18.4993 9.09812 17.691C8.32996 17.3997 7.58522 17.0424 6.87684 16.6135C7.06531 16.4762 7.24726 16.3387 7.42403 16.1847C11.5911 18.1749 16.408 18.1749 20.5763 16.1847C20.7531 16.3332 20.9351 16.4762 21.1171 16.6135C20.41 17.0369 19.6639 17.3997 18.897 17.691C19.3052 18.4993 19.7718 19.2689 20.3021 19.9945C22.6677 19.2689 24.8929 18.1364 26.8828 16.6466H26.8893C27.43 10.9731 25.9665 6.04728 23.0212 1.67671ZM9.68041 13.6383C8.39754 13.6383 7.34085 12.4453 7.34085 10.994C7.34085 9.54272 8.37155 8.34973 9.68041 8.34973C10.9893 8.34973 12.0395 9.54272 12.0187 10.994C12.0187 12.4453 10.9828 13.6383 9.68041 13.6383ZM18.3161 13.6383C17.0332 13.6383 15.9765 12.4453 15.9765 10.994C15.9765 9.54272 17.0124 8.34973 18.3161 8.34973C19.6184 8.34973 20.6751 9.54272 20.6543 10.994C20.6543 12.4453 19.6184 13.6383 18.3161 13.6383Z"</path>
                        </svg>
                    </span>
                `;
            amDiscord.classList.add("context-menu__option--am-discord");
            amDiscord.classList.add("context-menu__option");
            amDiscord.onclick = function () {
                window.open(`https://discord.gg/CezHYdXHEM`)
            };
            ul.insertBefore(amDiscord, ul.childNodes[4]);
        });
    }

    /* Scroll Volume */
    if (document.querySelector('.web-chrome-playback-lcd__volume') && typeof volumeChange === 'undefined') {
        document.getElementsByClassName('web-chrome-playback-lcd__volume')[0].addEventListener('wheel', volumeChange);

        function volumeChange(event) {
            if (preferences.advanced.verboseLogging.includes(true)) console.log(event);
            if (checkScrollDirectionIsUp(event)) {
                if (MusicKit.getInstance().volume <= 1) {
                    if ((MusicKit.getInstance().volume + 0.05) > 1) {
                        MusicKit.getInstance().volume = 1
                    } else {
                        MusicKit.getInstance().volume = MusicKit.getInstance().volume + 0.05
                    }
                }
            } else {
                if (MusicKit.getInstance().volume >= 0) {
                    if ((MusicKit.getInstance().volume - 0.05) < 0) {
                        MusicKit.getInstance().volume = 0
                    } else {
                        MusicKit.getInstance().volume = MusicKit.getInstance().volume - 0.05
                    }
                }
            }
        }

        function checkScrollDirectionIsUp(event) {
            if (event.wheelDelta) {
                return event.wheelDelta > 0;
            }
            return event.deltaY < 0;
        }
    }

    /* Audio Quality Selector */
    if (preferences.audio.audioQuality === 'auto') {
        if (preferences.advanced.verboseLogging.includes(true)) console.log("[JS] AudioQuality set to auto, dynamically setting bitrate between 64 and 256.");
    } else if (preferences.audio.audioQuality === 'extreme') {
        if (preferences.advanced.verboseLogging.includes(true)) console.log("[JS] AudioQuality set to extreme, forcing bitrate to 990..");
        MusicKit.PlaybackBitrate = 990;
        MusicKit.getInstance().bitrate = 990;
    } else if (preferences.audio.audioQuality === 'high') {
        if (preferences.advanced.verboseLogging.includes(true)) console.log("[JS] AudioQuality set to high, forcing bitrate to 256.");
        MusicKit.PlaybackBitrate = 256;
        MusicKit.getInstance().bitrate = 256;
    } else if (preferences.audio.audioQuality === 'standard') {
        if (preferences.advanced.verboseLogging.includes(true)) console.log("[JS] AudioQuality set to standard, forcing bitrate to 64.");
        MusicKit.PlaybackBitrate = 64;
        MusicKit.getInstance().bitrate = 64;
    }

    /* Gapless Playback */
    if (preferences.audio.gaplessEnabled.includes(true)) {
        if (preferences.advanced.verboseLogging.includes(true)) console.log("[JS] Gapless Playback enabled, songs will now preload before ending reducing load times.");
        MusicKit.getInstance()._bag.features["enable-gapless"] = true;
    }

    /* Incognito Mode */
    if (preferences.general.incognitoMode.includes(true)) {
        MusicKit.privateEnabled = true
    }

    /* Contact Menu Creation (From PR #221 by @SiverDX) */
    function simulateClick(element, clientX, clientY) {
        let event = new MouseEvent('click', {
            clientX: clientX,
            clientY: clientY
        });

        element.dispatchEvent(event);
    }

    /* Check if the user is on the library song list or on playlist/album */
    let clickRegion;
    if (document.getElementsByClassName("songs-list-row").length === 0) {
        clickRegion = document.getElementsByClassName("library-track")
    } else {
        clickRegion = document.getElementsByClassName("songs-list-row")
    }

    /* Loop through each row/song and add event listener */
    for (let area of clickRegion) {
        area.addEventListener('contextmenu', function (event) {
            event.preventDefault();

            let control = area.getElementsByClassName("context-menu__overflow ")[0];

            if (control) {
                simulateClick(control, event.clientX, event.clientY);
            }
        });
    }

} catch (e) {
    console.error("[JS] Error while trying to apply custom.js", e);
}