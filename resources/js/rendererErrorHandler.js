try {
    /* Login Error */
    if (document.getElementsByClassName('idms-login__error-message').length > 0) {
        if (MusicKit.getInstance().isAuthorized) {
            MusicKit.getInstance().unauthorize()
        }
        MusicKit.getInstance().authorize() /* Doubt this will work but eh */
    }

    /* Fetch Error */
    if (document.querySelector('.classname')) {
        //    do stuff
    }


} catch (e) {
    console.error("[CSS] Error while trying to apply rendererErrorHandler.js", e);
}