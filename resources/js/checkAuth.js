try {
    const preferences = ipcRenderer.sendSync('getPreferences');

    if (MusicKit.getInstance().isAuthorized) {
        let url = window.location.href;
        console.log(url);

        if (preferences.general.startupPage !== "browse") {
            if (preferences.general.startupPage.includes('library/')) {
                url = `${window.location.origin}/${preferences.general.startupPage}?${url.split('?')[1]}`;
            } else {
                url = `${window.location.origin}/${MusicKit.getInstance().storefrontId}/${preferences.general.startupPage}?${url.split('?')[1]}`;
            }
            window.location.href = url;
            ipcRenderer.send('userAuthorized', url);
        } else {
            ipcRenderer.send('userAuthorized', url);
        }
    }
} catch (e) {
    console.error("[JS] Error while trying to apply CheckAuth.js", e);
}