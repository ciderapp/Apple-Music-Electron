try {
    while (document.getElementsByClassName('web-navigation__native-upsell').length > 0) {
        document.getElementsByClassName('web-navigation__native-upsell')[0].remove();
    }
} catch (e) {
    console.error("[JS] Error while trying to apply removeUpsell.js", e);
}