try {
    while (document.getElementsByClassName('web-navigation__header web-navigation__header--logo').length > 0) {
        document.getElementsByClassName('web-navigation__header web-navigation__header--logo')[0].remove();
    }

    if (document.getElementsByClassName('search-box dt-search-box web-navigation__search-box').length > 0) {
        document.getElementsByClassName('search-box dt-search-box web-navigation__search-box')[0].style.gridArea = "auto";
        document.getElementsByClassName('search-box dt-search-box web-navigation__search-box')[0].style.marginTop = '7px';
    }
} catch (e) {
    console.error("[CSS] Error while trying to apply removeAppleLogo.js", e);
}
