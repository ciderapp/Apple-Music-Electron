try {

    if (document.getElementsByClassName('search-box dt-search-box web-navigation__search-box').length > 0) {
        document.getElementsByClassName('search-box dt-search-box web-navigation__search-box')[0].style.gridArea = "auto";


        document.getElementsByClassName('search-box dt-search-box web-navigation__search-box')[0].style.marginTop = '0px';



        document.getElementsByClassName('search-box dt-search-box web-navigation__search-box')[0].style.webkitAppRegion = 'drag'
    }


    if (document.getElementsByClassName('web-chrome').length > 0) {
        document.getElementsByClassName('web-chrome')[0].style.webkitAppRegion = 'drag'
    }

    if (document.getElementById('web-navigation-search-box').length > 0 && document.getElementById('stoplightCheck') < 1) {

        var hoverEffects = 'onmouseenter="brightness(40%)" onmouseleave="brightness(100%)"'


        var redStoplightStyle = 'height: 11px; width: 11px; background-color: rgb(255, 92, 92); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 4px 10px 10px; color: rgb(130, 0, 5); -webkit-app-region: no-drag; '
        var redStoplightOnClick = "const { ipcRenderer } = require('electron'); ipcRenderer.send('close')"


        var yellowStoplightStyle = 'height: 11px; width: 11px; background-color: rgb(255, 189, 76); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 4px; color: rgb(130, 0, 5); -webkit-app-region: no-drag;'
        var yellowStoplightOnClick = "const { ipcRenderer } = require('electron'); ipcRenderer.send('minimize')"


        var greenStoplightStyle = 'height: 11px; width: 11px; background-color: rgb(0, 202, 86); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 10px 10px 4px; color: rgb(130, 0, 5); -webkit-app-region: no-drag;'
        var greenStoplightOnClick = "const { ipcRenderer } = require('electron'); ipcRenderer.send('maximize')"

        document.getElementById('web-navigation-search-box').insertAdjacentHTML('beforebegin', `
                <div id="stoplightCheck"style="-webkit-app-region: drag;">
                <span ${hoverEffects} onclick="${redStoplightOnClick}" style="${redStoplightStyle}" ></span>
                <span ${hoverEffects} onclick="${yellowStoplightOnClick}" style="${yellowStoplightStyle}"></span>
                <span ${hoverEffects} onclick="${greenStoplightOnClick}"style="${greenStoplightStyle}"></span>
                </div>`)


        //document.getElementById('web-navigation-search-box').insertAdjacentHTML('beforebegin', `<div style="" class="stoplight"><span style="height: 11px; width: 11px; background-color: rgb(255, 92, 92); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 4px 10px 10px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5);"></span><span style="height: 11px; width: 11px; background-color: rgb(255, 189, 76); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 4px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5);"></span><span style="height: 11px; width: 11px; background-color: rgb(0, 202, 86); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 10px 10px 4px; color: rgb(130, 0, 5); fill: rgb(130, 0, 5);"></span></div>`)

    }
} catch (e) {
    console.error("[CSS] Error while trying to apply macosAppEmu.js", e);
}