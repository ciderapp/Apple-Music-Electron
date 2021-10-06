const {
    app,
    nativeTheme,
    nativeImage,
    Tray,
    globalShortcut,
    protocol
} = require("electron");
const {
    join,
    resolve,
    normalize
} = require("path");
const os = require("os");
const fs = require("fs");
const chmodr = require("chmodr");
const clone = require('git-clone');
const rimraf = require('rimraf')
const languages = require("../languages.json");
const ElectronSentry = require('@sentry/electron');

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

        // Set Max Listener
        require('events').EventEmitter.defaultMaxListeners = Infinity;
    },

    LoggingInit: function () {
        const log = require("electron-log");

        log.transports.file.resolvePath = (vars) => {
            return join(app.getPath('userData'), 'logs', vars.fileName);
        }

        Object.assign(console, log.functions);

        console.verbose = () => {};

        if (app.preferences.value('advanced.verboseLogging').includes(true) || app.verboseLaunched) {
            console.verbose = log.debug
            console.warn = log.warn
        } else {
            console.verbose = function (_data) {
                return false
            };
            console.warn = function (_data) {
                return false
            };
        }
    },

    ThemeInstallation: function () {
        function PermissionsCheck(folder, file) {
            console.verbose(`[PermissionsCheck] Running check on ${join(folder, file)}`)
            fs.access(join(folder, file), fs.constants.R_OK | fs.constants.W_OK, (err) => {
                if (err) { // File cannot be read after cloning
                    console.error(`[PermissionsCheck][access] ${err}`)
                    chmodr(folder, 0o777, (err) => {
                        if (err) {
                            console.error(`[PermissionsCheck][chmodr] ${err} - Theme set to default to prevent application launch halt.`);
                            app.preferences.value('visual.theme', 'default')
                        }
                    });
                } else {
                    console.verbose('[PermissionsCheck] Check passed.')
                }
            })
        }

        // Check if the themes folder exists and check permissions
        if (fs.existsSync(app.userThemesPath)) {
            console.log("[InitializeTheme][existsSync] Themes folder exists!")
            PermissionsCheck(app.userThemesPath, 'README.md')
        } else {
            console.verbose("[InitializeTheme] Attempting to clone themes.")
            clone('https://github.com/Apple-Music-Electron/Apple-Music-Electron-Themes', app.userThemesPath, [], (err) => {
                console.log(`[InitializeTheme][GitClone] ${err ? err : `Themes repository has been cloned to '${app.userThemesPath}'`}`)
                PermissionsCheck(app.userThemesPath, 'README.md')
            })
        }

        // Save all the file names to array and log it
        if (fs.existsSync(app.userThemesPath)) {
            console.log(`[InitializeTheme] Files found in Themes Directory: [${fs.readdirSync(app.userThemesPath).join(', ')}]`)
        }

        if (app.preferences.value('advanced.overwriteThemes').includes(true)) {
            rimraf(app.userThemesPath, [], () => {
                console.warn(`[InitializeTheme] Clearing themes directory for fresh clone. ('${app.userThemesPath}`)
                clone('https://github.com/Apple-Music-Electron/Apple-Music-Electron-Themes', app.userThemesPath, [], (err) => {
                    console.log(`[InitializeTheme][GitClone] ${err ? err : `Re-cloned Themes.`}`)
                    app.preferences.value('advanced.overwriteThemes', [])
                    app.preferences.value('visual.theme', 'default')
                })
            })
        }

        // Set the default theme
        if (app.preferences.value('advanced.forceApplicationMode')) {
            nativeTheme.themeSource = app.preferences.value('advanced.forceApplicationMode')
        }
    },

    AppReady: function () {
        console.verbose('[ApplicationReady] Started.');
        // Run the Functions
        app.funcs.SetTaskList()
        init.ThemeInstallation()
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
                "settingsMenuKeybind": "",
                "menuBarVisible": [],
                "removeScrollbars": [
                    true
                ],
                "devTools": "",
                "overwriteThemes": [],
                "allowMultipleInstances": [],
            }
        }
        fields.general = [{ // Language
                'label': 'Language',
                'key': 'language',
                'type': 'dropdown',
                'options': [{
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
                'options': [{
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
                'options': [{
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
                'options': [{
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
        fields.visual = [{ // Setting Your Theme
                'label': 'Themes:',
                'key': 'theme',
                'type': 'dropdown',
                'options': [{
                    'label': 'Default',
                    'value': 'default'
                }, ],
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
                'options': [{
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
                'options': [{
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
                'options': [{
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
            }
        ]
        fields.audio = [{ // Sound Quality
                'label': 'Sound Quality',
                'key': 'audioQuality',
                'type': 'dropdown',
                'options': [{
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
        fields.window = [{ // Open Apple Music on Startup
                'label': 'Open Apple Music automatically after login',
                'key': 'appStartupBehavior',
                'type': 'dropdown',
                'options': [{
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
        fields.advanced = [{
                'content': "<p>Do not mess with these options unless you know what you're doing.</p>",
                'type': 'message'
            },
            { // Turning on forceApplicationRegion
                'label': 'Force Application Region',
                'key': 'forceApplicationRegion',
                'type': 'dropdown',
                'options': [{
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
                'options': [{
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
            { // Setting Keybind for Opening Settings
                'label': 'settingsMenuKeybind',
                'key': 'settingsMenuKeybind',
                'type': 'accelerator',
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
                'type': 'dropdown',
                'options': [{
                        'label': 'Detached',
                        'value': 'detached'
                    },
                    {
                        'label': 'Built-in',
                        'value': 'built-in'
                    }
                ],
                'help': 'This allows users to access the chrome developer tools. Find more information at https://developer.chrome.com/docs/devtools/'
            },
            { // overwriteThemes (Prevents copying and replacing existing themes)
                'key': 'overwriteThemes',
                'type': 'checkbox',
                'options': [{
                    'label': 'overwriteThemes',
                    'value': true
                }],
                'help': 'Enable this to fetch the latest themes from GitHub on the next launch. (This will disable any active theme to prevent issues)'
            },
            { // Turning on allowMultipleInstances
                'key': 'allowMultipleInstances',
                'type': 'checkbox',
                'options': [{
                    'label': 'allowMultipleInstances',
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
            for (var key in fields.visual) {
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
        let themesFileNames = [], themesListing = [];
        let ThemesList = [];

        app.userPluginsPath = resolve(app.getPath('userData'), 'plugins');

        if (fs.existsSync(app.userThemesPath)) {
            fs.readdirSync(app.userThemesPath).forEach((value) => {
                if (value.split('.').pop() === 'css') {
                    themesFileNames.push(value.split('.').shift())
                }
            })
        }

        function fetchThemeName(fileName) {
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
        }

        // Get the Info
        themesFileNames.forEach((themeFileName) => {
            const themeName = fetchThemeName(themeFileName)
            if (!themeName) return;
            fields.visual[0].options.push({
                label: themeName,
                value: themeFileName
            }, )
            themesListing[`${themeFileName}`] = themeName
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

        if (!app.preferences.value("advanced.settingsMenuKeybind")) {
            app.preferences.value("advanced.settingsMenuKeybind", process.platform === "darwin" ? "Control+Command+S" : "Control+Alt+S")
        }

        app.whenReady().then(() => {
            globalShortcut.register(app.preferences.value('advanced.settingsMenuKeybind'), () => {
                app.preferences.show();
            })
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
        app.preferences._preferences.availableThemes = themesListing
    },

    SentryInit: function () {
        if (app.preferences.value('general.analyticsEnabled').includes(true) && app.isPackaged) {
            ElectronSentry.init({
                dsn: "https://20e1c34b19d54dfcb8231e3ef7975240@o954055.ingest.sentry.io/5903033"
            });
        }
    },

    ElectronStoreInit: function () {
        const Store = require('electron-store');
        const StoreConfiguration = {
            defaults: {},
            schema: {},
            migrations: {},
            name: {}
        } // default values and stuff
        const store = new Store(StoreConfiguration);

    }
}

module.exports = init