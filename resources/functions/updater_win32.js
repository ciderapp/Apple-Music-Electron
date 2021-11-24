const {dialog, app, BrowserWindow} = require("electron")
const fetch = require('node-fetch');
const os = require('os');
const {join} = require('path');
const {existsSync} = require("fs");
const {mkdir} = require("fs/promises");

const UpdaterWin32 = {
    url: "https://api.github.com/repos/Apple-Music-Electron/Apple-Music-Electron/releases",
    settings: {method: "Get"},
    checkForUpdates(force = false) {
        let self = this
        fetch(this.url, this.settings)
            .then(res => res.json())
            .then((json) => {
                let assets = json[0].assets.filter(asset => asset.name.endsWith(".exe"));
                let downloadUrl = assets[0].browser_download_url;
                let currentVersion = app.getVersion()
                let latestVersion = json[0].tag_name.replace("v", "");
                if ((latestVersion > currentVersion) || force) {
                    console.log(assets[0].browser_download_url);
                    dialog.showMessageBox({
                        title: "Update available",
                        message: `A new version of Apple Music Electron is available for download\nLatest: ${latestVersion}\nInstalled: ${currentVersion}`,
                        type: "info",
                        buttons: ['Update Later', 'Update Now', 'View on GitHub']
                    }).then(({response}) => {
                        switch (response) {
                            case 0:
                                break;
                            case 1:
                                self.downloadUpdate(downloadUrl);
                                break;
                            case 2:
                                require('electron').shell.openExternal(json[0].html_url);
                                break;
                        }
                    })
                } else {
                    console.log("No update available");
                }
            })
    },
    updateUI () {
        let win = new BrowserWindow({
            icon: join(__dirname, `../icons/icon.ico`),
            width: 300,
            height: 300,
            resizable: false,
            show: true,
            center: true,
            transparent: false,
            title: app.getName(),
            frame: false,
            alwaysOnTop: false,
            webPreferences: {
                nodeIntegration: true
            }
        })
        win.show()
        win.loadFile('./resources/updater-ui/index.html')
        win.on("closed", () => {
            win = null
        })
    },
    downloadUpdate(downloadUrl) {
        this.updateUI()
        app.win.hide()
        let self = this
        const tmpDir = join(os.tmpdir(), "ame-update");
        if (!existsSync(tmpDir)) {
            mkdir(tmpDir, {
                recursive: true
            })
        }
        fetch(downloadUrl)
            .then(res => res.buffer())
            .then(buffer => {
                require('fs').writeFileSync(join(tmpDir, 'ameupdate.exe'), buffer);
                require('child_process').spawn(join(tmpDir, 'ameupdate.exe'), [], {
                    detached: true
                });
                app.quit();
            });
    }
}

module.exports = UpdaterWin32