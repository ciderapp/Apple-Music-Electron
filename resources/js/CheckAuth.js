try {
    if (MusicKit.getInstance().authorizationStatus === 3) {
        window.location.href = "/listen-now";
        ipcRenderer.send('authorized');
    }
} catch (e) {
    console.error("[JS] Error while trying to apply CheckAuth.js", e);
}