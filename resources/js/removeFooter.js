try {
    while (document.getElementsByTagName('footer').length > 0) {
        document.getElementsByTagName('footer')[0].remove();
    }
} catch (e) {
    console.error("[JS] Error while trying to apply removeFooter.js", e);
}