const {app, nativeTheme, dialog, nativeImage, Tray} = require("electron");
const {join, resolve} = require("path");
const log = require("electron-log");
const pjson = require("../../package.json");
const os = require("os");
const fs = require("fs");
const gitPullOrClone = require("git-pull-or-clone");
const chmodr = require("chmodr");
const languages = require("../languages.json");

const init = {

    BaseInit: function () {
        console.log('[InitializeBase] Started.')

        // Set proper cache folder
        app.setPath("userData", join(app.getPath("cache"), app.name))

        // Disable CORS
        app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors')

        // Media Key Hijacking
        if (app.preferences.value('advanced.preventMediaKeyHijacking').includes(true)) {
            console.log("[Apple-Music-Electron] Hardware Media Key Handling disabled.")
            app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,MediaSessionService');
        }

        // Sets the ModelId (For windows notifications)
        if (process.platform === "win32") app.setAppUserModelId("Apple Music");

        // Disable the Media Session to allow MPRIS to be the primary service
        if (process.platform === "linux") app.commandLine.appendSwitch('disable-features', 'MediaSessionService');

        // Assign Default Variables
        app.isQuiting = !app.preferences.value('window.closeButtonMinimize').includes(true);
        app.win = '';
        app.ipc = {existingNotification: false};

        // Detects if the application has been opened with --force-quit
        if (app.commandLine.hasSwitch('force-quit')) {
            console.log("[Apple-Music-Electron] User has closed the application via --force-quit")
            app.quit()
        }

        // Set the Protocols
        app.setAsDefaultProtocolClient('ame') // Custom AME Protocol
        app.setAsDefaultProtocolClient('itms') // iTunes HTTP
        app.setAsDefaultProtocolClient('itmss') // iTunes HTTPS
        app.setAsDefaultProtocolClient('musics') // macOS Client
        app.setAsDefaultProtocolClient('music') // macOS Client

        // Set Max Listener
        require('events').EventEmitter.defaultMaxListeners = Infinity;
    },

    LoggingInit: function () {
        console.log('[InitializeLogging] Started.')

        console.log = log.log;
        console.error = log.error;
        console.warn = log.warn;
        console.debug = log.debug;

        console.log('---------------------------------------------------------------------')
        console.log(`${app.name} has started.`);
        console.log(`Version: ${pjson.version} | Electron Version: ${process.versions.electron}`)
        console.log(`Type: ${os.type} | Release: ${os.release()} | Platform: ${os.platform()}`)
        console.log(`User Data Path: '${app.getPath('userData')}'`)
        console.log("---------------------------------------------------------------------")
    },

    SetApplicationTheme: function () {
        // Initial Application Theme
        if (app.preferences.value('advanced.forceApplicationMode') === 'dark') {
            nativeTheme.themeSource = "dark"
        } else if (app.preferences.value('advanced.forceApplicationMode') === 'light') {
            nativeTheme.themeSource = "light"
        } else {
            if (nativeTheme.shouldUseDarkColors === true) {
                app.preferences.value('advanced.forceApplicationMode', 'dark');
            } else {
                app.preferences.value('advanced.forceApplicationMode', 'light');
            }
        }
    },

    ThemeInstallation: function () {
        init.SetApplicationTheme()

        // Set the folder
        app.userThemesPath = resolve(app.getPath('userData'), 'themes');
        console.log(`User Themes Path: '${app.userThemesPath}'`)

        // Make sure you can access the folder with the correct permissions
        console.log(`[InitializeTheme][existsSync] Checking if user themes directory exists.`)

        // Checks if the folder exists and create themes if it doesnt
        if (fs.existsSync(app.userThemesPath) && fs.existsSync(join(app.userThemesPath, 'blurple.css'))) {
            console.log("[InitializeTheme][existsSync] Folder exists!")
        } else {
            gitPullOrClone('https://github.com/Apple-Music-Electron/Apple-Music-Electron-Themes', app.userThemesPath, (err) => {
                console.log(`[InitializeTheme][gitPullOrClone] ${err ? err : `Initial Themes have been cloned to '${app.userThemesPath}'`}`)
            })
        }

        fs.access(join(app.userThemesPath, 'blurple.css'), fs.constants.R_OK | fs.constants.W_OK, (err) => {
            if (err) { // Set Permissions of Themes Directory
                console.error(`[InitializeTheme][access] ${err} - blurple.css could not be read. Attempting to change permissions.`)
                chmodr(app.userThemesPath, 0o777, (err) => {
                    if (err) {
                        console.error(`[InitializeTheme][chmodr] ${err} - Theme set to default to prevent application launch halt.`);
                        app.preferences.value('visual.theme', 'default')
                        if (err.toString().includes('permission denied') && process.platform === 'linux') { // Just gonna use this for now
                            dialog.showMessageBox(undefined, {
                                title: "Permission Change Needed!",
                                message: `In order for you to be able to use Themes, you will need to manually change the permissions of the directory: '${app.userThemesPath}'. This is caused because the application does not have sufficient permissions to set the folder permissions. You can run the following command to set permissions: \n\nsudo chmod 777 -R '${app.userThemesPath}'`,
                                type: "warning"
                            })
                        }
                    } else {
                        console.log('[InitializeTheme][chmodr] Folder permissions successfully set.');
                    }
                });
            } else { // File is Accessible
                console.log(`[InitializeTheme][access] 'blurple.css' was found and can be read and written to.`);
            }
        })

        // Save all the file names to array and log it
        try {
            console.log(`[InitializeTheme] Available Themes: [${fs.readdirSync(app.userThemesPath).join(', ')}]`)
        } catch (err) {
            console.error(err)
        }

        if (app.preferences.value('advanced.overwriteThemes').includes(true)) {
            gitPullOrClone('https://github.com/Apple-Music-Electron/Apple-Music-Electron-Themes', app.userThemesPath, (err) => {
                console.log(`[InitializeTheme][gitPullOrClone] ${err ? err : `Pulled Themes.`}`)
            })
            app.preferences.value('advanced.overwriteThemes', [])
        }
    },

    AppReady: function () {
        console.log('[ApplicationReady] Started.')
        // Run the Functions
        app.funcs.SetTaskList()
        init.ThemeInstallation()
        init.TrayInit()

        // Startup
        if (app.preferences.value('window.appStartupBehavior').includes('hidden')) {
            app.setLoginItemSettings({
                openAtLogin: true,
                args: [
                    '--process-start-args', `"--hidden"`
                ]
            })
        } else if (app.preferences.value('window.appStartupBehavior').includes('minimized')) {
            app.setLoginItemSettings({
                openAtLogin: true,
                args: [
                    '--process-start-args', `"--minimized"`
                ]
            })
        } else if (app.preferences.value('window.appStartupBehavior').includes('true')) {
            app.setLoginItemSettings({
                openAtLogin: true,
                args: []
            })
        } else {
            app.setLoginItemSettings({
                openAtLogin: false,
                args: []
            })
        }

        // Init
        const {checkUpdates} = require('./update')
        checkUpdates()

        // Mpris
        app.mpris = {
            active: false,
            canQuit: true,
            canControl: true,
            canPause: true,
            canPlay: true,
            canGoNext: true,
            service: {}
        }
        app.mpris = require('./media/mpris')
        app.mpris.connect()

        // LastFM
        app.lastfm = {api: null, cachedAttributes: false}
        app.lastfm = require('./media/lastfm')
        app.lastfm.authenticate()

        // Discord
        app.discord = {client: null, rpc: {}, error: false, activityCache: null, connected: false};
        app.discord.rpc = require('./media/discordrpc')
        app.discord.rpc.connect('749317071145533440')
    },

    TrayInit: function () {
        console.log('[InitializeTray] Started.')

        const winTray = nativeImage.createFromPath(join(__dirname, `../icons/icon.ico`)).resize({width: 32, height: 32})
        const macTray = nativeImage.createFromPath(join(__dirname, `../icons/icon.png`)).resize({width: 32, height: 32})
        const linuxTray = nativeImage.createFromPath(join(__dirname, `../icons/icon.png`)).resize({width: 32, height: 32})
        let trayIcon;
        if (process.platform === "win32") {
            trayIcon = winTray
        } else if (process.platform === "linux") {
            trayIcon = linuxTray
        } else if (process.platform === "darwin") {
            trayIcon = macTray
        }

        app.tray = new Tray(trayIcon)
        app.tray.setToolTip('Apple Music');
        app.funcs.SetContextMenu(true);

        app.tray.on('double-click', () => {
            if (typeof app.win.show === 'function') {
                if (app.win.isVisible()) {
                    app.win.focus()
                } else {
                    app.win.show()
                }
            }
        })
    },

    LocaleInit: function () {
        console.log('[GetLocale] Started.')
        let Region, Language, foundKey;

        // Check the Language
        for (let key in languages) {
            if (languages.hasOwnProperty(key)) {
                key = key.toLowerCase()
                if (app.getLocaleCountryCode().toLowerCase() === key) {
                    console.log(`[GetLocale] Found: ${key} | System Language: ${app.getLocaleCountryCode().toLowerCase()}`)
                    foundKey = key
                }
            }
        }

        // Check if the Region is being forced
        if (!app.preferences.value('advanced.forceApplicationRegion')) {
            Region = foundKey;
            app.preferences.value('advanced.forceApplicationRegion', foundKey);
        } else {
            Region = app.preferences.value('advanced.forceApplicationRegion');
        }
        console.log(`[GetLocale] Chosen Region: ${Region}`);

        // Check if the Language is being forced
        if (!app.preferences.value('general.language')) {
            Language = foundKey;
            app.preferences.value('general.language', foundKey);
        } else {
            Language = app.preferences.value('general.language');
        }
        console.log(`[GetLocale] Chosen Language: ${Language}`);

        // Return it
        console.log(`[GetLocale] Outputting Locale.`)
        return [Region, Language]
    }
}

module.exports = init