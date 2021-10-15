require('git-clone');
require('rimraf');
const {app, nativeTheme, nativeImage, Tray} = require("electron"),
    {join, resolve} = require("path"),
    os = require("os"),
    fs = require("fs"),
    languages = require("../languages.json"),
    {initAnalytics} = require('./utils');
initAnalytics();

const init = {

    BaseInit: function () {
        init.SettingsInit()

        const censoredConfig = JSON.parse(JSON.stringify(app.preferences._preferences))
        censoredConfig.general.lastfmAuthKey = '(hidden)'

        console.log('---------------------------------------------------------------------')
        console.log(`${app.getName()} has started.`);
        console.log(`Version: ${app.getVersion()} | Electron Version: ${process.versions.electron}`)
        console.log(`Type: ${os.type} | Release: ${os.release()} ${app.ame.utils.fetchOperatingSystem() ? app.ame.utils.fetchOperatingSystem() : ""} | Platform: ${os.platform()}`)
        console.log(`User Data Path: '${app.getPath('userData')}'`)
        console.log(`Current Configuration: ${JSON.stringify(censoredConfig)}`)
        console.log("---------------------------------------------------------------------")
        if (app.preferences.value('general.analyticsEnabled').includes(true) && app.isPackaged) console.log('[Sentry] Sentry logging is enabled, any errors you receive will be presented to the development team to fix for the next release.')
        console.verbose('[InitializeBase] Started.');

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
        app.isQuiting = (app.isQuiting ? app.isQuiting : false);
        app.win = '';
        app.ipc = {
            existingNotification: false
        };

        if (app.preferences.value('general.incognitoMode').includes(true)) {
            console.log("[Incognito] Incognito Mode enabled. DiscordRPC and LastFM updates are ignored.")
        }

        // Set Max Listener
        require('events').EventEmitter.defaultMaxListeners = Infinity;
    },

    LoggingInit: function () {
        const log = require("electron-log");

        if (app.commandLine.hasSwitch('verbose')) {
            app.verboseLaunched = true
        }

        log.transports.file.resolvePath = (vars) => {
            return join(app.getPath('userData'), 'logs', vars.fileName);
        }

        Object.assign(console, log.functions);

        console.verbose = () => {
        };

        if (app.preferences.value('advanced.verboseLogging').includes(true) || app.verboseLaunched) {
            console.verbose = log.debug
        } else {
            console.verbose = function (_data) {
                return false
            };
        }
    },

    ThemeInstallation: function () {

        // Check if the themes folder exists and check permissions
        if (fs.existsSync(resolve(app.getPath("userData"), "themes"))) {
            app.ame.utils.permissionsCheck(resolve(app.getPath("userData"), "themes"), 'README.md')
        } else {
            app.ame.utils.updateThemes().catch((e) => console.error(e));
        }

        // Save all the file names to array and log it
        if (fs.existsSync(app.userThemesPath)) {
            console.log(`[InitializeTheme] Files found in Themes Directory: [${fs.readdirSync(resolve(app.getPath("userData"), "themes")).join(', ')}]`)
        }

        // Set the default theme
        if (app.preferences.value('advanced.forceApplicationMode')) {
            nativeTheme.themeSource = app.preferences.value('advanced.forceApplicationMode')
        }
    },

    PluginInstallation: function () {
        if (!fs.existsSync(resolve(app.getPath("userData"), "plugins"))) { return; }

        // Check if the plugins folder exists and check permissions
        app.pluginsEnabled = true;
        console.log("[PluginInstallation][existsSync] Plugins folder exists!");
        app.ame.utils.permissionsCheck(app.userPluginsPath, '/');
        app.ame.utils.updatePluginsListing();

        // Save all the file names to array and log it
        console.log(`[PluginInstallation] Files found in Plugins Directory: [${fs.readdirSync(resolve(app.getPath("userData"), "plugins")).join(', ')}]`);
    },

    AppReady: function () {
        console.verbose('[ApplicationReady] Started.');

        // Run the Functions
        init.ThemeInstallation()
        init.PluginInstallation()
        init.TrayInit()

        // Set the Protocols - Doesnt work on linux :(
        app.setAsDefaultProtocolClient('ame') // Custom AME Protocol
        app.setAsDefaultProtocolClient('itms') // iTunes HTTP
        app.setAsDefaultProtocolClient('itmss') // iTunes HTTPS
        app.setAsDefaultProtocolClient('musics') // macOS Client
        app.setAsDefaultProtocolClient('music') // macOS Client

        // Running the Application on Login
        if (app.preferences.value('window.appStartupBehavior')) {
            app.setLoginItemSettings({
                openAtLogin: true,
                args: [
                    '--process-start-args', `${app.preferences.value('window.appStartupBehavior').includes('hidden') ? "--hidden" : (app.preferences.value('window.appStartupBehavior').includes('minimized') ? "minimized" : "")}`
                ]
            })
        }

        app.ame.mpris.connect(); // M.P.R.I.S
        app.ame.lastfm.authenticate(); // LastFM
        app.ame.discord.connect(app.preferences.value('general.discordRPC') === 'ame-title' ? '749317071145533440' : '886578863147192350'); // Discord

        app.pluginsEnabled = false;
        app.isAuthorized = false;
        app.media = {status: false, playParams: {id: 'no-id-found'}};


        // On Window Creation
        app.on('browser-window-created', (_event, _window) => {
            app.ame.utils.checkForUpdates()
            app.ame.win.SetTaskList()
        })

    },

    TrayInit: function () {
        console.verbose('[InitializeTray] Started.');

        const winTray = nativeImage.createFromPath(join(__dirname, `../icons/icon.ico`)).resize({
            width: 32,
            height: 32
        })
        const macTray = nativeImage.createFromPath(join(__dirname, `../icons/icon.png`)).resize({
            width: 20,
            height: 20
        })
        const linuxTray = nativeImage.createFromPath(join(__dirname, `../icons/icon.png`)).resize({
            width: 32,
            height: 32
        })
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
        app.ame.win.SetContextMenu(true);

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
        console.verbose('[GetLocale] Started.');
        let Region, Language, foundKey;

        // Check the Language
        for (let key in languages) {
            if (languages.hasOwnProperty(key)) {
                key = key.toLowerCase()
                if (app.getLocaleCountryCode().toLowerCase() === key) {
                    console.log(`[GetLocale] Found: '${key}' | System Language: '${app.getLocaleCountryCode().toLowerCase()}'`)
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
        console.verbose(`[GetLocale] Chosen Region: ${Region}`);

        // Check if the Language is being forced
        if (!app.preferences.value('general.language')) {
            Language = foundKey;
            app.preferences.value('general.language', foundKey);
        } else {
            Language = app.preferences.value('general.language');
        }
        console.verbose(`[GetLocale] Chosen Language: ${Language}`);

        // Return it
        console.log(`[GetLocale] Outputting Locale.`)


        if (!Region) {
            Region = 'us';
            console.error("[GetLocale] No Region found, setting locale region to 'us'.")
        }
        if (!Language) {
            Language = 'us';
            console.error("[GetLocale] No Language found, setting locale language to 'us'.")
        }

        return [Region, Language]
    },

    SettingsInit: function () {
        // Check the Configuration File
        const ExistingConfigurationPath = resolve(app.getPath('userData'), 'preferences.json');

        // Update the configuration
        try {
            console.verbose(`[OpenMenu][ConfigurationCheck] Checking for existing configuration at '${ExistingConfigurationPath}'`);
            if (fs.existsSync(ExistingConfigurationPath)) {
                console.verbose(`[OpenMenu][ConfigurationCheck] '${ExistingConfigurationPath}' exists!`);
                const data = fs.readFileSync(ExistingConfigurationPath, {
                    encoding: 'utf8',
                    flag: 'r'
                });
                const userConfiguration = JSON.parse(data.toString())
                const baseConfiguration = app.preferences.defaults;

                Object.keys(baseConfiguration).forEach(function (parentKey) {
                    if (parentKey in userConfiguration) {
                        Object.keys(baseConfiguration[parentKey]).forEach(function (childKey) {
                            if (!userConfiguration[parentKey].hasOwnProperty(childKey)) {
                                console.warn(`[OpenMenu][ConfigurationCheck][MissingKey] ${parentKey}.${childKey} - Value found in defaults: ${(baseConfiguration[parentKey][childKey]).toString() ? baseConfiguration[parentKey][childKey].toString() : '[]'}`);
                                app.preferences.value(`${parentKey}.${childKey}`, baseConfiguration[parentKey][childKey]);
                            }
                        })
                    } else {
                        console.warn(`[OpenMenu][ConfigurationCheck][MissingKey] ${parentKey} - Value found in defaults: ${(baseConfiguration[parentKey]).toString() ? (baseConfiguration[parentKey]).toString() : '[]'}`);
                        app.preferences.value(parentKey, baseConfiguration[parentKey]);
                    }
                })
            }
        } catch (err) {
            console.error(`[OpenMenu][ConfigurationCheck] ${err}`)
        }
    }
}

module.exports = init