try {
    if (MusicKit.getInstance().authorizationStatus === 3) {

        var str = window.location.href;
        var n = str.lastIndexOf("?");
        var listenNow = str.substring(0,n)+"/listen-now"+str.substring(n);

        window.location.href = listenNow;
        ipcRenderer.send('authorized', listenNow);
    }
} catch (e) {
    console.error("[JS] Error while trying to apply CheckAuth.js", e);
}