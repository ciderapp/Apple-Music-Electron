try {
    if (!webNavigationMacFrame) {
        var webNavigationMacFrame = document.getElementsByClassName("web-navigation")[0];
    }

    if (webNavigationMacFrame && !(webNavigationMacFrame.style.height === "calc(100vh - 32px)")) {

        const dragDiv = document.createElement("div");
        dragDiv.style.width = "100%";
        dragDiv.style.height = "32px";
        dragDiv.style.position = "absolute";
        dragDiv.style.top = "0";
        dragDiv.style.left = "0";
        dragDiv.style.zIndex = "15";
        dragDiv.style.webkitAppRegion = "drag";
        dragDiv.classList.add('dragDiv');
        dragDiv.ondblclick = () => {
            ipcRenderer.send("maximize")
        };

        document.body.appendChild(dragDiv);

        webNavigationMacFrame.style.height = "calc(100vh - 32px)";
        webNavigationMacFrame.style.width = "100%";
        webNavigationMacFrame.style.bottom = "0";
        webNavigationMacFrame.style.position = "absolute";
        webNavigationMacFrame.style.zIndex = "10";

        document.head.insertAdjacentHTML("beforeend", "<style>.web-chrome { top: 32px !important; }</style>");
        document.head.insertAdjacentHTML("beforeend", "<style>.no-song-loaded.not-authenticated .web-navigation { height: calc(100vh - 32px); margin-top: 32px; }</style>");

        const closeButton = document.createElement("span");
        const minimizeButton = document.createElement("span");
        const maximizeButton = document.createElement("span");

        closeButton.style = "height: 11px; width: 11px; background-color: rgb(255, 92, 92); border-radius: 50%; display: inline-block; float: right; top: 0px; margin: 10px 10px 10px 4px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5); -webkit-app-region: no-drag; ";
        minimizeButton.style = "height: 11px; width: 11px; background-color: rgb(255, 189, 76); border-radius: 50%; display: inline-block; float: right; top: 0px; margin: 10px 4px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5); -webkit-app-region: no-drag;";
        maximizeButton.style = "height: 11px; width: 11px; background-color: rgb(0, 202, 86); border-radius: 50%; display: inline-block; float: right; top: 0px; margin: 10px 4px 10px 10px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5); -webkit-app-region: no-drag;";

        closeButton.onclick = () => {
            ipcRenderer.send("close")
        };
        minimizeButton.onclick = () => {
            ipcRenderer.send("maximize")
        };
        maximizeButton.onclick = () => {
            ipcRenderer.send("minimize")
        };

        dragDiv.appendChild(closeButton);
        dragDiv.appendChild(minimizeButton);
        dragDiv.appendChild(maximizeButton);

        closeButton.onmouseenter = () => {
            closeButton.style.filter = "brightness(50%)";
        };
        minimizeButton.onmouseenter = () => {
            minimizeButton.style.filter = "brightness(50%)";
        };
        maximizeButton.onmouseenter = () => {
            maximizeButton.style.filter = "brightness(50%)";
        };

        closeButton.onmouseleave = () => {
            closeButton.style.filter = "brightness(100%)";
        };
        minimizeButton.onmouseleave = () => {
            minimizeButton.style.filter = "brightness(100%)";
        };
        maximizeButton.onmouseleave = () => {
            maximizeButton.style.filter = "brightness(100%)";
        };
    }
} catch (e) {
    console.error("caught exception applying custom MacOS Window Frame", e);
}