try {

    if (!document.querySelector('#backButton')) {
        const backButtonStyle = `background-color: rgb(0 0 0 / 0%); width: 9px; margin: -43px 8px 8px 228px; -webkit-app-region: no-drag;`;

        document.getElementsByClassName('loading-inner')[0].insertAdjacentHTML("afterbegin", `
            <div id="backButton" onclick="ipcRenderer.send('back');" style="${backButtonStyle}">
                <img src="https://beta.music.apple.com/assets/shelf/paddle-dark.svg" alt="nope">
            </div>
        `);
    }

} catch (e) {
    console.error("[JS] Error while trying to apply backButton.js", e);
}