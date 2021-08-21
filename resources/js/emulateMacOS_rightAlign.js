/* 
 *
 * Merges removeUpsell & removeAppleLogo, and creates stoplights on top left like the [macOS Apple Music app](https://support.apple.com/library/content/dam/edam/applecare/images/en_US/macos/Catalina/macos-catalina-apple-music-itunes-store.jpg)
 *
 */
try {
    if (document.getElementsByClassName('web-chrome').length > 0 && !document.querySelector('.dragDiv')) {

        /*
        * Stoplights
        * Change values to customize look and/or behaviour
        */

        /* Red - Close */
        const redStoplightStyle = "height: 11px; width: 11px; background-color: rgb(255, 92, 92); border-radius: 50%; display: inline-block; float: right; top: 0px; margin: 10px 10px 10px 4px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5); -webkit-app-region: no-drag; ";
        const redStoplightOnClick = "ipcRenderer.send('close');";

        /* Green - Maximize */
        const greenStoplightStyle = "height: 11px; width: 11px; background-color: rgb(0, 202, 86); border-radius: 50%; display: inline-block; float: right; top: 0px; margin: 10px 4px 10px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5); -webkit-app-region: no-drag;";
        const greenStoplightOnClick = "ipcRenderer.send('maximize');";
        
        /* Yellow - Minimize */
        const yellowStoplightStyle = "height: 11px; width: 11px; background-color: rgb(255, 189, 76); border-radius: 50%; display: inline-block; float: right; top: 0px; margin: 10px 4px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5); -webkit-app-region: no-drag;";
        const yellowStoplightOnClick = "ipcRenderer.send('minimize');";

        /* Dim the Button Function */
        function dimButton(id) {
            document.getElementById(id).style.filter = "brightness(40%)";
        }

        /* Brighten the Button Function */
        function brightenButton(id) {
            document.getElementById(id).style.filter = "brightness(100%)";
        }


        /* Give it Space */
        document.head.insertAdjacentHTML("beforeend", "<style>.web-chrome { top: 25px; }</style>");

        /* Add the Stoplights! */
        document.getElementById('web-main').insertAdjacentHTML('afterbegin', `
            <div style="backdrop-filter: saturate(50%) blur(20px); z-index: 9999; display: flex; -webkit-user-select: none; -webkit-app-region: no-drag; background-color: var(--playerBackground) !important; width: calc(100vw - var(--web-navigation-width)); height: 25px; position: fixed; top: 0; padding-top: 3px; padding-right: 3px;">
                <div class="dragDiv right-aligned" style="width: 100%; height: auto; -webkit-app-region: drag;">
                    <span id="red" onmouseover="dimButton('red')" onmouseleave="brightenButton('red')" onclick="${redStoplightOnClick}" style="${redStoplightStyle}"></span>
                    <span id="green" onmouseover="dimButton('green')" onmouseleave="brightenButton('green')" onclick="${greenStoplightOnClick}" style="${greenStoplightStyle}"></span>
                    <span id="yellow" onmouseover="dimButton('yellow')" onmouseleave="brightenButton('yellow')" onclick="${yellowStoplightOnClick}" style="${yellowStoplightStyle}"></span>
                </div>
            </div>
        `);
    }
} catch (e) {
    console.error("[JS] Error while trying to apply emulateMacOS_rightAlign.js", e);
}