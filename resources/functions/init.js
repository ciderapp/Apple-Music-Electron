const {app, nativeTheme, nativeImage, Tray, globalShortcut, protocol, ipcMain} = require("electron");
const {join, resolve} = require("path");
const os = require("os");
const fs = require("fs");
const chmodr = require("chmodr");
const clone = require('git-clone');
const rimraf = require('rimraf')
const languages = require("../languages.json");
const ElectronSentry = require('@sentry/electron');

const themes = {
    fetchThemeName: (fileName) => {
        fileName = join(app.userThemesPath, `${fileName.toLowerCase()}.css`)
        let found = false;
        if (fs.existsSync(fileName)) {
            const file = fs.readFileSync(fileName, "utf8");
            file.split(/\r?\n/).forEach((line) => {
                if (line.includes("@name")) {
                    found = (line.split('@name')[1]).trim()
                }
            })
        }
        return found
    },

    updateThemesListing: () => {
        let themesFileNames = [], themesListing = [];

        if (fs.existsSync(app.userThemesPath)) {
            fs.readdirSync(app.userThemesPath).forEach((value) => {
                if (value.split('.').pop() === 'css') {
                    themesFileNames.push(value.split('.').shift())
                }
            });
        }

        // Get the Info
        themesFileNames.forEach((themeFileName) => {
            const themeName = themes.fetchThemeName(themeFileName)
            if (!themeName) return;
            themesListing[`${themeFileName}`] = themeName
        })

        app.preferences._preferences.availableThemes = themesListing
        return themesListing
    },

    updateThemes: async () => {
        rimraf(app.userThemesPath, [], () => {
            console.warn(`[InitializeTheme] Clearing themes directory for fresh clone. ('${app.userThemesPath}')`)
            clone('https://github.com/Apple-Music-Electron/Apple-Music-Electron-Themes', app.userThemesPath, [], (err) => {
                console.log(`[InitializeTheme][GitClone] ${err ? err : `Re-cloned Themes.`}`)
                themes.updateThemesListing()
                return Promise.resolve(err)
            })
        })
    },

    permissionsCheck: (folder, file) => {
        console.verbose(`[PermissionsCheck] Running check on ${join(folder, file)}`)
        fs.access(join(folder, file), fs.constants.R_OK | fs.constants.W_OK, (err) => {
            if (err) { // File cannot be read after cloning
                console.error(`[PermissionsCheck][access] ${err}`)
                chmodr(folder, 0o777, (err) => {
                    if (err) {
                        console.error(`[PermissionsCheck][chmodr] ${err} - Theme set to default to prevent application launch halt.`);
                    }
                });
            } else {
                console.verbose('[PermissionsCheck] Check passed.')
            }
        })
    }
}

const plugins = {
    fetchPluginName: (fileName) => {
        fileName = join(app.userPluginsPath, `${fileName.toLowerCase()}.js`)
        let found = false;
        if (fs.existsSync(fileName)) {
            const file = fs.readFileSync(fileName, "utf8");
            file.split(/\r?\n/).forEach((line) => {
                if (line.includes("@name")) {
                    found = (line.split('@name')[1]).trim()
                }
            })
        }
        return found
    },

    updatePluginsListing: () => {
        let pluginsFileNames = [],
            pluginsListing = [];

        if (fs.existsSync(app.userPluginsPath)) {
            fs.readdirSync(app.userPluginsPath).forEach((value) => {
                if (value.split('.').pop() === 'js') {
                    pluginsFileNames.push(value.split('.').shift())
                }
            });
        }

        // Get the Info
        pluginsFileNames.forEach((pluginFileName) => {
            const pluginName = plugins.fetchPluginName(pluginFileName)
            if (!pluginName) return;
            pluginsListing[`${pluginFileName}`] = pluginName
        })

        app.preferences._preferences.availablePlugins = pluginsListing
        return pluginsListing
    },
    permissionsCheck: (folder, file) => {
        console.verbose(`[PermissionsCheck] Running check on ${join(folder, file)}`)
        fs.access(join(folder, file), fs.constants.R_OK | fs.constants.W_OK, (err) => {
            if (err) { 
                console.error(`[PermissionsCheck][access] Plugins folder does not exist.`)
            } else {
                console.verbose('[PermissionsCheck] Plugins folder exists.')
            }
        })
    }
}

