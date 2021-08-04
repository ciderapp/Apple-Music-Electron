try {

    if (!document.querySelector('#backButton')) {
        const backButtonStyle = `
        position: absolute; 
        left: calc(var(--web-navigation-width) + 20px); 
        top: 70px;
        width: 35px;
        height: 30px;
        cursor: pointer; 
        z-index: 10000; 
        background-color: var(--sidebar); 
        padding: 5px 10px 5px 10px;
        border-radius: 5px;`;

        const backButtonImageStyle = `
        display: block;
        width: 100%;
        height: 100%;
        `;

        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.getElementById('web-main').insertAdjacentHTML("afterbegin", `
            <div id="backButton" onclick="ipcRenderer.send('back');" style="${backButtonStyle}">
                <img src="https://beta.music.apple.com/assets/shelf/paddle-dark.svg" alt="Back Button" style="${backButtonImageStyle}">
            </div>
        `);
        } else {
            document.getElementById('web-main').insertAdjacentHTML("afterbegin", `
            <div id="backButton" onclick="ipcRenderer.send('back');" style="${backButtonStyle}">
                <img src="https://beta.music.apple.com/assets/shelf/paddle-default.svg" alt="Back Button" style="${backButtonImageStyle}">
            </div>
        `);
        }

    }

} catch (e) {
    console.error("[JS] Error while trying to apply backButton.js", e);
}