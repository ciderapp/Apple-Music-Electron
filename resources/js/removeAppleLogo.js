try {
    while (document.getElementsByClassName('web-navigation__header web-navigation__header--logo').length > 0) {
        document.getElementsByClassName('web-navigation__header web-navigation__header--logo')[0].remove();
    }

} catch (e) {
    console.error("[JS] Error while trying to apply removeAppleLogo.js", e);
}