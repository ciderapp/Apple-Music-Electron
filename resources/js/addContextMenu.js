try {
    let simulateClick = function (element, clientX, clientY) {
        let event = new MouseEvent('click', {
            clientX: clientX,
            clientY: clientY
        });

        element.dispatchEvent(event);
    };

    let songControlls = document.getElementsByClassName("songs-list-row");

    if (songControlls.length === 0) {
        songControlls = document.getElementsByClassName("library-track");
    }

    for (let songControll of songControlls) {
        songControll.addEventListener('contextmenu', function (event) {
            event.preventDefault();

            let controll = songControll.getElementsByClassName("context-menu__overflow ")[0];

            if (controll) {
                simulateClick(controll, event.clientX, event.clientY);
            }
        });
    }
} catch (e) {
    console.error("[JS] Error while trying to apply addContextMenu.js", e);
}