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

        document.body.insertAdjacentHTML("afterbegin", `
            <header id="titleBar">
                <div id="dragDiv">
                    <div class="titleBarBtns">
                        <button id="minimizeBtn" class="topBtn minimizeBtn" title="Minimize" onclick="ipcRenderer.send('minimize');"></button>
                        <button id="maxResBtn" class="topBtn maximizeBtn" title="Maximize" onclick="maximizeRestore()"></button>
                        <button id="closeBtn" class="topBtn closeBtn" title="Close"></button>
                    </div>
                </div>
            </header>
            `);
    }

    document.getElementById('closeBtn').addEventListener('click', () => {
        ipcRenderer.send('closeApp');
    });

} catch (e) {
    console.error("[JS] Error while trying to apply uwpWindowFrame.js", e);
}