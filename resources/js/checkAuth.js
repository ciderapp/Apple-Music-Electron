try {
    if (MusicKit.getInstance().isAuthorized) {

        let urlToLoad = window.location.href;
        const preferences = ipcRenderer.sendSync('getPreferences');

        urlToLoad = `${(preferences.advanced.useBetaSite.includes(true)) ? `https://beta.music.apple.com` : `https://music.apple.com`}/${preferences.general.startupPage}?${urlToLoad.split('?')[1]}`;

        /*if (preferences.general.startupPage.includes('library/'))
            urlToLoad = `${(preferences.advanced.useBetaSite.includes(true)) ? `https://beta.music.apple.com` : `https://music.apple.com`}/${preferences.general.startupPage}?${urlToLoad.split('?')[1]}`;
        else {
            if (window.location.href.includes())
            urlToLoad = urlToLoad.substring(0, urlToLoad.lastIndexOf("?")) + `/${preferences.general.startupPage}` + urlToLoad.substring(urlToLoad.lastIndexOf("?"));
        }*/

        window.location.href = urlToLoad;
        ipcRenderer.send('authorized', urlToLoad);
    }
} catch (e) {
    console.error("[JS] Error while trying to apply CheckAuth.js", e);
}