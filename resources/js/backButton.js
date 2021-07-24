try {

    if (!document.querySelector('#backButton')) {
        const backButtonStyle = `position: absolute; left: 0; float: left; border: 3px solid var(--searchBarBorderColor); background-color: rgba(60, 60, 67, 0.45); width: 20px`;

        document.getElementById('green').insertAdjacentHTML("afterend", `
            <div id="backButton" onclick="ipcRenderer.send('back');" style="${backButtonStyle}">
                <img src="https://beta.music.apple.com/assets/shelf/paddle-dark.svg" alt="nope">
            </div>
        `);
    }

    /* Keep this to remember the class and location for where we need to put it if we want it to look like mac
    if (!document.querySelector('#backButton')) {
      const backButtonStyle = `position: absolute; left: 0; float: left; border: 3px solid var(--searchBarBorderColor); background-color: rgba(60, 60, 67, 0.45); width: 20px`;

      document.getElementsByClassName('loading-inner')[0].insertAdjacentHTML("afterbegin", `
          <div id="backButton" onclick="ipcRenderer.send('back');" style="${backButtonStyle}">
              <p> < </p>
          </div>
      `);
  }*/


} catch (e) {
    console.error("[JS] Error while trying to apply backButton.js", e);
}