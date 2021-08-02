try {

    if (!document.querySelector('#backButton')) {
        const backButtonStyle = `position: absolute; left: 0; float: left; background-color: rgb(0 0 0 / 0%); width: 9px; margin: 15px 0px 0px calc(var(--web-navigation-width) + 15px); cursor: pointer; z-index: 1000;`;

        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.getElementById('web-main').insertAdjacentHTML("afterbegin", `
            <div id="backButton" onclick="ipcRenderer.send('back');" style="${backButtonStyle}">
                <img src="https://beta.music.apple.com/assets/shelf/paddle-dark.svg" alt="nope">
            </div>
        `);
        } else {
            document.getElementById('web-main').insertAdjacentHTML("afterbegin", `
            <div id="backButton" onclick="ipcRenderer.send('back');" style="${backButtonStyle}">
                <img src="https://beta.music.apple.com/assets/shelf/paddle-default.svg" alt="nope">
            </div>
        `);
        }

    }

} catch (e) {
    console.error("[JS] Error while trying to apply backButton.js", e);
}