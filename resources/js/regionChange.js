try {
    while (document.getElementsByClassName('locale-switcher-banner').length > 0) {
        document.getElementsByClassName('locale-switcher-banner')[0].remove()
    }
} catch (e) {
    console.error("[JS] Error while trying to apply regionChange.js", e);
}