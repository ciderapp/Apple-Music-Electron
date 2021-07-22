try {

    if (!webNavigationMacFrame) {
        var webNavigationMacFrame = document.getElementsByClassName("web-navigation")[0];
    }

    if (webNavigationMacFrame && !(webNavigationMacFrame.style.height === "calc(100vh - 32px)")) {
        webNavigationMacFrame.style.height = "calc(100vh - 32px)";
        webNavigationMacFrame.style.width = "100%";
        webNavigationMacFrame.style.bottom = "0";
        webNavigationMacFrame.style.position = "absolute";
        webNavigationMacFrame.style.zIndex = "10";

        document.head.insertAdjacentHTML("beforeend", "<style>.web-chrome { top: 32px !important; }</style>");
        document.head.insertAdjacentHTML("beforeend", "<style>.no-song-loaded.not-authenticated .web-navigation { height: calc(100vh - 32px); margin-top: 32px; }</style>");

        document.head.insertAdjacentHTML("beforeend", "<style>.web-chrome { top: 32px; }</style>");

        document.body.insertAdjacentHTML("afterbegin", `
                <header id="titlebar">
                  <div id="drag-region"></div>
                </header>
            `);
    }

} catch (e) {
    console.error("[JS] Error while trying to apply uwpWindowFrame.js", e);
}