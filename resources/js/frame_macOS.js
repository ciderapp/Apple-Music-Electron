try {
    if (document.getElementById('web-navigation-search-box') && !document.querySelector('.web-nav-window-controls')) {

        document.getElementById('web-navigation-search-box').insertAdjacentHTML('beforebegin', `
        <div class="web-nav-window-controls-outer" style="width: 100%; height: 55px; -webkit-app-region: no-drag; background-color: transparent !important; -webkit-user-select: none; padding-left: 3px; padding-top: 3px">
            <div class="web-nav-window-controls" style="width: 100%; height: 100%; -webkit-app-region: drag;">
                <span id="close" onclick="ipcRenderer.send('close')"></span>
                <span id="minimize" onclick="ipcRenderer.send('minimize')"></span>
                <span id="maximize" onclick="ipcRenderer.send('maximize')"></span>
            </div>
        </div>
        `);

        if (document.getElementById('web-navigation-search-box')) {
            document.getElementById('web-navigation-search-box').style.gridArea = "auto !important";
            document.getElementById('web-navigation-search-box').style.marginTop = '0px !important';
        }

        if (document.getElementById('web-navigation-container')) {
            document.getElementById('web-navigation-container').style.gridTemplateRows = '55px auto 1fr auto !important'
        }

    }
} catch (e) {
    console.error("[JS] Error while trying to apply frame_macOS.js", e);
}