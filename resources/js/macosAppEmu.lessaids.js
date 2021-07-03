try {

    if (document.getElementsByClassName('search-box dt-search-box web-navigation__search-box').length > 0) {
        document.getElementsByClassName('search-box dt-search-box web-navigation__search-box')[0].style.gridArea = "auto";


        document.getElementsByClassName('search-box dt-search-box web-navigation__search-box')[0].style.marginTop = '0px';
        document.getElementsByClassName('search-box dt-search-box web-navigation__search-box')[0].style.webkitAppRegion = 'no-drag'
    }


    if (document.getElementsByClassName('web-chrome').length > 0) {
        document.getElementsByClassName('web-chrome')[0].style.webkitAppRegion = 'drag'
    }

    if (!webNavigationSearchBox && (document.getElementById('web-navigation-search-box').length > 0)) {
        var webNavigationSearchBox = document.getElementById('web-navigation-search-box');
    }

    if (webNavigationSearchBox) {

        const dragDiv = document.createElement("div");
        dragDiv.style.webkitAppRegion = "drag";
        dragDiv.classList.add('dragDiv');
        dragDiv.ondblclick = () => {
            ipcRenderer.send("maximize")
        };

        webNavigationSearchBox.appendChild(dragDiv)

        const redStoplight = document.createElement("span");
        const yellowStoplight = document.createElement("span");
        const greenStoplight = document.createElement("span");

        redStoplight.style = 'height: 11px; width: 11px; background-color: rgb(255, 92, 92); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 4px 10px 10px; color: rgb(130, 0, 5); -webkit-app-region: no-drag;'
        yellowStoplight.style = 'height: 11px; width: 11px; background-color: rgb(255, 189, 76); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 4px; color: rgb(130, 0, 5); -webkit-app-region: no-drag;'
        greenStoplight.style = 'height: 11px; width: 11px; background-color: rgb(0, 202, 86); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 10px 10px 4px; color: rgb(130, 0, 5); -webkit-app-region: no-drag;'

        redStoplight.onclick = () => {
            ipcRenderer.send('close');
        }

        yellowStoplight.onclick = () => {
            ipcRenderer.send('minimize');
        }

        greenStoplight.onclick = () => {
            ipcRenderer.send('maximize');
        }

        dragDiv.appendChild(redStoplight)
        dragDiv.appendChild(yellowStoplight)
        dragDiv.appendChild(greenStoplight)

        redStoplight.onmouseenter = () => {
            redStoplight.style.filter = "brightness(50%)";
        };
        yellowStoplight.onmouseenter = () => {
            yellowStoplight.style.filter = "brightness(50%)";
        };
        greenStoplight.onmouseenter = () => {
            greenStoplight.style.filter = "brightness(50%)";
        };

        redStoplight.onmouseleave = () => {
            redStoplight.style.filter = "brightness(100%)";
        };
        yellowStoplight.onmouseleave = () => {
            yellowStoplight.style.filter = "brightness(100%)";
        };
        greenStoplight.onmouseleave = () => {
            greenStoplight.style.filter = "brightness(100%)";
        };
    }
} catch (e) {
    console.error("[CSS] Error while trying to apply macosAppEmu.js", e);
}