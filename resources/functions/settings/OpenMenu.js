const path = require('path');
const os = require('os');
const ElectronPreferences = require('electron-preferences');
const { app, globalShortcut } = require('electron')

exports.SettingsMenuInit = function() {
     app.preferences = new ElectronPreferences({
        'dataStore': path.resolve(app.getPath('userData'), 'preferences.json'),
        /**
         * Default values.
         */
        'defaults': {
            "general": {
                "authMode": [],
                "language": "",
                "discordRPC": [ true ],
                "playbackNotifications": "minimized",
                "trayTooltipSongName": [ true ],
                "lastfmEnabled": [],
                "lastfmAuthKey": "Put your Auth Key here."
            },
            "visual": {
                "theme": "",
                "emulateMacOS": "left",
                "transparencyMode": [ true ],
                "streamerMode": []
            },
            "window": {
                "appStartupBehavior": "false",
                "closeButtonMinimize": [ true ]
            },
            "advanced": {
                "enableDevTools": [ true ],
                "removeScrollbars": [ true ],
                "useBetaSite": [ true ],
                "settingsMenuKeybind": "Control+Alt+S",
                "forceApplicationRegion": ""
            }
        },
        'sections': [
            {
                'id': 'general',
                'label': 'General Settings',
                'icon': 'settings-gear-63',
                'form': {
                    'groups': [
                        {
                            // General Settings
                            'label': 'General Settings',
                            'fields': [
                                { // Auth Mode
                                    'label': 'Authentication Mode',
                                    'key': 'authMode',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'Authentication mode allows certain users to resolve issues when logging in', 'value': true }
                                    ],
                                    'help': 'This should be disabled after logging in.'
                                },
                                { // Language
                                    'label': 'Language',
                                    'key': 'language',
                                    'type': 'dropdown',
                                    'options': [
                                        { 'label': 'English (USA)', 'value': 'us'},
                                        { 'label': 'English (GB)', 'value': 'gb'},
                                        { 'label': 'United Arab Emirates', 'value': 'ae' },
                                        { 'label': 'Antigua and Barbuda', 'value': 'ag' },
                                        { 'label': 'Anguilla', 'value': 'ai' },
                                        { 'label': 'Albania', 'value': 'al' },
                                        { 'label': 'Armenia', 'value': 'am' },
                                        { 'label': 'Angola', 'value': 'ao' },
                                        { 'label': 'Argentina', 'value': 'ar' },
                                        { 'label': 'Austria', 'value': 'at' },
                                        { 'label': 'Australia', 'value': 'au' },
                                        { 'label': 'Azerbaijan', 'value': 'az' },
                                        { 'label': 'Barbados', 'value': 'bb' },
                                        { 'label': 'Belgium', 'value': 'be' },
                                        { 'label': 'Burkina-Faso', 'value': 'bf' },
                                        { 'label': 'Bulgaria', 'value': 'bg' },
                                        { 'label': 'Bahrain', 'value': 'bh' },
                                        { 'label': 'Benin', 'value': 'bj' },
                                        { 'label': 'Bermuda', 'value': 'bm' },
                                        { 'label': 'Brunei Darussalam', 'value': 'bn' },
                                        { 'label': 'Bolivia', 'value': 'bo' },
                                        { 'label': 'Brazil', 'value': 'br' },
                                        { 'label': 'Bahamas', 'value': 'bs' },
                                        { 'label': 'Bhutan', 'value': 'bt' },
                                        { 'label': 'Botswana', 'value': 'bw' },
                                        { 'label': 'Belarus', 'value': 'by' },
                                        { 'label': 'Belize', 'value': 'bz' },
                                        { 'label': 'Canada', 'value': 'ca' },
                                        { 'label': 'Democratic Republic of the Congo', 'value': 'cg' },
                                        { 'label': 'Switzerland', 'value': 'ch' },
                                        { 'label': 'Chile', 'value': 'cl' },
                                        { 'label': 'China', 'value': 'cn' },
                                        { 'label': 'Colombia', 'value': 'co' },
                                        { 'label': 'Costa Rica', 'value': 'cr'},
                                        { 'label': 'Cape Verde', 'value': 'cv'},
                                        { 'label': 'Cyprus', 'value': 'cy'},
                                        { 'label': 'Czech Republic', 'value': 'cz'},
                                        { 'label': 'Germany', 'value': 'de'},
                                        { 'label': 'Denmark', 'value': 'dk'},
                                        { 'label': 'Dominica', 'value': 'dm'},
                                        { 'label': 'Dominican Republic', 'value': 'do'},
                                        { 'label': 'Algeria', 'value': 'dz'},
                                        { 'label': 'Ecuador', 'value': 'ec'},
                                        { 'label': 'Estonia', 'value': 'ee'},
                                        { 'label': 'Egypt', 'value': 'eg'},
                                        { 'label': 'Spain', 'value': 'es'},
                                        { 'label': 'Finland', 'value': 'fi'},
                                        { 'label': 'Fiji', 'value': 'fj'},
                                        { 'label': 'Federated States of Micronesia', 'value': 'fm'},
                                        { 'label': 'France', 'value': 'fr'},
                                        { 'label': 'Grenada', 'value': 'gd'},
                                        { 'label': 'Ghana', 'value': 'gh'},
                                        { 'label': 'Gambia', 'value': 'gm'},
                                        { 'label': 'Greece', 'value': 'gr'},
                                        { 'label': 'Guatemala', 'value': 'gt'},
                                        { 'label': 'Guinea Bissau', 'value': 'gw'},
                                        { 'label': 'Guyana', 'value': 'gy'},
                                        { 'label': 'Hong Kong', 'value': 'hk'},
                                        { 'label': 'Honduras', 'value': 'hn'},
                                        { 'label': 'Croatia', 'value': 'hr'},
                                        { 'label': 'Hungaria', 'value': 'hu'},
                                        { 'label': 'Indonesia', 'value': 'id'},
                                        { 'label': 'Ireland', 'value': 'ie'},
                                        { 'label': 'Israel', 'value': 'il'},
                                        { 'label': 'India', 'value': 'in'},
                                        { 'label': 'Iceland', 'value': 'is'},
                                        { 'label': 'Italy', 'value': 'it'},
                                        { 'label': 'Jamaica', 'value': 'jm'},
                                        { 'label': 'Jordan', 'value': 'jo'},
                                        { 'label': 'Japan', 'value': 'jp'},
                                        { 'label': 'Kenya', 'value': 'ke'},
                                        { 'label': 'Krygyzstan', 'value': 'kg'},
                                        { 'label': 'Cambodia', 'value': 'kh'},
                                        { 'label': 'Saint Kitts and Nevis', 'value': 'kn'},
                                        { 'label': 'South Korea', 'value': 'kr'},
                                        { 'label': 'Kuwait', 'value': 'kw'},
                                        { 'label': 'Cayman Islands', 'value': 'ky'},
                                        { 'label': 'Kazakhstan', 'value': 'kz'},
                                        { 'label': 'Laos', 'value': 'la'},
                                        { 'label': 'Lebanon', 'value': 'lb'},
                                        { 'label': 'Saint Lucia', 'value': 'lc'},
                                        { 'label': 'Sri Lanka', 'value': 'lk'},
                                        { 'label': 'Liberia', 'value': 'lr'},
                                        { 'label': 'Lithuania', 'value': 'lt'},
                                        { 'label': 'Luxembourg', 'value': 'lu'},
                                        { 'label': 'Latvia', 'value': 'lv'},
                                        { 'label': 'Moldova', 'value': 'md'},
                                        { 'label': 'Madagascar', 'value': 'mg'},
                                        { 'label': 'Macedonia', 'value': 'mk'},
                                        { 'label': 'Mali', 'value': 'ml'},
                                        { 'label': 'Mongolia', 'value': 'mn'},
                                        { 'label': 'Macau', 'value': 'mo'},
                                        { 'label': 'Mauritania', 'value': 'mr'},
                                        { 'label': 'Montserrat', 'value': 'ms'},
                                        { 'label': 'Malta', 'value': 'mt'},
                                        { 'label': 'Mauritius', 'value': 'mu'},
                                        { 'label': 'Malawi', 'value': 'mw'},
                                        { 'label': 'Mexico', 'value': 'mx'},
                                        { 'label': 'Malaysia', 'value': 'my'},
                                        { 'label': 'Mozambique', 'value': 'mz'},
                                        { 'label': 'Namibia', 'value': 'na'},
                                        { 'label': 'Niger', 'value': 'ne'},
                                        { 'label': 'Nigeria', 'value': 'ng'},
                                        { 'label': 'Nicaragua', 'value': 'ni'},
                                        { 'label': 'Netherlands', 'value': 'nl'},
                                        { 'label': 'Nepal', 'value': 'np'},
                                        { 'label': 'Norway', 'value': 'no'},
                                        { 'label': 'New Zealand', 'value': 'nz'},
                                        { 'label': 'Oman', 'value': 'om'},
                                        { 'label': 'Panama', 'value': 'pa'},
                                        { 'label': 'Peru', 'value': 'pe'},
                                        { 'label': 'Papua New Guinea', 'value': 'pg'},
                                        { 'label': 'Philippines', 'value': 'ph'},
                                        { 'label': 'Pakistan', 'value': 'pk'},
                                        { 'label': 'Poland', 'value': 'pl'},
                                        { 'label': 'Portugal', 'value': 'pt'},
                                        { 'label': 'Palau', 'value': 'pw'},
                                        { 'label': 'Paraguay', 'value': 'py'},
                                        { 'label': 'Qatar', 'value': 'qa'},
                                        { 'label': 'Romania', 'value': 'ro'},
                                        { 'label': 'Russia', 'value': 'ru'},
                                        { 'label': 'Saudi Arabia', 'value': 'sa'},
                                        { 'label': 'Soloman Islands', 'value': 'sb'},
                                        { 'label': 'Seychelles', 'value': 'sc'},
                                        { 'label': 'Sweden', 'value': 'se'},
                                        { 'label': 'Singapore', 'value': 'sg'},
                                        { 'label': 'Slovenia', 'value': 'si'},
                                        { 'label': 'Slovakia', 'value': 'sk'},
                                        { 'label': 'Sierra Leone', 'value': 'sl'},
                                        { 'label': 'Senegal', 'value': 'sn'},
                                        { 'label': 'Suriname', 'value': 'sr'},
                                        { 'label': 'Sao Tome e Principe', 'value': 'st'},
                                        { 'label': 'El Salvador', 'value': 'sv'},
                                        { 'label': 'Swaziland', 'value': 'sz'},
                                        { 'label': 'Turks and Caicos Islands', 'value': 'tc'},
                                        { 'label': 'Chad', 'value': 'td'},
                                        { 'label': 'Thailand', 'value': 'th'},
                                        { 'label': 'Tajikistan', 'value': 'tj'},
                                        { 'label': 'Turkmenistan', 'value': 'tm'},
                                        { 'label': 'Tunisia', 'value': 'tn'},
                                        { 'label': 'Turkey', 'value': 'tr'},
                                        { 'label': 'Republic of Trinidad and Tobago', 'value': 'tt'},
                                        { 'label': 'Taiwan', 'value': 'tw'},
                                        { 'label': 'Tanzania', 'value': 'tz'},
                                        { 'label': 'Ukraine', 'value': 'ua'},
                                        { 'label': 'Uganda', 'value': 'ug'},
                                        { 'label': 'Uruguay', 'value': 'uy'},
                                        { 'label': 'Uzbekistan', 'value': 'uz'},
                                        { 'label': 'Saint Vincent and the Grenadines', 'value': 'vc'},
                                        { 'label': 'Venezuela', 'value': 've'},
                                        { 'label': 'British Virgin Islands', 'value': 'vg'},
                                        { 'label': 'Vietnam', 'value': 'vn'},
                                        { 'label': 'Yemen', 'value': 'ye'},
                                        { 'label': 'South Africa', 'value': 'za'},
                                        { 'label': 'Zimbabwe', 'value': 'zw'}
                                    ],
                                    'help': 'You will need to restart the application for language settings to apply.'
                                },
                                { // Discord Rich Presence
                                    'label': 'Discord Rich Presence',
                                    'key': 'discordRPC',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'Display your current song as your Discord Game activity', 'value': true }
                                    ],
                                    'help': `In order for this to appear, you must have 'Display current activity as status message.' turned on.`
                                },
                                { // Turning on playbackNotifications
                                    'label': 'Notifications on Song Change',
                                    'key': 'playbackNotifications',
                                    'type': 'dropdown',
                                    'options': [
                                        { 'label': 'Yes', 'value': true },
                                        { 'label': 'No', 'value': false},
                                        { 'label': 'Minimized', 'value': 'minimized' }
                                    ],
                                    'help': 'Enabling this means you will get notifications when you change song. The minimized option forces notifications to only appear if the app is hidden / minimized.'
                                },
                                { // Turning on trayTooltipSongName
                                    'label': 'Show Song Name as Tray Icon Tooltip',
                                    'key': 'trayTooltipSongName',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'Tray Icon Tooltip Song Name', 'value': true }
                                    ],
                                    'help': 'Enabling this option allows you to see the song name in the tooltip on the taskbar when the application is minimized to the tray.'
                                },
                                { // LastFM
                                    'heading': 'LastFM Notice',
                                    'content': `<p style="size='8px'">For information regarding this section, read the wiki post found <a style="color: #227bff !important" target="_blank" onclick='shell.openExternal("https://github.com/cryptofyre/Apple-Music-Electron/wiki/LastFM")'>here</a>.</p>`,
                                    'type': 'message'
                                },
                                { // LastFM Toggle
                                    'key': 'lastfmEnabled',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'Scrobble LastFM on Song Change', 'value': true }
                                    ]
                                },
                                { // LastFM Auth Key
                                    'label': 'LastFM Authentication Key',
                                    'key': 'lastfmAuthKey',
                                    'type': 'text'
                                }
                            ]
                        }
                    ]
                }
            },
            {
                'id': 'visual',
                'label': 'Visual Settings',
                'icon': 'eye-19',
                'form': {
                    'groups': [
                        {
                            // Visual Settings
                            'label': 'Visual Settings',
                            'fields': [
                                { // Setting Your Theme
                                    'label': 'Themes:',
                                    'key': 'theme',
                                    'type': 'dropdown',
                                    'options': [
                                        {'label': 'Default', 'value': 'default'},
                                        {'label': 'Blurple', 'value': 'blurple'},
                                        {'label': 'Dracula', 'value': 'dracula'},
                                        {'label': 'Jungle', 'value': 'jungle'},
                                        {'label': 'Spotify', 'value': 'spotify'},
                                        {'label': 'OLED', 'value': 'oled'}
                                    ]
                                },
                                {
                                    'content': '<p>You can preview all the themes <a style="color: #227bff !important" target="_blank" href="https://github.com/cryptofyre/Apple-Music-Electron/wiki/Theme-Preview-Images">here</a>.</p>',
                                    'type': 'message'
                                },
                                { // MacOS Application Emulation
                                    'label': 'MacOS Music Emulation',
                                    'key': 'emulateMacOS',
                                    'type': 'dropdown',
                                    'options': [
                                        { 'label': 'Left (Default)', 'value': 'left' },
                                        { 'label': 'Right (Like Windows)', 'value': 'right' },
                                    ],
                                    'help': 'This enables various adjustments that make the Apple Music interface look like the MacOS Apple Music UI. Here it allows you to select a side that you would like to align the MacOS Window Controls.'
                                },
                                { // Turning on transparency
                                    'label': 'Transparency',
                                    'key': 'transparencyMode',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': `Creates a 'glass-blur' affect on the UI, with slight transparency.`, 'value': true }
                                    ],
                                    'help': 'This enables the transparency affect for the Apple Music UI. This can affect performance if you are using older hardware. Themes can vary in transparency.'
                                },
                                { // Streaming Mode
                                    'label': 'Streaming Mode',
                                    'key': 'streamerMode',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'Removes certain UI elements and has unique scaling properties', 'value': true }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            },
            {
                'id': 'window',
                'label': 'Startup and Window Behavior',
                'icon': 'preferences',
                'form': {
                    'groups': [
                        {
                            // Startup and Window Settings
                            'label': 'Startup and Window Behavior',
                            'fields': [
                                { // Open Apple Music on Startup
                                    'label': 'Open Apple Music automatically after login',
                                    'key': 'appStartupBehavior',
                                    'type': 'dropdown',
                                    'options': [
                                        { 'label': 'Hidden', 'value': 'hidden' },
                                        { 'label': 'Minimized', 'value': 'minimized' },
                                        { 'label': 'Yes', 'value': true },
                                        { 'label': 'No', 'value': false }
                                    ]
                                },
                                { // Turning on closeButtonMinimize
                                    'key': 'closeButtonMinimize',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'Close button should minimize Apple Music', 'value': true }
                                    ]
                                }
                            ],
                        }
                    ]
                }
            },
            {
                'id': 'advanced',
                'label': 'Advanced Settings',
                'icon': 'flash-21',
                'form': {
                    'groups': [
                        {
                            'label': 'Advanced Settings',
                            'fields': [
                                {
                                    'content': "<p>Do not mess with these options unless you know what you're doing.</p>",
                                    'type': 'message'
                                },
                                { // Turning on forceApplicationRegion
                                    'label': 'forceApplicationRegion',
                                    'key': 'forceApplicationRegion',
                                    'type': 'dropdown',
                                    'options': [
                                        { 'label': 'United Arab Emirates', 'value': 'ae' },
                                        { 'label': 'Antigua and Barbuda', 'value': 'ag' },
                                        { 'label': 'Anguilla', 'value': 'ai' },
                                        { 'label': 'Albania', 'value': 'al' },
                                        { 'label': 'Armenia', 'value': 'am' },
                                        { 'label': 'Angola', 'value': 'ao' },
                                        { 'label': 'Argentina', 'value': 'ar' },
                                        { 'label': 'Austria', 'value': 'at' },
                                        { 'label': 'Australia', 'value': 'au' },
                                        { 'label': 'Azerbaijan', 'value': 'az' },
                                        { 'label': 'Barbados', 'value': 'bb' },
                                        { 'label': 'Belgium', 'value': 'be' },
                                        { 'label': 'Burkina-Faso', 'value': 'bf' },
                                        { 'label': 'Bulgaria', 'value': 'bg' },
                                        { 'label': 'Bahrain', 'value': 'bh' },
                                        { 'label': 'Benin', 'value': 'bj' },
                                        { 'label': 'Bermuda', 'value': 'bm' },
                                        { 'label': 'Brunei Darussalam', 'value': 'bn' },
                                        { 'label': 'Bolivia', 'value': 'bo' },
                                        { 'label': 'Brazil', 'value': 'br' },
                                        { 'label': 'Bahamas', 'value': 'bs' },
                                        { 'label': 'Bhutan', 'value': 'bt' },
                                        { 'label': 'Botswana', 'value': 'bw' },
                                        { 'label': 'Belarus', 'value': 'by' },
                                        { 'label': 'Belize', 'value': 'bz' },
                                        { 'label': 'Canada', 'value': 'ca' },
                                        { 'label': 'Democratic Republic of the Congo', 'value': 'cg' },
                                        { 'label': 'Switzerland', 'value': 'ch' },
                                        { 'label': 'Chile', 'value': 'cl' },
                                        { 'label': 'China', 'value': 'cn' },
                                        { 'label': 'Colombia', 'value': 'co' },
                                        { 'label': 'Costa Rica', 'value': 'cr'},
                                        { 'label': 'Cape Verde', 'value': 'cv'},
                                        { 'label': 'Cyprus', 'value': 'cy'},
                                        { 'label': 'Czech Republic', 'value': 'cz'},
                                        { 'label': 'Germany', 'value': 'de'},
                                        { 'label': 'Denmark', 'value': 'dk'},
                                        { 'label': 'Dominica', 'value': 'dm'},
                                        { 'label': 'Dominican Republic', 'value': 'do'},
                                        { 'label': 'Algeria', 'value': 'dz'},
                                        { 'label': 'Ecuador', 'value': 'ec'},
                                        { 'label': 'Estonia', 'value': 'ee'},
                                        { 'label': 'Egypt', 'value': 'eg'},
                                        { 'label': 'Spain', 'value': 'es'},
                                        { 'label': 'Finland', 'value': 'fi'},
                                        { 'label': 'Fiji', 'value': 'fj'},
                                        { 'label': 'Federated States of Micronesia', 'value': 'fm'},
                                        { 'label': 'France', 'value': 'fr'},
                                        { 'label': 'Great Britain', 'value': 'gb'},
                                        { 'label': 'Grenada', 'value': 'gd'},
                                        { 'label': 'Ghana', 'value': 'gh'},
                                        { 'label': 'Gambia', 'value': 'gm'},
                                        { 'label': 'Greece', 'value': 'gr'},
                                        { 'label': 'Guatemala', 'value': 'gt'},
                                        { 'label': 'Guinea Bissau', 'value': 'gw'},
                                        { 'label': 'Guyana', 'value': 'gy'},
                                        { 'label': 'Hong Kong', 'value': 'hk'},
                                        { 'label': 'Honduras', 'value': 'hn'},
                                        { 'label': 'Croatia', 'value': 'hr'},
                                        { 'label': 'Hungaria', 'value': 'hu'},
                                        { 'label': 'Indonesia', 'value': 'id'},
                                        { 'label': 'Ireland', 'value': 'ie'},
                                        { 'label': 'Israel', 'value': 'il'},
                                        { 'label': 'India', 'value': 'in'},
                                        { 'label': 'Iceland', 'value': 'is'},
                                        { 'label': 'Italy', 'value': 'it'},
                                        { 'label': 'Jamaica', 'value': 'jm'},
                                        { 'label': 'Jordan', 'value': 'jo'},
                                        { 'label': 'Japan', 'value': 'jp'},
                                        { 'label': 'Kenya', 'value': 'ke'},
                                        { 'label': 'Krygyzstan', 'value': 'kg'},
                                        { 'label': 'Cambodia', 'value': 'kh'},
                                        { 'label': 'Saint Kitts and Nevis', 'value': 'kn'},
                                        { 'label': 'South Korea', 'value': 'kr'},
                                        { 'label': 'Kuwait', 'value': 'kw'},
                                        { 'label': 'Cayman Islands', 'value': 'ky'},
                                        { 'label': 'Kazakhstan', 'value': 'kz'},
                                        { 'label': 'Laos', 'value': 'la'},
                                        { 'label': 'Lebanon', 'value': 'lb'},
                                        { 'label': 'Saint Lucia', 'value': 'lc'},
                                        { 'label': 'Sri Lanka', 'value': 'lk'},
                                        { 'label': 'Liberia', 'value': 'lr'},
                                        { 'label': 'Lithuania', 'value': 'lt'},
                                        { 'label': 'Luxembourg', 'value': 'lu'},
                                        { 'label': 'Latvia', 'value': 'lv'},
                                        { 'label': 'Moldova', 'value': 'md'},
                                        { 'label': 'Madagascar', 'value': 'mg'},
                                        { 'label': 'Macedonia', 'value': 'mk'},
                                        { 'label': 'Mali', 'value': 'ml'},
                                        { 'label': 'Mongolia', 'value': 'mn'},
                                        { 'label': 'Macau', 'value': 'mo'},
                                        { 'label': 'Mauritania', 'value': 'mr'},
                                        { 'label': 'Montserrat', 'value': 'ms'},
                                        { 'label': 'Malta', 'value': 'mt'},
                                        { 'label': 'Mauritius', 'value': 'mu'},
                                        { 'label': 'Malawi', 'value': 'mw'},
                                        { 'label': 'Mexico', 'value': 'mx'},
                                        { 'label': 'Malaysia', 'value': 'my'},
                                        { 'label': 'Mozambique', 'value': 'mz'},
                                        { 'label': 'Namibia', 'value': 'na'},
                                        { 'label': 'Niger', 'value': 'ne'},
                                        { 'label': 'Nigeria', 'value': 'ng'},
                                        { 'label': 'Nicaragua', 'value': 'ni'},
                                        { 'label': 'Netherlands', 'value': 'nl'},
                                        { 'label': 'Nepal', 'value': 'np'},
                                        { 'label': 'Norway', 'value': 'no'},
                                        { 'label': 'New Zealand', 'value': 'nz'},
                                        { 'label': 'Oman', 'value': 'om'},
                                        { 'label': 'Panama', 'value': 'pa'},
                                        { 'label': 'Peru', 'value': 'pe'},
                                        { 'label': 'Papua New Guinea', 'value': 'pg'},
                                        { 'label': 'Philippines', 'value': 'ph'},
                                        { 'label': 'Pakistan', 'value': 'pk'},
                                        { 'label': 'Poland', 'value': 'pl'},
                                        { 'label': 'Portugal', 'value': 'pt'},
                                        { 'label': 'Palau', 'value': 'pw'},
                                        { 'label': 'Paraguay', 'value': 'py'},
                                        { 'label': 'Qatar', 'value': 'qa'},
                                        { 'label': 'Romania', 'value': 'ro'},
                                        { 'label': 'Russia', 'value': 'ru'},
                                        { 'label': 'Saudi Arabia', 'value': 'sa'},
                                        { 'label': 'Soloman Islands', 'value': 'sb'},
                                        { 'label': 'Seychelles', 'value': 'sc'},
                                        { 'label': 'Sweden', 'value': 'se'},
                                        { 'label': 'Singapore', 'value': 'sg'},
                                        { 'label': 'Slovenia', 'value': 'si'},
                                        { 'label': 'Slovakia', 'value': 'sk'},
                                        { 'label': 'Sierra Leone', 'value': 'sl'},
                                        { 'label': 'Senegal', 'value': 'sn'},
                                        { 'label': 'Suriname', 'value': 'sr'},
                                        { 'label': 'Sao Tome e Principe', 'value': 'st'},
                                        { 'label': 'El Salvador', 'value': 'sv'},
                                        { 'label': 'Swaziland', 'value': 'sz'},
                                        { 'label': 'Turks and Caicos Islands', 'value': 'tc'},
                                        { 'label': 'Chad', 'value': ''},
                                        { 'label': '', 'value': 'td'},
                                        { 'label': 'Thailand', 'value': 'th'},
                                        { 'label': 'Tajikistan', 'value': 'tj'},
                                        { 'label': 'Turkmenistan', 'value': 'tm'},
                                        { 'label': 'Tunisia', 'value': 'tn'},
                                        { 'label': 'Turkey', 'value': 'tr'},
                                        { 'label': 'Republic of Trinidad and Tobago', 'value': 'tt'},
                                        { 'label': 'Taiwan', 'value': 'tw'},
                                        { 'label': 'Tanzania', 'value': 'tz'},
                                        { 'label': 'Ukraine', 'value': 'ua'},
                                        { 'label': 'Uganda', 'value': 'ug'},
                                        { 'label': 'United States of America', 'value': 'us'},
                                        { 'label': 'Uruguay', 'value': 'uy'},
                                        { 'label': 'Uzbekistan', 'value': 'uz'},
                                        { 'label': 'Saint Vincent and the Grenadines', 'value': 'vc'},
                                        { 'label': 'Venezuela', 'value': 've'},
                                        { 'label': 'British Virgin Islands', 'value': 'vg'},
                                        { 'label': 'Vietnam', 'value': 'vn'},
                                        { 'label': 'Yemen', 'value': 'ye'},
                                        { 'label': 'South Africa', 'value': 'za'},
                                        { 'label': 'Zimbabwe', 'value': 'zw'}
                                    ],
                                    'help': 'WARNING: This can cause unexpected side affects. This is not advised. On most cases, the webapp will force you to your Apple ID Region or Region based on IP.'
                                },
                                { // Turning on allowMultipleInstances
                                    'key': 'allowMultipleInstances',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'allowMultipleInstances', 'value': true }
                                    ]
                                },
                                { // Turning on autoUpdaterBetaBuilds
                                    'key': 'autoUpdaterBetaBuilds',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'autoUpdaterBetaBuilds', 'value': true }
                                    ]
                                },
                                { // Turning on enableDevTools
                                    'key': 'enableDevTools',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'enableDevTools', 'value': true }
                                    ]
                                },
                                { // Turning on forceDisableWindowFrame
                                    'key': 'forceDisableWindowFrame',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'forceDisableWindowFrame', 'value': true }
                                    ]
                                },
                                { // Turning on forceDarkMode
                                    'key': 'forceDarkMode',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'forceDarkMode', 'value': true }
                                    ]
                                },
                                { // Turning on menuBarVisible
                                    'key': 'menuBarVisible',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'menuBarVisible', 'value': true }
                                    ]
                                },
                                { // Turning on removeScrollbars
                                    'key': 'removeScrollbars',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'removeScrollbars', 'value': true }
                                    ]
                                },
                                { // Turning on useBeta
                                    'key': 'useBetaSite',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'useBeta', 'value': true }
                                    ]
                                },
                                { // Turning on preventMediaKeyHijacking
                                    'key': 'preventMediaKeyHijacking',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'preventMediaKeyHijacking', 'value': true }
                                    ]
                                },
                                { // Setting Keybind for Opening Settings
                                    'label': 'settingsMenuKeybind',
                                    'key': 'settingsMenuKeybind',
                                    'type': 'accelerator',
                                },
                            ],
                        }
                    ]
                }
            }
        ],
        browserWindowOpts: {
            'title': 'App Settings',
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
        globalShortcut.register(app.preferences.value('advanced.settingsMenuKeybind'), () => {
            app.preferences.show();
        })
    })
}
