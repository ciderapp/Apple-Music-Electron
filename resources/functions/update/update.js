const {autoUpdater} = require("electron-updater");
const {Notification} = require('electron');
const pjson = require('../../../package.json')

module.exports = {
    checkUpdates: function() {
        autoUpdater.checkForUpdatesAndNotify().then(r => {
            if (r && pjson !== r.updateInfo.version) {
                new Notification({
                    title: "Apple Music",
                    body: `New Update available at version ${r.updateInfo.version}.`
                }).show()
            }
        });
    }
}