const init = {

    BaseInit: function () {
        init.SettingsInit()
        let simplifiedOs;
        if (os.type().includes('Windows')) {
            if (parseFloat(os.release()) >= parseFloat('10.0.22000')) {
                simplifiedOs = 'win11'
            } else if (parseFloat(os.release()) < parseFloat('10.0.22000') && parseFloat(os.release()) >= parseFloat('10.0.10240')) {
                simplifiedOs = 'win10'
            }
        }

        const censoredConfig = JSON.parse(JSON.stringify(app.preferences._preferences))
        censoredConfig.general.lastfmAuthKey = '(hidden)'

        console.log('---------------------------------------------------------------------')
        console.log(`${app.getName()} has started.`);
        console.log(`Version: ${app.getVersion()} | Electron Version: ${process.versions.electron}`)
        console.log(`Type: ${os.type} | Release: ${os.release()} ${simplifiedOs ? `(${simplifiedOs}) ` : ''}| Platform: ${os.platform()}`)
        console.log(`User Data Path: '${app.getPath('userData')}'`)
        console.log(`Current Configuration: ${JSON.stringify(censoredConfig)}`)
        console.log("---------------------------------------------------------------------")
        if (app.preferences.value('general.analyticsEnabled').includes(true) && app.isPackaged) console.log('[Sentry] Sentry logging is enabled, any errors you receive will be presented to the development team to fix for the next release.')
        console.verbose('[InitializeBase] Started.');

        app.isAuthorized = false

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

        ipcMain.on('updateThemes', (_event) => {
            rimraf(app.userThemesPath, [], () => {
                console.warn(`[InitializeTheme] Clearing themes directory for fresh clone. ('${app.userThemesPath}')`)
                clone('https://github.com/Apple-Music-Electron/Apple-Music-Electron-Themes', app.userThemesPath, [], (err) => {
                    console.log(`[InitializeTheme][GitClone] ${err ? err : `Re-cloned Themes.`}`)
                    const themesListing = (err ? err : themes.updateThemesListing())
                    app.win.webContents.send('themesUpdated', themesListing)
                })
            })
        })

        // Check if the themes folder exists and check permissions
        if (fs.existsSync(app.userThemesPath)) {
            console.log("[InitializeTheme][existsSync] Themes folder exists!")
            themes.permissionsCheck(app.userThemesPath, 'README.md')
            themes.updateThemesListing()
        } else {
            themes.updateThemes().catch((e) => console.error(e));
        }

        // Save all the file names to array and log it
        if (fs.existsSync(app.userThemesPath)) {
            console.log(`[InitializeTheme] Files found in Themes Directory: [${fs.readdirSync(app.userThemesPath).join(', ')}]`)
        }

        // Set the default theme
        if (app.preferences.value('advanced.forceApplicationMode')) {
            nativeTheme.themeSource = app.preferences.value('advanced.forceApplicationMode')
        }
    },

    PluginInstallation: function () {
        // Check if the plugins folder exists and check permissions
        if (fs.existsSync(app.userPluginsPath)) {
            app.pluginsEnabled = true
            console.log("[InitializePlugins][existsSync] Plugins folder exists!")
            plugins.permissionsCheck(app.userPluginsPath, '/')
            plugins.updatePluginsListing()
        }else{
            app.pluginsEnabled = false
        }

        // Save all the file names to array and log it
        if (fs.existsSync(app.userPluginsPath)) {
            console.log(`[InitializePlugins] Files found in Plugins Directory: [${fs.readdirSync(app.userPluginsPath).join(', ')}]`)
        }
    },

    AppReady: function () {
        console.verbose('[ApplicationReady] Started.');
        // Run the Functions
        app.funcs.SetTaskList()
        init.ThemeInstallation()
        init.PluginInstallation()
        init.TrayInit()

        // Set the Protocols - Doesnt work on linux :(
        app.setAsDefaultProtocolClient('ame') // Custom AME Protocol
        app.setAsDefaultProtocolClient('itms') // iTunes HTTP
        app.setAsDefaultProtocolClient('itmss') // iTunes HTTPS
        app.setAsDefaultProtocolClient('musics') // macOS Client
        app.setAsDefaultProtocolClient('music') // macOS Client

        if (app.preferences.value('storedVersion') !== app.getVersion()) {
            console.verbose(`[ApplicationReady] Updating Stored Version to ${app.getVersion()} (Was ${app.preferences.value('storedVersion')}).`);
            app.preferences.value('storedVersion', app.getVersion())
        }

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
        app.checkUpdates = require('./update').checkUpdates
        app.checkUpdates()

        app.funcs.mpris.connect() // Mpris
        app.funcs.lastfm.authenticate() // LastFM
        app.funcs.discord.connect(app.preferences.value('general.discordRPC') === 'ame-title' ? '749317071145533440' : '886578863147192350') // Discord
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
    },

    PreferencesInit: function () {
        app.setPath("userData", join(app.getPath("cache"), app.name.replace(/\s/g, ''))) // Set Linux to use .cache instead of .config and remove the space as its annoying
        let fields = {
            default: {},
            general: [],
            visual: [],
            audio: [],
            window: [],
            advanced: []
        }
        fields.default = {
            'storedVersion': "",
            "general": {
                "language": "",
                "incognitoMode": [],
                "playbackNotifications": "minimized",
                "trayTooltipSongName": [
                    true
                ],
                "startupPage": "browse",
                "discordRPC": "ame-title",
                "discordClearActivityOnPause": [
                    true
                ],
                "lastfmEnabled": [],
                "lastfmAuthKey": "Put your Auth Key here.",
                "lastfmRemoveFeaturingArtists": [
                    true
                ],
                "analyticsEnabled": [
                    true
                ],
            },
            "visual": {
                "theme": "default",
                "frameType": "",
                "transparencyEffect": "",
                "transparencyTheme": "appearance-based",
                "transparencyDisableBlur": [
                    true
                ],
                "transparencyMaximumRefreshRate": "",
                "streamerMode": [],
                "removeUpsell": [
                    true
                ],
                "removeAppleLogo": [
                    true
                ],
                "removeFooter": [
                    true
                ],
                "useOperatingSystemAccent": [],
                "mxmon": [],
                "mxmlanguage": "en",
            },
            "audio": {
                "audioQuality": "auto",
                "gaplessEnabled": [
                    true
                ],
            },
            "window": {
                "appStartupBehavior": "",
                "closeButtonMinimize": [
                    true
                ]
            },
            "advanced": {
                "forceApplicationRegion": "",
                "forceApplicationMode": "system",
                "verboseLogging": [],
                "alwaysOnTop": [],
                "autoUpdaterBetaBuilds": [],
                "useBetaSite": [
                    true
                ],
                "preventMediaKeyHijacking": [],
                "menuBarVisible": [],
                "removeScrollbars": [
                    true
                ],
                "devTools": [],
                "devToolsOpenDetached": [],
                "allowMultipleInstances": [],
                "allowOldMenuAccess": [],
            }
        }
        fields.general = [
            { // Language
                'label': 'Language',
                'key': 'language',
                'type': 'dropdown',
                'options': [
                    {
                        'label': 'English (USA)',
                        'value': 'us'
                    },
                    {
                        'label': 'English (GB)',
                        'value': 'gb'
                    },
                    {
                        'label': 'United Arab Emirates',
                        'value': 'ae'
                    },
                    {
                        'label': 'Antigua and Barbuda',
                        'value': 'ag'
                    },
                    {
                        'label': 'Anguilla',
                        'value': 'ai'
                    },
                    {
                        'label': 'Albania',
                        'value': 'al'
                    },
                    {
                        'label': 'Armenia',
                        'value': 'am'
                    },
                    {
                        'label': 'Angola',
                        'value': 'ao'
                    },
                    {
                        'label': 'Argentina',
                        'value': 'ar'
                    },
                    {
                        'label': 'Austria',
                        'value': 'at'
                    },
                    {
                        'label': 'Australia',
                        'value': 'au'
                    },
                    {
                        'label': 'Azerbaijan',
                        'value': 'az'
                    },
                    {
                        'label': 'Barbados',
                        'value': 'bb'
                    },
                    {
                        'label': 'Belgium',
                        'value': 'be'
                    },
                    {
                        'label': 'Burkina-Faso',
                        'value': 'bf'
                    },
                    {
                        'label': 'Bulgaria',
                        'value': 'bg'
                    },
                    {
                        'label': 'Bahrain',
                        'value': 'bh'
                    },
                    {
                        'label': 'Benin',
                        'value': 'bj'
                    },
                    {
                        'label': 'Bermuda',
                        'value': 'bm'
                    },
                    {
                        'label': 'Brunei Darussalam',
                        'value': 'bn'
                    },
                    {
                        'label': 'Bolivia',
                        'value': 'bo'
                    },
                    {
                        'label': 'Brazil',
                        'value': 'br'
                    },
                    {
                        'label': 'Bahamas',
                        'value': 'bs'
                    },
                    {
                        'label': 'Bhutan',
                        'value': 'bt'
                    },
                    {
                        'label': 'Botswana',
                        'value': 'bw'
                    },
                    {
                        'label': 'Belarus',
                        'value': 'by'
                    },
                    {
                        'label': 'Belize',
                        'value': 'bz'
                    },
                    {
                        'label': 'Canada',
                        'value': 'ca'
                    },
                    {
                        'label': 'Democratic Republic of the Congo',
                        'value': 'cg'
                    },
                    {
                        'label': 'Switzerland',
                        'value': 'ch'
                    },
                    {
                        'label': 'Chile',
                        'value': 'cl'
                    },
                    {
                        'label': 'China',
                        'value': 'cn'
                    },
                    {
                        'label': 'Colombia',
                        'value': 'co'
                    },
                    {
                        'label': 'Costa Rica',
                        'value': 'cr'
                    },
                    {
                        'label': 'Cape Verde',
                        'value': 'cv'
                    },
                    {
                        'label': 'Cyprus',
                        'value': 'cy'
                    },
                    {
                        'label': 'Czech Republic',
                        'value': 'cz'
                    },
                    {
                        'label': 'Germany',
                        'value': 'de'
                    },
                    {
                        'label': 'Denmark',
                        'value': 'dk'
                    },
                    {
                        'label': 'Dominica',
                        'value': 'dm'
                    },
                    {
                        'label': 'Dominican Republic',
                        'value': 'do'
                    },
                    {
                        'label': 'Algeria',
                        'value': 'dz'
                    },
                    {
                        'label': 'Ecuador',
                        'value': 'ec'
                    },
                    {
                        'label': 'Estonia',
                        'value': 'ee'
                    },
                    {
                        'label': 'Egypt',
                        'value': 'eg'
                    },
                    {
                        'label': 'Spain',
                        'value': 'es'
                    },
                    {
                        'label': 'Finland',
                        'value': 'fi'
                    },
                    {
                        'label': 'Fiji',
                        'value': 'fj'
                    },
                    {
                        'label': 'Federated States of Micronesia',
                        'value': 'fm'
                    },
                    {
                        'label': 'France',
                        'value': 'fr'
                    },
                    {
                        'label': 'Grenada',
                        'value': 'gd'
                    },
                    {
                        'label': 'Ghana',
                        'value': 'gh'
                    },
                    {
                        'label': 'Gambia',
                        'value': 'gm'
                    },
                    {
                        'label': 'Greece',
                        'value': 'gr'
                    },
                    {
                        'label': 'Guatemala',
                        'value': 'gt'
                    },
                    {
                        'label': 'Guinea Bissau',
                        'value': 'gw'
                    },
                    {
                        'label': 'Guyana',
                        'value': 'gy'
                    },
                    {
                        'label': 'Hong Kong',
                        'value': 'hk'
                    },
                    {
                        'label': 'Honduras',
                        'value': 'hn'
                    },
                    {
                        'label': 'Croatia',
                        'value': 'hr'
                    },
                    {
                        'label': 'Hungaria',
                        'value': 'hu'
                    },
                    {
                        'label': 'Indonesia',
                        'value': 'id'
                    },
                    {
                        'label': 'Ireland',
                        'value': 'ie'
                    },
                    {
                        'label': 'Israel',
                        'value': 'il'
                    },
                    {
                        'label': 'India',
                        'value': 'in'
                    },
                    {
                        'label': 'Iceland',
                        'value': 'is'
                    },
                    {
                        'label': 'Italy',
                        'value': 'it'
                    },
                    {
                        'label': 'Jamaica',
                        'value': 'jm'
                    },
                    {
                        'label': 'Jordan',
                        'value': 'jo'
                    },
                    {
                        'label': 'Japan',
                        'value': 'jp'
                    },
                    {
                        'label': 'Kenya',
                        'value': 'ke'
                    },
                    {
                        'label': 'Krygyzstan',
                        'value': 'kg'
                    },
                    {
                        'label': 'Cambodia',
                        'value': 'kh'
                    },
                    {
                        'label': 'Saint Kitts and Nevis',
                        'value': 'kn'
                    },
                    {
                        'label': 'South Korea',
                        'value': 'kr'
                    },
                    {
                        'label': 'Kuwait',
                        'value': 'kw'
                    },
                    {
                        'label': 'Cayman Islands',
                        'value': 'ky'
                    },
                    {
                        'label': 'Kazakhstan',
                        'value': 'kz'
                    },
                    {
                        'label': 'Laos',
                        'value': 'la'
                    },
                    {
                        'label': 'Lebanon',
                        'value': 'lb'
                    },
                    {
                        'label': 'Saint Lucia',
                        'value': 'lc'
                    },
                    {
                        'label': 'Sri Lanka',
                        'value': 'lk'
                    },
                    {
                        'label': 'Liberia',
                        'value': 'lr'
                    },
                    {
                        'label': 'Lithuania',
                        'value': 'lt'
                    },
                    {
                        'label': 'Luxembourg',
                        'value': 'lu'
                    },
                    {
                        'label': 'Latvia',
                        'value': 'lv'
                    },
                    {
                        'label': 'Moldova',
                        'value': 'md'
                    },
                    {
                        'label': 'Madagascar',
                        'value': 'mg'
                    },
                    {
                        'label': 'Macedonia',
                        'value': 'mk'
                    },
                    {
                        'label': 'Mali',
                        'value': 'ml'
                    },
                    {
                        'label': 'Mongolia',
                        'value': 'mn'
                    },
                    {
                        'label': 'Macau',
                        'value': 'mo'
                    },
                    {
                        'label': 'Mauritania',
                        'value': 'mr'
                    },
                    {
                        'label': 'Montserrat',
                        'value': 'ms'
                    },
                    {
                        'label': 'Malta',
                        'value': 'mt'
                    },
                    {
                        'label': 'Mauritius',
                        'value': 'mu'
                    },
                    {
                        'label': 'Malawi',
                        'value': 'mw'
                    },
                    {
                        'label': 'Mexico',
                        'value': 'mx'
                    },
                    {
                        'label': 'Malaysia',
                        'value': 'my'
                    },
                    {
                        'label': 'Mozambique',
                        'value': 'mz'
                    },
                    {
                        'label': 'Namibia',
                        'value': 'na'
                    },
                    {
                        'label': 'Niger',
                        'value': 'ne'
                    },
                    {
                        'label': 'Nigeria',
                        'value': 'ng'
                    },
                    {
                        'label': 'Nicaragua',
                        'value': 'ni'
                    },
                    {
                        'label': 'Netherlands',
                        'value': 'nl'
                    },
                    {
                        'label': 'Nepal',
                        'value': 'np'
                    },
                    {
                        'label': 'Norway',
                        'value': 'no'
                    },
                    {
                        'label': 'New Zealand',
                        'value': 'nz'
                    },
                    {
                        'label': 'Oman',
                        'value': 'om'
                    },
                    {
                        'label': 'Panama',
                        'value': 'pa'
                    },
                    {
                        'label': 'Peru',
                        'value': 'pe'
                    },
                    {
                        'label': 'Papua New Guinea',
                        'value': 'pg'
                    },
                    {
                        'label': 'Philippines',
                        'value': 'ph'
                    },
                    {
                        'label': 'Pakistan',
                        'value': 'pk'
                    },
                    {
                        'label': 'Poland',
                        'value': 'pl'
                    },
                    {
                        'label': 'Portugal',
                        'value': 'pt'
                    },
                    {
                        'label': 'Palau',
                        'value': 'pw'
                    },
                    {
                        'label': 'Paraguay',
                        'value': 'py'
                    },
                    {
                        'label': 'Qatar',
                        'value': 'qa'
                    },
                    {
                        'label': 'Romania',
                        'value': 'ro'
                    },
                    {
                        'label': 'Russia',
                        'value': 'ru'
                    },
                    {
                        'label': 'Saudi Arabia',
                        'value': 'sa'
                    },
                    {
                        'label': 'Soloman Islands',
                        'value': 'sb'
                    },
                    {
                        'label': 'Seychelles',
                        'value': 'sc'
                    },
                    {
                        'label': 'Sweden',
                        'value': 'se'
                    },
                    {
                        'label': 'Singapore',
                        'value': 'sg'
                    },
                    {
                        'label': 'Slovenia',
                        'value': 'si'
                    },
                    {
                        'label': 'Slovakia',
                        'value': 'sk'
                    },
                    {
                        'label': 'Sierra Leone',
                        'value': 'sl'
                    },
                    {
                        'label': 'Senegal',
                        'value': 'sn'
                    },
                    {
                        'label': 'Suriname',
                        'value': 'sr'
                    },
                    {
                        'label': 'Sao Tome e Principe',
                        'value': 'st'
                    },
                    {
                        'label': 'El Salvador',
                        'value': 'sv'
                    },
                    {
                        'label': 'Swaziland',
                        'value': 'sz'
                    },
                    {
                        'label': 'Turks and Caicos Islands',
                        'value': 'tc'
                    },
                    {
                        'label': 'Chad',
                        'value': 'td'
                    },
                    {
                        'label': 'Thailand',
                        'value': 'th'
                    },
                    {
                        'label': 'Tajikistan',
                        'value': 'tj'
                    },
                    {
                        'label': 'Turkmenistan',
                        'value': 'tm'
                    },
                    {
                        'label': 'Tunisia',
                        'value': 'tn'
                    },
                    {
                        'label': 'Turkey',
                        'value': 'tr'
                    },
                    {
                        'label': 'Republic of Trinidad and Tobago',
                        'value': 'tt'
                    },
                    {
                        'label': 'Taiwan',
                        'value': 'tw'
                    },
                    {
                        'label': 'Tanzania',
                        'value': 'tz'
                    },
                    {
                        'label': 'Ukraine',
                        'value': 'ua'
                    },
                    {
                        'label': 'Uganda',
                        'value': 'ug'
                    },
                    {
                        'label': 'Uruguay',
                        'value': 'uy'
                    },
                    {
                        'label': 'Uzbekistan',
                        'value': 'uz'
                    },
                    {
                        'label': 'Saint Vincent and the Grenadines',
                        'value': 'vc'
                    },
                    {
                        'label': 'Venezuela',
                        'value': 've'
                    },
                    {
                        'label': 'British Virgin Islands',
                        'value': 'vg'
                    },
                    {
                        'label': 'Vietnam',
                        'value': 'vn'
                    },
                    {
                        'label': 'Yemen',
                        'value': 'ye'
                    },
                    {
                        'label': 'South Africa',
                        'value': 'za'
                    },
                    {
                        'label': 'Zimbabwe',
                        'value': 'zw'
                    }
                ],
                'help': 'You will need to restart the application for language settings to apply.'
            },
            { // Incognito Mode
                'label': 'Incognito Mode',
                'key': 'incognitoMode',
                'type': 'checkbox',
                'options': [{
                    'label': 'Incognito Mode',
                    'value': true
                }],
                'help': `When enabled AME will hide all song details and information from all receivers. (Discord RPC, LastFM, Apple)`
            },
            { // playbackNotifications
                'label': 'Notifications on Song Change',
                'key': 'playbackNotifications',
                'type': 'dropdown',
                'options': [
                    {
                        'label': 'Enabled',
                        'value': true
                    },
                    {
                        'label': 'Enabled (Notifications when Minimized)',
                        'value': 'minimized'
                    }
                ],
                'help': 'Enabling this means you will get notifications when you change song. The minimized option forces notifications to only appear if the app is hidden / minimized.'
            },
            { // trayTooltipSongName
                'label': 'Show Song Name as Tray Icon Tooltip',
                'key': 'trayTooltipSongName',
                'type': 'checkbox',
                'options': [{
                    'label': 'Tray Icon Tooltip Song Name',
                    'value': true
                }],
                'help': 'Enabling this option allows you to see the song name in the tooltip on the taskbar when the application is minimized to the tray.'
            },
            { // startupPage
                'label': 'Load Page on Startup',
                'key': 'startupPage',
                'type': 'dropdown',
                'options': [
                    {
                        'label': 'Browse',
                        'value': 'browse'
                    },
                    {
                        'label': 'Listen Now',
                        'value': 'listen-now'
                    },
                    {
                        'label': 'Radio',
                        'value': 'radio'
                    },
                    {
                        'label': 'Recently Added',
                        'value': 'library/recently-added'
                    },
                    {
                        'label': 'Albums',
                        'value': 'library/albums'
                    },
                    {
                        'label': 'Songs',
                        'value': 'library/songs'
                    },
                    {
                        'label': 'Made for You',
                        'value': 'library/made-for-you'
                    }
                ],
                'help': 'Select what page you wish to be placed on when you start the application.'
            },
            { // Discord Rich Presence
                'heading': 'Discord Rich Presence',
                'content': `These settings are for managing how you display your status on Discord. You must have 'Display current activity as status message.' turned on in your Discord settings for the song to be shown.`,
                'type': 'message'
            },
            { // DiscordRPC Toggle
                'label': 'Display Song as Game Activity on Discord',
                'key': 'discordRPC',
                'type': 'dropdown',
                'options': [
                    {
                        'label': "Enabled (Display 'Apple Music' as title)",
                        'value': 'am-title'
                    },
                    {
                        'label': "Enabled (Display 'Apple Music Electron' as title)",
                        'value': 'ame-title'
                    }
                ],
                'help': `Display your current song as your Discord Game activity.`
            },
            { // Clear Activity on pause
                'key': 'discordClearActivityOnPause',
                'type': 'checkbox',
                'options': [{
                    'label': 'Clear Activity on Pause',
                    'value': true
                }],
                'help': `With this disabled your status will show a Pause/Play icon whenever you are playing or have a song paused. When you enable this, it is replaced with a branch icon (Nighly / Stable) and a version title when you hover.`
            },
            { // LastFM
                'heading': 'LastFM Notice',
                'content': `<p style="size='8px'">For information regarding this section, read the wiki post found <a style="color: #227bff !important" target="_blank" href='https://github.com/cryptofyre/Apple-Music-Electron/wiki/LastFM'>here</a>.</p>`,
                'type': 'message'
            },
            { // LastFM Toggle
                'key': 'lastfmEnabled',
                'type': 'checkbox',
                'options': [{
                    'label': 'Scrobble LastFM on Song Change',
                    'value': true
                }]
            },
            { // LastFM Remove Featuring Artists
                'key': 'lastfmRemoveFeaturingArtists',
                'type': 'checkbox',
                'options': [{
                    'label': 'Remove featuring artists',
                    'value': true
                }]
            },
            { // LastFM Auth Key
                'label': 'LastFM Authentication Key',
                'key': 'lastfmAuthKey',
                'type': 'text'
            },
            { // Analytics
                'label': 'Analytics',
                'key': 'analyticsEnabled',
                'type': 'checkbox',
                'options': [{
                    'label': 'Allow Crash Analytics and Error Collection.',
                    'value': true
                }],
                'help': `These logs when enabled allow us to fix bugs and errors that may occur during your listening sessions to better improve the application. We understand if your not comfortable with them on but it helps us out immensely in figuring out wide spread issues. (Note: We do not gather personal information, only stuff that shows to you as a error in the code.)`
            },
        ]
        fields.visual = [
            { // Setting Your Theme
                'label': 'Themes:',
                'key': 'theme',
                'type': 'dropdown',
                'options': [{
                    'label': 'Default',
                    'value': 'default'
                },],
                'help': 'You will need to restart the application in order for the default themes to be populated.'
            },
            {
                'content': '<p>You can preview all the themes <a style="color: #227bff !important" target="_blank" href="https://github.com/cryptofyre/Apple-Music-Electron/wiki/Theme-Preview-Images">here</a>.</p>',
                'type': 'message'
            },
            { // Window Frame
                'label': 'Application Frame',
                'key': 'frameType',
                'type': 'dropdown',
                'options': [
                    {
                        'label': 'macOS Emulation (Right)',
                        'value': 'mac-right'
                    },
                    {
                        'label': 'macOS Emulation',
                        'value': 'mac'
                    }
                ],
                'help': "macOS Emulation shows the 'stoplights' that are well known for all mac users and adjusts other UI elements to resemble the macOS Music App. Selecting the right option shows a more Windows-like representation with the stoplights replacing the usual close, minimize and maximize buttons. For mac users its suggested that you disable this for the best experience. Having this disabled will make the application use the operating system's frame."
            },
            { // Transparency
                'heading': 'Transparency Configuration',
                'content': `Here you can configure the transparency options for the window. Transparency only works on certain systems, so read the descriptions of each setting. It is not advised to use transparency on platforms other than Windows or macOS. It is also highly recommended that you enable macOS Music Emulation as the default frame with transparency is not polished.`,
                'type': 'message'
            },
            { // Turning on Transparency and settings the effect
                'label': 'Transparency Effect',
                'key': 'transparencyEffect',
                'type': 'dropdown',
                'options': [
                    {
                        'label': 'Acrylic (W10 1809+)',
                        'value': 'acrylic'
                    },
                    {
                        'label': 'Blur Behind',
                        'value': 'blur'
                    }
                ],
                'help': `Sets the type of Windows transparency effect, either 'acrylic', 'blur' or leave it empty to disable it. Changing the transparency blur type can improve performance and compatibility with older hardware and systems.`
            },
            { // Transparency Theme
                'label': 'Transparency Theme',
                'key': 'transparencyTheme',
                'type': 'text',
                'help': `Sets color of acrylic effect. Can be 'light', 'dark', 'appearance-based' or a hex color code with alpha ('#0f0f0f00').`
            },
            { // Transparency on Application Focus
                'label': 'Disable Transparency when Unfocused (Acrylic Only)',
                'key': 'transparencyDisableBlur',
                'type': 'checkbox',
                'options': [{
                    'label': `Acrylic effect will be disabled when the window loses focus`,
                    'value': true
                }],
                'help': 'If enabled, acrylic effect will be disabled when the window loses focus, to mimic the behaviour of normal UWP apps.'
            },
            { // Custom Refresh Rate
                'label': 'Use Custom Window Refresh Rate',
                'key': 'transparencyMaximumRefreshRate',
                'type': 'dropdown',
                'options': [
                    {
                        'label': '30',
                        'value': 30
                    },
                    {
                        'label': '60',
                        'value': 60
                    },
                    {
                        'label': '144',
                        'value': 144
                    },
                    {
                        'label': '175',
                        'value': 175
                    },
                    {
                        'label': '240',
                        'value': 240
                    },
                    {
                        'label': '360',
                        'value': 360
                    },
                ],
                'help': 'Use custom window resize/move handler for performance. You can set the maximum refresh rate that the application uses.'
            },
            { // Miscellaneous
                'heading': 'Miscellaneous Options',
                'content': `Various options allowing you to adjust the user interface to your preference.`,
                'type': 'message'
            },
            { // Streaming Mode
                'label': 'Streaming Mode',
                'key': 'streamerMode',
                'type': 'checkbox',
                'options': [{
                    'label': 'Removes certain UI elements and has unique scaling properties.',
                    'value': true
                }]
            },
            { // Remove Upsell
                'label': 'Remove Upsell',
                'key': 'removeUpsell',
                'type': 'checkbox',
                'options': [{
                    'label': 'Removes the Open in iTunes and Exit Beta Buttons.',
                    'value': true
                }]
            },
            { // Remove Upsell
                'label': 'Remove Apple Music Logo',
                'key': 'removeAppleLogo',
                'type': 'checkbox',
                'options': [{
                    'label': 'Removes the Apple Music Logo and moves search bar up.',
                    'value': true
                }]
            },
            { // Remove Footer
                'label': 'Remove Footer',
                'key': 'removeFooter',
                'type': 'checkbox',
                'options': [{
                    'label': 'Removes the Apple Music footer.',
                    'value': true
                }]
            },
            { // OS Accent
                'label': 'Use OS Accent as Application Accent',
                'key': 'useOperatingSystemAccent',
                'type': 'checkbox',
                'options': [{
                    'label': "Force the application to use your operating systems' accent",
                    'value': true
                }]
            },
            { // Musixmatch Lyrics
                'label': 'Enable Musixmatch Lyrics',
                'key': 'mxmon',
                'type': 'checkbox',
                'options': [{
                    'label': "Enable Musixmatch Lyrics (less stable but better lyrics detection)",
                    'value': true
                }]
            },
            { // Language
                'label': 'Lyrics translation language',
                'key': 'mxmlanguage',
                'type': 'dropdown',
                'options': [
                {'label':"Disabled",'value':"disabled"},
                {'label':"Abkhazian",'value':"ab"},
                {'label':"Afar",'value':"aa"},
                {'label':"Afrikaans",'value':"af"},
                {'label':"Akan",'value':"ak"},
                {'label':"Albanian",'value':"sq"},
                {'label':"Amharic",'value':"am"},
                {'label':"Arabic",'value':"ar"},
                {'label':"Aragonese",'value':"an"},
                {'label':"Armenian",'value':"hy"},
                {'label':"Assamese",'value':"as"},
                {'label':"Assamese-romaji",'value':"a5"},
                {'label':"Asturian",'value':"a3"},
                {'label':"Avaric",'value':"av"},
                {'label':"Avestan",'value':"ae"},
                {'label':"Aymara",'value':"ay"},
                {'label':"Azerbaijani",'value':"az"},
                {'label':"Bambara",'value':"bm"},
                {'label':"Bashkir",'value':"ba"},
                {'label':"Basque",'value':"eu"},
                {'label':"Bavarian",'value':"b1"},
                {'label':"Belarusian",'value':"be"},
                {'label':"Bengali",'value':"bn"},
                {'label':"Bengali-romaji",'value':"b5"},
                {'label':"Bihari languages",'value':"bh"},
                {'label':"Bishnupriya",'value':"b3"},
                {'label':"Bislama",'value':"bi"},
                {'label':"Bosnian",'value':"bs"},
                {'label':"Breton",'value':"br"},
                {'label':"Bulgarian",'value':"bg"},
                {'label':"Burmese",'value':"my"},
                {'label':"Catalan",'value':"ca"},
                {'label':"Cebuano",'value':"c2"},
                {'label':"Central bikol",'value':"b2"},
                {'label':"Central kurdish",'value':"c3"},
                {'label':"Chamorro",'value':"ch"},
                {'label':"Chavacano",'value':"c1"},
                {'label':"Chechen",'value':"ce"},
                {'label':"Chichewa",'value':"ny"},
                {'label':"Chinese (simplified)",'value':"zh"},
                {'label':"Chinese (traditional)",'value':"z1"},
                {'label':"Chinese-romaji",'value':"rz"},
                {'label':"Church slavic",'value':"cu"},
                {'label':"Chuvash",'value':"cv"},
                {'label':"Cornish",'value':"kw"},
                {'label':"Corsican",'value':"co"},
                {'label':"Cree",'value':"cr"},
                {'label':"Creoles and pidgins",'value':"c4"},
                {'label':"Creoles and pidgins, english based",'value':"c5"},
                {'label':"Creoles and pidgins, french-based",'value':"c6"},
                {'label':"Creoles and pidgins, portuguese-based",'value':"c7"},
                {'label':"Croatian",'value':"hr"},
                {'label':"Czech",'value':"cs"},
                {'label':"Danish",'value':"da"},
                {'label':"Dimli (individual language)",'value':"d1"},
                {'label':"Divehi",'value':"dv"},
                {'label':"Dotyali",'value':"d3"},
                {'label':"Dutch",'value':"nl"},
                {'label':"Dzongkha",'value':"dz"},
                {'label':"Eastern mari",'value':"m2"},
                {'label':"Egyptian arabic",'value':"a2"},
                {'label':"Emilian-romagnol",'value':"e1"},
                {'label':"English",'value':"en"},
                {'label':"Erzya",'value':"m6"},
                {'label':"Esperanto",'value':"eo"},
                {'label':"Estonian",'value':"et"},
                {'label':"Ewe",'value':"ee"},
                {'label':"Faroese",'value':"fo"},
                {'label':"Fiji hindi",'value':"h1"},
                {'label':"Fijian",'value':"fj"},
                {'label':"Filipino",'value':"f1"},
                {'label':"Finnish",'value':"fi"},
                {'label':"French",'value':"fr"},
                {'label':"Frisian, northern",'value':"f2"},
                {'label':"Frisian, western",'value':"fy"},
                {'label':"Fulah",'value':"ff"},
                {'label':"Galician",'value':"gl"},
                {'label':"Ganda",'value':"lg"},
                {'label':"Georgian",'value':"ka"},
                {'label':"German",'value':"de"},
                {'label':"German, low",'value':"n2"},
                {'label':"Goan konkani",'value':"g1"},
                {'label':"Greek",'value':"el"},
                {'label':"Greek-romaji",'value':"e2"},
                {'label':"Greenlandic",'value':"kl"},
                {'label':"Guarani",'value':"gn"},
                {'label':"Gujarati",'value':"gu"},
                {'label':"Gujarati-romaji",'value':"g2"},
                {'label':"Haitian creole",'value':"ht"},
                {'label':"Hausa",'value':"ha"},
                {'label':"Hebrew",'value':"he"},
                {'label':"Herero",'value':"hz"},
                {'label':"Hindi",'value':"hi"},
                {'label':"Hindi-romaji",'value':"h3"},
                {'label':"Hiri motu",'value':"ho"},
                {'label':"Hungarian",'value':"hu"},
                {'label':"Icelandic",'value':"is"},
                {'label':"Ido",'value':"io"},
                {'label':"Igbo",'value':"ig"},
                {'label':"Iloko",'value':"i1"},
                {'label':"Indonesian",'value':"id"},
                {'label':"Interlingua",'value':"ia"},
                {'label':"Interlingue",'value':"ie"},
                {'label':"Inuktitut",'value':"iu"},
                {'label':"Inupiaq",'value':"ik"},
                {'label':"Irish",'value':"ga"},
                {'label':"Italian",'value':"it"},
                {'label':"Japanese",'value':"ja"},
                {'label':"Japanese-romaji",'value':"rj"},
                {'label':"Javanese",'value':"jv"},
                {'label':"Kalmyk",'value':"x1"},
                {'label':"Kannada",'value':"kn"},
                {'label':"Kannada-romaji",'value':"k2"},
                {'label':"Kanuri",'value':"kr"},
                {'label':"Karachay-balkar",'value':"k1"},
                {'label':"Kashmiri",'value':"ks"},
                {'label':"Kazakh",'value':"kk"},
                {'label':"Khmer, central",'value':"km"},
                {'label':"Kikuyu",'value':"ki"},
                {'label':"Kinyarwanda",'value':"rw"},
                {'label':"Kirghiz",'value':"ky"},
                {'label':"Komi",'value':"kv"},
                {'label':"Kongo",'value':"kg"},
                {'label':"Korean",'value':"ko"},
                {'label':"Korean-romaji",'value':"rk"},
                {'label':"Kuanyama",'value':"kj"},
                {'label':"Kurdish",'value':"ku"},
                {'label':"Lao",'value':"lo"},
                {'label':"Latin",'value':"la"},
                {'label':"Latvian",'value':"lv"},
                {'label':"Lezghian",'value':"l1"},
                {'label':"Limburgish",'value':"li"},
                {'label':"Lingala",'value':"ln"},
                {'label':"Lithuanian",'value':"lt"},
                {'label':"Lojban",'value':"j1"},
                {'label':"Lombard",'value':"l2"},
                {'label':"Luba-katanga",'value':"lu"},
                {'label':"Luxembourgish",'value':"lb"},
                {'label':"Macedonian",'value':"mk"},
                {'label':"Maithili",'value':"m1"},
                {'label':"Malagasy",'value':"mg"},
                {'label':"Malay",'value':"ms"},
                {'label':"Malayalam",'value':"ml"},
                {'label':"Malayalam-romaji",'value':"m8"},
                {'label':"Maltese",'value':"mt"},
                {'label':"Manx",'value':"gv"},
                {'label':"Maori",'value':"mi"},
                {'label':"Marathi",'value':"mr"},
                {'label':"Marathi-romaji",'value':"m9"},
                {'label':"Marshallese",'value':"mh"},
                {'label':"Mazanderani",'value':"m7"},
                {'label':"Minangkabau",'value':"m3"},
                {'label':"Mingrelian",'value':"x2"},
                {'label':"Mirandese",'value':"m5"},
                {'label':"Moldavian",'value':"mo"},
                {'label':"Mongolian",'value':"mn"},
                {'label':"Nahuatl",'value':"n4"},
                {'label':"Nauru",'value':"na"},
                {'label':"Navajo",'value':"nv"},
                {'label':"Ndebele, north",'value':"nd"},
                {'label':"Ndebele, south",'value':"nr"},
                {'label':"Ndonga",'value':"ng"},
                {'label':"Neapolitan",'value':"n1"},
                {'label':"Nepal bhasa",'value':"n3"},
                {'label':"Nepali",'value':"ne"},
                {'label':"Nepali-romaji",'value':"n5"},
                {'label':"Northern luri",'value':"l3"},
                {'label':"Norwegian",'value':"no"},
                {'label':"Norwegian bokm\xe5l",'value':"nb"},
                {'label':"Norwegian nynorsk",'value':"nn"},
                {'label':"Occitan",'value':"oc"},
                {'label':"Ojibwa",'value':"oj"},
                {'label':"Oriya",'value':"or"},
                {'label':"Oriya-romaji",'value':"o1"},
                {'label':"Oromo",'value':"om"},
                {'label':"Ossetian",'value':"os"},
                {'label':"Pali",'value':"pi"},
                {'label':"Pampanga",'value':"p1"},
                {'label':"Panjabi",'value':"pa"},
                {'label':"Panjabi-romaji",'value':"p5"},
                {'label':"Persian",'value':"fa"},
                {'label':"Pfaelzisch",'value':"p2"},
                {'label':"Piemontese",'value':"p3"},
                {'label':"Polish",'value':"pl"},
                {'label':"Portuguese",'value':"pt"},
                {'label':"Pushto",'value':"ps"},
                {'label':"Quechua",'value':"qu"},
                {'label':"Romanian",'value':"ro"},
                {'label':"Romansh",'value':"rm"},
                {'label':"Rundi",'value':"rn"},
                {'label':"Russia buriat",'value':"b4"},
                {'label':"Russian",'value':"ru"},
                {'label':"Russian-romaji",'value':"r2"},
                {'label':"Rusyn",'value':"r1"},
                {'label':"Sami, northern",'value':"se"},
                {'label':"Samoan",'value':"sm"},
                {'label':"Sango",'value':"sg"},
                {'label':"Sanskrit",'value':"sa"},
                {'label':"Sanskrit-romaji",'value':"s4"},
                {'label':"Sardinian",'value':"sc"},
                {'label':"Scots",'value':"s3"},
                {'label':"Scottish gaelic",'value':"gd"},
                {'label':"Serbian",'value':"sr"},
                {'label':"Serbo-croatian",'value':"sh"},
                {'label':"Shona",'value':"sn"},
                {'label':"Sichuan yi",'value':"ii"},
                {'label':"Sicilian",'value':"s2"},
                {'label':"Sindhi",'value':"sd"},
                {'label':"Sinhala",'value':"si"},
                {'label':"Slovak",'value':"sk"},
                {'label':"Slovenian",'value':"sl"},
                {'label':"Somali",'value':"so"},
                {'label':"Sorbian, lower",'value':"d2"},
                {'label':"Sorbian, upper",'value':"h2"},
                {'label':"Sotho, southern",'value':"st"},
                {'label':"South azerbaijani",'value':"a4"},
                {'label':"Spanish",'value':"es"},
                {'label':"Sundanese",'value':"su"},
                {'label':"Swahili",'value':"sw"},
                {'label':"Swati",'value':"ss"},
                {'label':"Swedish",'value':"sv"},
                {'label':"Tagalog",'value':"tl"},
                {'label':"Tahitian",'value':"ty"},
                {'label':"Tajik",'value':"tg"},
                {'label':"Tamil",'value':"ta"},
                {'label':"Tamil-romaji",'value':"t2"},
                {'label':"Tatar",'value':"tt"},
                {'label':"Telugu",'value':"te"},
                {'label':"Telugu-romaji",'value':"t3"},
                {'label':"Thai",'value':"th"},
                {'label':"Thai-romaji",'value':"t4"},
                {'label':"Tibetan",'value':"bo"},
                {'label':"Tigrinya",'value':"ti"},
                {'label':"Tonga (tonga islands)",'value':"to"},
                {'label':"Tosk albanian",'value':"a1"},
                {'label':"Tsonga",'value':"ts"},
                {'label':"Tswana",'value':"tn"},
                {'label':"Turkish",'value':"tr"},
                {'label':"Turkmen",'value':"tk"},
                {'label':"Tuvinian",'value':"t1"},
                {'label':"Twi",'value':"tw"},
                {'label':"Uighur",'value':"ug"},
                {'label':"Ukrainian",'value':"uk"},
                {'label':"Urdu",'value':"ur"},
                {'label':"Urdu-romaji",'value':"u1"},
                {'label':"Uzbek",'value':"uz"},
                {'label':"Venda",'value':"ve"},
                {'label':"Venetian",'value':"v1"},
                {'label':"Veps",'value':"v2"},
                {'label':"Vietnamese",'value':"vi"},
                {'label':"Vlaams",'value':"v3"},
                {'label':"Volap\xfck",'value':"vo"},
                {'label':"Walloon",'value':"wa"},
                {'label':"Waray",'value':"w1"},
                {'label':"Welsh",'value':"cy"},
                {'label':"Western mari",'value':"m4"},
                {'label':"Western panjabi",'value':"p4"},
                {'label':"Wolof",'value':"wo"},
                {'label':"Wu chinese",'value':"w2"},
                {'label':"Xhosa",'value':"xh"},
                {'label':"Yakut",'value':"s1"},
                {'label':"Yiddish",'value':"yi"},
                {'label':"Yoruba",'value':"yo"},
                {'label':"Yue chinese",'value':"y1"},
                {'label':"Zhuang",'value':"za"},
                {'label':"Zulu",'value':"zu"}
                ],
                'help': 'You will need to restart the application for language settings to apply.'
            },

        ]
        fields.audio = [
            { // Sound Quality
                'label': 'Sound Quality',
                'key': 'audioQuality',
                'type': 'dropdown',
                'options': [
                    {
                        'label': 'Automatic (Default)',
                        'value': 'auto'
                    },
                    {
                        'label': 'Extreme (990kbps)',
                        'value': 'extreme'
                    },
                    {
                        'label': 'High (256kbps)',
                        'value': 'high'
                    },
                    {
                        'label': 'Standard (64kbps)',
                        'value': 'standard'
                    }
                ],
                'help': `Allows the user to select a preferred audio bitrate for music playback. NOTE: This may not work on all songs. Extreme mode can have the side effects of high CPU Usage.`
            },
            { // Gapless Playback
                'key': 'gaplessEnabled',
                'type': 'checkbox',
                'options': [{
                    'label': 'Gapless Playback',
                    'value': true
                }],
                'help': `Reduces or completely removes the delay between songs providing a smooth audio experience.`
            }
        ]
        fields.window = [
            { // Open Apple Music on Startup
                'label': 'Open Apple Music automatically after login',
                'key': 'appStartupBehavior',
                'type': 'dropdown',
                'options': [
                    {
                        'label': 'Enabled',
                        'value': 'true'
                    },
                    {
                        'label': 'Enabled (Application is Hidden)',
                        'value': 'hidden'
                    },
                    {
                        'label': 'Enabled (Application is Minimized)',
                        'value': 'minimized'
                    }
                ]
            },
            { // Turning on closeButtonMinimize
                'key': 'closeButtonMinimize',
                'type': 'checkbox',
                'options': [{
                    'label': 'Close button should minimize Apple Music',
                    'value': true
                }]
            }
        ]
        fields.advanced = [
            {
                'content': "<p>Do not mess with these options unless you know what you're doing.</p>",
                'type': 'message'
            },
            { // Turning on forceApplicationRegion
                'label': 'Force Application Region',
                'key': 'forceApplicationRegion',
                'type': 'dropdown',
                'options': [
                    {
                        'label': 'United Arab Emirates',
                        'value': 'ae'
                    },
                    {
                        'label': 'Antigua and Barbuda',
                        'value': 'ag'
                    },
                    {
                        'label': 'Anguilla',
                        'value': 'ai'
                    },
                    {
                        'label': 'Albania',
                        'value': 'al'
                    },
                    {
                        'label': 'Armenia',
                        'value': 'am'
                    },
                    {
                        'label': 'Angola',
                        'value': 'ao'
                    },
                    {
                        'label': 'Argentina',
                        'value': 'ar'
                    },
                    {
                        'label': 'Austria',
                        'value': 'at'
                    },
                    {
                        'label': 'Australia',
                        'value': 'au'
                    },
                    {
                        'label': 'Azerbaijan',
                        'value': 'az'
                    },
                    {
                        'label': 'Barbados',
                        'value': 'bb'
                    },
                    {
                        'label': 'Belgium',
                        'value': 'be'
                    },
                    {
                        'label': 'Burkina-Faso',
                        'value': 'bf'
                    },
                    {
                        'label': 'Bulgaria',
                        'value': 'bg'
                    },
                    {
                        'label': 'Bahrain',
                        'value': 'bh'
                    },
                    {
                        'label': 'Benin',
                        'value': 'bj'
                    },
                    {
                        'label': 'Bermuda',
                        'value': 'bm'
                    },
                    {
                        'label': 'Brunei Darussalam',
                        'value': 'bn'
                    },
                    {
                        'label': 'Bolivia',
                        'value': 'bo'
                    },
                    {
                        'label': 'Brazil',
                        'value': 'br'
                    },
                    {
                        'label': 'Bahamas',
                        'value': 'bs'
                    },
                    {
                        'label': 'Bhutan',
                        'value': 'bt'
                    },
                    {
                        'label': 'Botswana',
                        'value': 'bw'
                    },
                    {
                        'label': 'Belarus',
                        'value': 'by'
                    },
                    {
                        'label': 'Belize',
                        'value': 'bz'
                    },
                    {
                        'label': 'Canada',
                        'value': 'ca'
                    },
                    {
                        'label': 'Democratic Republic of the Congo',
                        'value': 'cg'
                    },
                    {
                        'label': 'Switzerland',
                        'value': 'ch'
                    },
                    {
                        'label': 'Chile',
                        'value': 'cl'
                    },
                    {
                        'label': 'China',
                        'value': 'cn'
                    },
                    {
                        'label': 'Colombia',
                        'value': 'co'
                    },
                    {
                        'label': 'Costa Rica',
                        'value': 'cr'
                    },
                    {
                        'label': 'Cape Verde',
                        'value': 'cv'
                    },
                    {
                        'label': 'Cyprus',
                        'value': 'cy'
                    },
                    {
                        'label': 'Czech Republic',
                        'value': 'cz'
                    },
                    {
                        'label': 'Germany',
                        'value': 'de'
                    },
                    {
                        'label': 'Denmark',
                        'value': 'dk'
                    },
                    {
                        'label': 'Dominica',
                        'value': 'dm'
                    },
                    {
                        'label': 'Dominican Republic',
                        'value': 'do'
                    },
                    {
                        'label': 'Algeria',
                        'value': 'dz'
                    },
                    {
                        'label': 'Ecuador',
                        'value': 'ec'
                    },
                    {
                        'label': 'Estonia',
                        'value': 'ee'
                    },
                    {
                        'label': 'Egypt',
                        'value': 'eg'
                    },
                    {
                        'label': 'Spain',
                        'value': 'es'
                    },
                    {
                        'label': 'Finland',
                        'value': 'fi'
                    },
                    {
                        'label': 'Fiji',
                        'value': 'fj'
                    },
                    {
                        'label': 'Federated States of Micronesia',
                        'value': 'fm'
                    },
                    {
                        'label': 'France',
                        'value': 'fr'
                    },
                    {
                        'label': 'Grenada',
                        'value': 'gd'
                    },
                    {
                        'label': 'Ghana',
                        'value': 'gh'
                    },
                    {
                        'label': 'Gambia',
                        'value': 'gm'
                    },
                    {
                        'label': 'Greece',
                        'value': 'gr'
                    },
                    {
                        'label': 'Guatemala',
                        'value': 'gt'
                    },
                    {
                        'label': 'Guinea Bissau',
                        'value': 'gw'
                    },
                    {
                        'label': 'Guyana',
                        'value': 'gy'
                    },
                    {
                        'label': 'Hong Kong',
                        'value': 'hk'
                    },
                    {
                        'label': 'Honduras',
                        'value': 'hn'
                    },
                    {
                        'label': 'Croatia',
                        'value': 'hr'
                    },
                    {
                        'label': 'Hungaria',
                        'value': 'hu'
                    },
                    {
                        'label': 'Indonesia',
                        'value': 'id'
                    },
                    {
                        'label': 'Ireland',
                        'value': 'ie'
                    },
                    {
                        'label': 'Israel',
                        'value': 'il'
                    },
                    {
                        'label': 'India',
                        'value': 'in'
                    },
                    {
                        'label': 'Iceland',
                        'value': 'is'
                    },
                    {
                        'label': 'Italy',
                        'value': 'it'
                    },
                    {
                        'label': 'Jamaica',
                        'value': 'jm'
                    },
                    {
                        'label': 'Jordan',
                        'value': 'jo'
                    },
                    {
                        'label': 'Japan',
                        'value': 'jp'
                    },
                    {
                        'label': 'Kenya',
                        'value': 'ke'
                    },
                    {
                        'label': 'Krygyzstan',
                        'value': 'kg'
                    },
                    {
                        'label': 'Cambodia',
                        'value': 'kh'
                    },
                    {
                        'label': 'Saint Kitts and Nevis',
                        'value': 'kn'
                    },
                    {
                        'label': 'South Korea',
                        'value': 'kr'
                    },
                    {
                        'label': 'Kuwait',
                        'value': 'kw'
                    },
                    {
                        'label': 'Cayman Islands',
                        'value': 'ky'
                    },
                    {
                        'label': 'Kazakhstan',
                        'value': 'kz'
                    },
                    {
                        'label': 'Laos',
                        'value': 'la'
                    },
                    {
                        'label': 'Lebanon',
                        'value': 'lb'
                    },
                    {
                        'label': 'Saint Lucia',
                        'value': 'lc'
                    },
                    {
                        'label': 'Sri Lanka',
                        'value': 'lk'
                    },
                    {
                        'label': 'Liberia',
                        'value': 'lr'
                    },
                    {
                        'label': 'Lithuania',
                        'value': 'lt'
                    },
                    {
                        'label': 'Luxembourg',
                        'value': 'lu'
                    },
                    {
                        'label': 'Latvia',
                        'value': 'lv'
                    },
                    {
                        'label': 'Moldova',
                        'value': 'md'
                    },
                    {
                        'label': 'Madagascar',
                        'value': 'mg'
                    },
                    {
                        'label': 'Macedonia',
                        'value': 'mk'
                    },
                    {
                        'label': 'Mali',
                        'value': 'ml'
                    },
                    {
                        'label': 'Mongolia',
                        'value': 'mn'
                    },
                    {
                        'label': 'Macau',
                        'value': 'mo'
                    },
                    {
                        'label': 'Mauritania',
                        'value': 'mr'
                    },
                    {
                        'label': 'Montserrat',
                        'value': 'ms'
                    },
                    {
                        'label': 'Malta',
                        'value': 'mt'
                    },
                    {
                        'label': 'Mauritius',
                        'value': 'mu'
                    },
                    {
                        'label': 'Malawi',
                        'value': 'mw'
                    },
                    {
                        'label': 'Mexico',
                        'value': 'mx'
                    },
                    {
                        'label': 'Malaysia',
                        'value': 'my'
                    },
                    {
                        'label': 'Mozambique',
                        'value': 'mz'
                    },
                    {
                        'label': 'Namibia',
                        'value': 'na'
                    },
                    {
                        'label': 'Niger',
                        'value': 'ne'
                    },
                    {
                        'label': 'Nigeria',
                        'value': 'ng'
                    },
                    {
                        'label': 'Nicaragua',
                        'value': 'ni'
                    },
                    {
                        'label': 'Netherlands',
                        'value': 'nl'
                    },
                    {
                        'label': 'Nepal',
                        'value': 'np'
                    },
                    {
                        'label': 'Norway',
                        'value': 'no'
                    },
                    {
                        'label': 'New Zealand',
                        'value': 'nz'
                    },
                    {
                        'label': 'Oman',
                        'value': 'om'
                    },
                    {
                        'label': 'Panama',
                        'value': 'pa'
                    },
                    {
                        'label': 'Peru',
                        'value': 'pe'
                    },
                    {
                        'label': 'Papua New Guinea',
                        'value': 'pg'
                    },
                    {
                        'label': 'Philippines',
                        'value': 'ph'
                    },
                    {
                        'label': 'Pakistan',
                        'value': 'pk'
                    },
                    {
                        'label': 'Poland',
                        'value': 'pl'
                    },
                    {
                        'label': 'Portugal',
                        'value': 'pt'
                    },
                    {
                        'label': 'Palau',
                        'value': 'pw'
                    },
                    {
                        'label': 'Paraguay',
                        'value': 'py'
                    },
                    {
                        'label': 'Qatar',
                        'value': 'qa'
                    },
                    {
                        'label': 'Romania',
                        'value': 'ro'
                    },
                    {
                        'label': 'Russia',
                        'value': 'ru'
                    },
                    {
                        'label': 'Saudi Arabia',
                        'value': 'sa'
                    },
                    {
                        'label': 'Soloman Islands',
                        'value': 'sb'
                    },
                    {
                        'label': 'Seychelles',
                        'value': 'sc'
                    },
                    {
                        'label': 'Sweden',
                        'value': 'se'
                    },
                    {
                        'label': 'Singapore',
                        'value': 'sg'
                    },
                    {
                        'label': 'Slovenia',
                        'value': 'si'
                    },
                    {
                        'label': 'Slovakia',
                        'value': 'sk'
                    },
                    {
                        'label': 'Sierra Leone',
                        'value': 'sl'
                    },
                    {
                        'label': 'Senegal',
                        'value': 'sn'
                    },
                    {
                        'label': 'Suriname',
                        'value': 'sr'
                    },
                    {
                        'label': 'Sao Tome e Principe',
                        'value': 'st'
                    },
                    {
                        'label': 'El Salvador',
                        'value': 'sv'
                    },
                    {
                        'label': 'Swaziland',
                        'value': 'sz'
                    },
                    {
                        'label': 'Turks and Caicos Islands',
                        'value': 'tc'
                    },
                    {
                        'label': 'Chad',
                        'value': 'td'
                    },
                    {
                        'label': 'Thailand',
                        'value': 'th'
                    },
                    {
                        'label': 'Tajikistan',
                        'value': 'tj'
                    },
                    {
                        'label': 'Turkmenistan',
                        'value': 'tm'
                    },
                    {
                        'label': 'Tunisia',
                        'value': 'tn'
                    },
                    {
                        'label': 'Turkey',
                        'value': 'tr'
                    },
                    {
                        'label': 'Republic of Trinidad and Tobago',
                        'value': 'tt'
                    },
                    {
                        'label': 'Taiwan',
                        'value': 'tw'
                    },
                    {
                        'label': 'Tanzania',
                        'value': 'tz'
                    },
                    {
                        'label': 'Ukraine',
                        'value': 'ua'
                    },
                    {
                        'label': 'Uganda',
                        'value': 'ug'
                    },
                    {
                        'label': 'United States of America',
                        'value': 'us'
                    },
                    {
                        'label': 'United Kingdom',
                        'value': 'gb'
                    },
                    {
                        'label': 'Uruguay',
                        'value': 'uy'
                    },
                    {
                        'label': 'Uzbekistan',
                        'value': 'uz'
                    },
                    {
                        'label': 'Saint Vincent and the Grenadines',
                        'value': 'vc'
                    },
                    {
                        'label': 'Venezuela',
                        'value': 've'
                    },
                    {
                        'label': 'British Virgin Islands',
                        'value': 'vg'
                    },
                    {
                        'label': 'Vietnam',
                        'value': 'vn'
                    },
                    {
                        'label': 'Yemen',
                        'value': 'ye'
                    },
                    {
                        'label': 'South Africa',
                        'value': 'za'
                    },
                    {
                        'label': 'Zimbabwe',
                        'value': 'zw'
                    }
                ],
                'help': 'WARNING: This can cause unexpected side affects. This is not advised. On most cases, the webapp will force you to your Apple ID Region or Region based on IP.'
            },
            { // Forcing Application Mode / Theme
                'label': 'Force Application Theme',
                'key': 'forceApplicationMode',
                'type': 'dropdown',
                'options': [
                    {
                        'label': 'System (default)',
                        'value': 'system'
                    },
                    {
                        'label': 'Dark',
                        'value': 'dark'
                    },
                    {
                        'label': 'Light',
                        'value': 'light'
                    },

                ],
                'help': 'If you want the application to be in a mode that your system is not using by default.'
            },
            { // Verbose Logging
                'key': 'verboseLogging',
                'type': 'checkbox',
                'options': [{
                    'label': 'verboseLogging',
                    'value': true
                }],
                'help': 'This toggle enables more advanced logging for debugging purposes.'
            },
            {
                'key': 'alwaysOnTop',
                'type': 'checkbox',
                'options': [{
                    'label': 'alwaysOnTop',
                    'value': true
                }]
            },
            { // Turning on autoUpdaterBetaBuilds
                'key': 'autoUpdaterBetaBuilds',
                'type': 'checkbox',
                'options': [{
                    'label': 'autoUpdaterBetaBuilds',
                    'value': true
                }],
                'help': 'Turn this on if you want to live on the bleeding edge and get auto updates from the pre-release branch on GitHub.'
            },
            { // Turning on useBeta
                'key': 'useBetaSite',
                'type': 'checkbox',
                'options': [{
                    'label': 'useBetaSite',
                    'value': true
                }],
                'help': 'This maks the application use beta.music.apple.com instead of music.apple.com.'
            },
            { // Turning on preventMediaKeyHijacking
                'key': 'preventMediaKeyHijacking',
                'type': 'checkbox',
                'options': [{
                    'label': 'preventMediaKeyHijacking',
                    'value': true
                }]
            },
            { // Visual Advanced
                'heading': 'Visual Advanced',
                'content': `These are advanced features that may ruin the look of the application if you change them.`,
                'type': 'message'
            },
            { // Turning on menuBarVisible
                'key': 'menuBarVisible',
                'type': 'checkbox',
                'options': [{
                    'label': 'menuBarVisible',
                    'value': true
                }]
            },
            { // Turning on removeScrollbars
                'key': 'removeScrollbars',
                'type': 'checkbox',
                'options': [{
                    'label': 'removeScrollbars',
                    'value': true
                }]
            },
            { // Development Tools
                'heading': 'Development Tools',
                'content': `The following options are made for development of the application and/or themes.`,
                'type': 'message'
            },
            { // Turning on devTools
                'key': 'devTools',
                'type': 'checkbox',
                'options': [{
                    'label': 'devTools',
                    'value': true
                }],
                'help': 'This allows users to access the chrome developer tools. Find more information at https://developer.chrome.com/docs/devtools/'
            },
            { // Turning on devTools
                'key': 'devToolsOpenDetached',
                'type': 'checkbox',
                'options': [{
                    'label': 'devToolsOpenDetached',
                    'value': true
                }],
                'help': 'This allows users to access the chrome developer tools. Find more information at https://developer.chrome.com/docs/devtools/'
            },
            { // Turning on allowMultipleInstances
                'key': 'allowMultipleInstances',
                'type': 'checkbox',
                'options': [{
                    'label': 'allowMultipleInstances',
                    'value': true
                }]
            },
            {
                'key': 'allowOldMenuAccess',
                'type': 'checkbox',
                'options': [{
                    'label': 'allowOldMenuAccess',
                    'value': true
                }]
            }
        ]

        function RemoveDP(x) {
            return x.replace(/\./g, "").replace(',', '.');
        }

        const AcrylicSupported = ((!(!os.type().includes('Windows') || parseFloat(RemoveDP(os.release())) <= parseFloat(RemoveDP('10.0.17763')))));

        // Remove the Transparency Option for Acrylic if it is not supported
        if (!AcrylicSupported) {
            for (const key in fields.visual) {
                if (fields.visual[key].key === 'transparencyEffect') {
                    fields.visual[key].options.shift()
                }
                if (fields.visual[key].key === 'transparencyDisableBlur') {
                    fields.visual[key] = {}
                }
            }
        }

        // Set the Theme List based on css files in themes directory
        app.userThemesPath = resolve(app.getPath('userData'), 'themes');
        app.userPluginsPath = resolve(app.getPath('userData'), 'plugins');
        let themesFileNames = [];

        if (fs.existsSync(app.userThemesPath)) {
            fs.readdirSync(app.userThemesPath).forEach((value) => {
                if (value.split('.').pop() === 'css') {
                    themesFileNames.push(value.split('.').shift())
                }
            })
        }

        // Get the Info
        themesFileNames.forEach((themeFileName) => {
            const themeName = themes.fetchThemeName(themeFileName)
            if (!themeName) return;
            fields.visual[0].options.push({
                'label': themeName,
                'value': themeFileName
            },)
        })

        const ElectronPreferences = require("electron-preferences");
        app.preferences = new ElectronPreferences({
            'dataStore': resolve(app.getPath('userData'), 'preferences.json'),
            /* Default Values */
            'defaults': fields.default,
            /* Settings Menu */
            'sections': [{
                'id': 'general',
                'label': 'General Settings',
                'icon': 'settings-gear-63',
                'form': {
                    'groups': [{
                        'label': 'General Settings',
                        'fields': fields.general
                    }]
                }
            },
                {
                    'id': 'visual',
                    'label': 'Visual Settings',
                    'icon': 'eye-19',
                    'form': {
                        'groups': [{
                            'label': 'Visual Settings',
                            'fields': fields.visual
                        }]
                    }
                },
                {
                    'id': 'audio',
                    'label': 'Audio Settings',
                    'icon': 'dashboard-level',
                    'form': {
                        'groups': [{
                            'label': 'Audio Settings',
                            'fields': fields.audio
                        }]
                    }
                },
                {
                    'id': 'window',
                    'label': 'Startup and Window Behavior',
                    'icon': 'preferences',
                    'form': {
                        'groups': [{
                            // Startup and Window Settings
                            'label': 'Startup and Window Behavior',
                            'fields': fields.window
                        }]
                    }
                },
                {
                    'id': 'advanced',
                    'label': 'Advanced Settings',
                    'icon': 'flash-21',
                    'form': {
                        'groups': [{
                            'label': 'Advanced Settings',
                            'fields': fields.advanced
                        }]
                    }
                },
                {
                    'id': 'Credits',
                    'label': 'Credits',
                    'icon': 'multiple-11',
                    'form': {
                        'groups': [{
                            'label': 'Credits',
                            'fields': [{
                                'heading': 'Major thanks to',
                                'content': `<p style="size='12px'"><a style="color: #227bff !important" target="_blank" href='https://github.com/Apple-Music-Electron/'>The Apple Music Electron Team.</a></p>`,
                                'type': 'message'
                            },
                                {
                                    'heading': '',
                                    'content': `<p style="size='8px'">cryptofyre - Owner/Developer | <a style="color: #227bff !important" target="_blank" href='https://github.com/cryptofyre'>GitHub </a>| <a style="color: #227bff !important" target="_blank" href='https://twitter.com/cryptofyre'>Twitter </a>| <a style="color: #227bff !important" target="_blank" href='https://cryptofyre.org'>Website</a></p>`,
                                    'type': 'message'
                                },
                                {
                                    'heading': '',
                                    'content': `<p style="size='8px'">Core - Developer/Maintainer | <a style="color: #227bff !important" target="_blank" href='https://github.com/coredev-uk'>GitHub </a>| <a style="color: #227bff !important" target="_blank" href='https://twitter.com/core_hdd'>Twitter </a>| <a style="color: #227bff !important" target="_blank" href='https://c0r3.uk/'>Website</a></p>`,
                                    'type': 'message'
                                },
                                {
                                    'heading': '',
                                    'content': `<p style="size='8px'">Quacksire - Developer | <a style="color: #227bff !important" target="_blank" href='https://github.com/child-duckling'>GitHub </a>| <a style="color: #227bff !important" target="_blank" href='https://twitter.com/childquack'>Twitter </a>| <a style="color: #227bff !important" target="_blank" href='https://child.duckling.pw/'>Website</a></p>`,
                                    'type': 'message'
                                },
                                {
                                    'heading': '',
                                    'content': `<p style="size='8px'">GiantDwarf - Maintainer | <a style="color: #227bff !important" target="_blank" href='https://github.com/17hoehbr'>GitHub</p>`,
                                    'type': 'message'
                                },
                                {
                                    'heading': '',
                                    'content': `<p style="size='8px'">Void - Social Comms | <a style="color: #227bff !important" target="_blank" href='https://www.reddit.com/user/Frensident/'>Reddit</p>`,
                                    'type': 'message'
                                },
                                {
                                    'heading': '',
                                    'content': `<p style="size='8px'">And all of our wonderful <a style="color: #227bff !important" target="_blank" href='https://github.com/Apple-Music-Electron/Apple-Music-Electron/graphs/contributors'>Contributors.</p>`,
                                    'type': 'message'
                                },
                                {
                                    'heading': 'Donations',
                                    'content': `<p style="size='8px'">We accept donations <a style="color: #227bff !important" target="_blank" href='https://ko-fi.com/cryptofyre'>here!</a></p>`,
                                    'type': 'message'
                                },
                                {
                                    'heading': '',
                                    'content': `<p style="size='8px'">Donations are completely optional, however if you do end up donating it means a lot to us and this project and allows us to continue pushing updates and features.</p>`,
                                    'type': 'message'
                                },
                            ]
                        }]
                    }
                }
            ],
            browserWindowOpts: {
                'title': 'Preferences',
                'width': 900,
                'maxWidth': 1000,
                'height': 700,
                'maxHeight': 1000,
                'resizable': true,
                'maximizable': false,
                //...
            }
        });

        app.whenReady().then(() => {
            if (app.preferences.value('advanced.allowOldMenuAccess').includes(true)) {
                globalShortcut.register((process.platform === "darwin" ? "Control+Command+S" : "Control+Alt+S"), () => {
                    app.preferences.show();
                })
            }

            protocol.registerFileProtocol('themes', (request, callback) => {
                const url = request.url.substr(7)
                callback({
                    path: join(app.userThemesPath, url.toLowerCase())
                })
            })
            protocol.registerFileProtocol('ameres', (request, callback) => {
                const url = request.url.substr(7)
                callback(fs.createReadStream(join(join(__dirname, '../'), url.toLowerCase())))
            })
            protocol.registerFileProtocol('plugin', (request, callback) => {
                const url = request.url.substr(7)
                callback({
                    path: join(app.userPluginsPath, url.toLowerCase())
                })
            })
        })

        app.preferences._preferences.supportsAcrylic = AcrylicSupported
    },

    SentryInit: function () {
        if (app.preferences.value('general.analyticsEnabled').includes(true) && app.isPackaged) {
            ElectronSentry.init({
                dsn: "https://20e1c34b19d54dfcb8231e3ef7975240@o954055.ingest.sentry.io/5903033"
            });
        }
    }
}

module.exports = init