/* 
 *
 * Merges removeUpsell & removeAppleLogo, and creates stoplights on top left like the [macOS Apple Music app](https://support.apple.com/library/content/dam/edam/applecare/images/en_US/macos/Catalina/macos-catalina-apple-music-itunes-store.jpg)
 *
 */
try {


    /* Remove Apple */
    while (document.getElementsByClassName('web-navigation__header web-navigation__header--logo').length > 0) {
        document.getElementsByClassName('web-navigation__header web-navigation__header--logo')[0].remove();
    }

    /* Remove Upsell */
    while (document.getElementsByClassName('web-navigation__native-upsell').length > 0) {
        document.getElementsByClassName('web-navigation__native-upsell')[0].remove();
    }

    /* Make Searchbar area same color */
    if (document.getElementsByClassName('search-box dt-search-box web-navigation__search-box').length > 0) {
        document.getElementsByClassName('search-box dt-search-box web-navigation__search-box')[0].style.gridArea = "auto";

        /* Up you go! */
        document.getElementsByClassName('search-box dt-search-box web-navigation__search-box')[0].style.marginTop = '0px';
        /* document.getElementsByClassName('search-box dt-search-box web-navigation__search-box')[0].style.backgroundColor = 'var(--playerBackground)'; */
    }


    if (document.getElementById('web-navigation-search-box').length > 0 && !document.querySelector('.dragDiv')) {

        /*
        * Stoplights
        * Change values to customize look and/or behaviour
        */

        /* Red - Close */
        const redStoplightStyle = 'height: 11px; width: 11px; background-color: rgb(255, 92, 92); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 4px 10px 10px; color: rgb(130, 0, 5); -webkit-app-region: no-drag;';
        const redStoplightOnClick = "ipcRenderer.send('close');";

        /* Yellow - Minimize */
        const yellowStoplightStyle = 'height: 11px; width: 11px; background-color: rgb(255, 189, 76); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 4px; color: rgb(130, 0, 5); -webkit-app-region: no-drag;';
        const yellowStoplightOnClick = "ipcRenderer.send('minimize');";

        /* Green - Maximize */
        const greenStoplightStyle = 'height: 11px; width: 11px; background-color: rgb(0, 202, 86); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 10px 10px 4px; color: rgb(130, 0, 5); -webkit-app-region: no-drag;';
        const greenStoplightOnClick = "ipcRenderer.send('maximize');";

        /* Dim the Button Function */
        function dimButton(id) {
            document.getElementById(id).style.filter = "brightness(40%)";
        }

        /* Brighten the Button Function */
        function brightenButton(id) {
            document.getElementById(id).style.filter = "brightness(100%)";
        }

        /* Add the Stoplights! */
        document.getElementById('web-navigation-search-box').insertAdjacentHTML('beforebegin', `
                <div class="dragDiv" style="-webkit-app-region: drag, background-color: var(--sidebar);">
                <span id="red" onmouseover="dimButton('red')" onmouseleave="brightenButton('red')" onclick="${redStoplightOnClick}" style="${redStoplightStyle}"></span>
                <span id="yellow" onmouseover="dimButton('yellow')" onmouseleave="brightenButton('yellow')" onclick="${yellowStoplightOnClick}" style="${yellowStoplightStyle}"></span>
                <span id="green" onmouseover="dimButton('green')" onmouseleave="brightenButton('green')" onclick="${greenStoplightOnClick}" style="${greenStoplightStyle}"></span>
                </div>`)

    }
} catch (e) {
    console.error("[CSS] Error while trying to apply emulateMacOS.js", e);
}
