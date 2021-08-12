try {

    if (!document.querySelector('#backButtonBar')) {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            document.getElementById('web-main').insertAdjacentHTML("afterbegin", `
            <div id="backButtonBar">
                <div class="button-area" onclick="ipcRenderer.send('back');">
                    <img src="https://developer.apple.com/design/human-interface-guidelines/macos/images/icons/system-images/control/chevron-backward.png" alt="Back Button">
                </div>
            </div>
        `);
        }
    }


    document.getElementById('web-main').addEventListener('scroll', function () {
        if (document.getElementById('web-main').scrollTop > 80) {
            document.getElementById('backButtonBar').style.backgroundColor = 'var(--playerBackground)';
            document.getElementById('backButtonBar').style.position = 'fixed';
        } else {
            document.getElementById('backButtonBar').style.backgroundColor = 'transparent';
            document.getElementById('backButtonBar').style.position = 'absolute';
        }
    });


} catch (e) {
    console.error("[JS] Error while trying to apply backButton.js", e);
}