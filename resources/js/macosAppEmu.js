/* 
 *
 * Merges removeUpsell & removeAppleLogo, and creates stoplights on top left like the [macOS Apple Music app](https://support.apple.com/library/content/dam/edam/applecare/images/en_US/macos/Catalina/macos-catalina-apple-music-itunes-store.jpg)
 *
 */
try {


    //Remove Apple
    while (document.getElementsByClassName('web-navigation__header web-navigation__header--logo').length > 0) {
        document.getElementsByClassName('web-navigation__header web-navigation__header--logo')[0].remove();
    }

    //Remove Upsell
    while (document.getElementsByClassName('web-navigation__native-upsell').length > 0) {
        document.getElementsByClassName('web-navigation__native-upsell')[0].remove();
    }

    //Make Searchbar area same color
    if (document.getElementsByClassName('search-box dt-search-box web-navigation__search-box').length > 0) {
        document.getElementsByClassName('search-box dt-search-box web-navigation__search-box')[0].style.gridArea = "auto";

        //Up you go!
        document.getElementsByClassName('search-box dt-search-box web-navigation__search-box')[0].style.marginTop = '0px';
        //document.getElementsByClassName('search-box dt-search-box web-navigation__search-box')[0].style.backgroundColor = 'var(--playerBackground)';

        //Add Drag
        document.getElementsByClassName('search-box dt-search-box web-navigation__search-box')[0].style.webkitAppRegion = 'drag'
    }


    if (document.getElementsByClassName('web-chrome').length > 0) {
        document.getElementsByClassName('web-chrome')[0].style.webkitAppRegion = 'drag'
    }

    if (document.getElementById('web-navigation-search-box').length > 0) {



        ///Stoplights 
        //Change values to customize look and/or behaviour
        
        //General
        const hoverEffects = 'onmouseenter="brightness(40%)" onmouseleave="brightness(100%)"'

        //Red - Close
        const redStoplightStyle = 'height: 11px; width: 11px; background-color: rgb(255, 92, 92); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 4px 10px 10px; color: rgb(130, 0, 5); -webkit-app-region: no-drag; '
        const redStoplightOnClick = "const { ipcRenderer } = require('electron'); ipcRenderer.send('close')"

        //Yellow - Minimize
        const yellowStoplightStyle = 'height: 11px; width: 11px; background-color: rgb(255, 189, 76); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 4px; color: rgb(130, 0, 5); -webkit-app-region: no-drag;'
        const yellowStoplightOnClick = "const { ipcRenderer } = require('electron'); ipcRenderer.send('minimize')"

        //Green - Maximize
        const greenStoplightStyle = 'height: 11px; width: 11px; background-color: rgb(0, 202, 86); border-radius: 50%; display: inline-block; left: 0px; top: 0px; margin: 10px 10px 10px 4px; color: rgb(130, 0, 5); -webkit-app-region: no-drag;'
        const greenStoplightOnClick = "const { ipcRenderer } = require('electron'); ipcRenderer.send('maximize')"

        document.getElementById('web-navigation-search-box').insertAdjacentHTML('beforebegin', `
<div style="">
<img ${hoverEffects} onclick=\"${redStoplightOnClick}\" style=\"${redStoplightStyle}\" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABmJLR0QA/wD/AP+gvaeTAAAB60lEQVRIie3WMW/TQBjG8f9jO1IIZEdqhIpg6FRa8SmSACkTA93YATEwguAjsCMhlTVCTRNC+QqIBljYokqEsjdSgGLfy5AiJTh2kiqGpc949+p+fq3z+eA0/yiatfD71esXfOdqhqtKWsYoHa/QM7N9iWboR9uFd2+/LAQeXLm2FCh6hHQH8KeUO4l66NzDMx/e7J8Y/rlW3pC8LbBz0x5wLEbfSZv5TquRVOIlTRytVe5Jqs+NAoiih706Wq/cTS6ZkGGnqqc92IxxDt2c1HkMHqyWS4HvfT5Rp5Ni9H8pWDnbaRyMDsc6Cjw9XRgKIIo5wifx4ZEMP5moy/TdO2+iMLLlwqd278/AWMe+izYyQAH8IFBtdGAMNihngA7XNlUSYaHLWcGSXUqEgfNZwZiW0uAMYy4FtgOyS/J3bNDNSjU0tvb45pK1soKFaybCoR9tA1EGbhhG7CTCxz/xFxnAz0dPrRgMEDrvMUZ/gehhzotiZ3UMLnxsfvVkt1jMK3dOtqn3u9+mwgBBp90GHgBu0vysKOh+fq+9M2ky9erzY716wzN7iSjOiR564naw97qZVJB6cuU7rUZueMY+A8IZQAds5bxoJQ2FOa63g9VyKQhUM6MquAgaXm+xnqGujFboXOPv3Xua/57fxZSoe1HufSoAAAAASUVORK5CYII="></img>
<img ${hoverEffects} onclick=\"${yellowStoplightOnClick}\" style=\"${yellowStoplightStyle}\" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABmJLR0QA/wD/AP+gvaeTAAAB50lEQVRIie3WvW4TQRSG4ffsbigINnbcIMWKgkKRSwDkJDVEwqGiIB09IApKEFwCPRJSaC0UxxE9GJQ7oLMiJYQGG8eW0uzMHAqCZK+96x95oclXzhzts2c0Mxq4yD+KjFvYqueXfLFlnGwiLAPF86ljlENEa8YGu4WN1tFM4LOvhUWj5oUqjwB/RLkToWI9eZ6/1T6cGu58ym2ppzvAlVE/GElXkO1sqV2NK/DiJk4/556op5UpUICMoh9Ov2QfxxUM7fi800rSj40ZJ8j9YZ0PwM2DhWJg7Dem63RYugFzq/Olnye9gwMd+aF9PUMUIBMSvooO9nXcqueXfFyD0bt30lgT+MuFm63jvwN9Hftit1JAAfwgNOXegf6lVrmTAvonInfjYbiRGgwrSfC1FOHFJDjNuCT4hPSSeI4bKcJ9347Aup+WqkItFjY22AVsCq6xvr8XCxc2WkcK72atCrztvbUGYIBLXvAS6M7Q7fhu8K4egC/fbn4HfcBsltyJetvz62c/RsIAV0udj4g+I3L2JkURfZpd+7U3bDL56VPP3VP0PZCZEO2IuofZtW4triDx5sqW2lXP2RVU3gBmDNAhshO4cDUJhQmet82DhWIQmjIim8B1ep+30EB138wF1ejuvch/z28q/p5xLp17OwAAAABJRU5ErkJggg=="></img>
<img ${hoverEffects} onclick=\"${greenStoplightOnClick}\"style=\"${greenStoplightStyle}\" src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAB4AAAAeCAYAAAA7MK6iAAAABmJLR0QA/wD/AP+gvaeTAAAB5klEQVRIie2WPW/TUBSGn+PrdGp2pEZVUTtUqjAfJYi/AJVImTq0G3NJm4ERBCNDGsGMhFTWCDVNxV+ohBFtWoktqkQpezPW8WEJUmzHzodsWPqO5x7d5773Hh8fuNY/koyauOSWZ22kpFgroHNAobd0DnKmqk1V2Tt9UP2ZCvj20fYMV7xU4RlghqT7AnUx+uLobu1sYvAtd2tVkF1getgBQ+qgstEqVhtxCVbcguNulwWpTwAFyCP62XErz+MSBjruOa0nHWxE+ag8HeQ8AnYONwvY9g8mczpIHWPlFr/fe3vRH4w4UmO/SREKkO/63utwMOB4yS3PGqw2w6t3XHXxvLnWw/fnfwMBxwazmgEUwGjOlPoDwatWfZQBFABReRwLFmEhKzAwHwtWuJEheCYWnKUU/CTwBRlJQnuHiot2VmAI7h1+44PsuNKMB6vsAd0MqB7e1X4suPcT/5g2VUU/9HetCBhAbF4BndSgcDmlRHp1BHx8Z+eXqq6RzpX7Imx8u1/7PRQMcFKsfQGpEPr2xoaiW63lnf1Bi4mjj/O18gTRT0B+HKLCpSWyfrxcbcblJHauVrHaMJY3D7wDvBGYPsLuFLqYBIUxxlvncLOgOVMSZAXlJoHxljZwgOc1wtV7rf+uP+YelbDtTfrMAAAAAElFTkSuQmCC"></img>
</div>`)

    }
} catch (e) {
    console.error("[CSS] Error while trying to apply macosAppEmu.js", e);
}
