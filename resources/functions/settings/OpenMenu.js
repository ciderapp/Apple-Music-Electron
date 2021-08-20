const path = require('path');
const ElectronPreferences = require('electron-preferences');
const {app, globalShortcut} = require('electron');
const fs = require('fs');

exports.SettingsMenuInit = function () {
    app.preferences = new ElectronPreferences({
        'dataStore': path.resolve(app.getPath('userData'), 'preferences.json'),
        /**
         * Default values.
         */
        'defaults': {
            "general": {
                "language": "",
                "discordRPC": [
                    true
                ],
                "playbackNotifications": "minimized",
                "trayTooltipSongName": [
                    true
                ],
                "lastfmEnabled": [],
                "lastfmAuthKey": "Put your Auth Key here.",
                "lastfmRemoveFeaturingArtists": [
                    true
                ],
                "startupPage": "browse",
                "analyticsEnabled": [
                    true
                ],
                "audioQuality": "auto",
            },
            "visual": {
                "theme": "default",
                "emulateMacOS": "left",
                "transparencyMode": [],
                "streamerMode": [],
                "removeUpsell": [
                    true
                ],
                "removeFooter": [
                    true
                ],
                "removeAppleLogo": [
                    true
                ],
                "backButton": [
                    true
                ],
                "transparencyEffect": "",
                "transparencyTheme": "appearance-based",
                "transparencyDisableBlur": [
                    true
                ],
                "transparencyMaximumRefreshRate": ""
            },
            "window": {
                "appStartupBehavior": "false",
                "closeButtonMinimize": [
                    true
                ]
            },
            "advanced": {
                "devTools": "",
                "themeDevelopment": [],
                "alwaysOnTop": [],
                "removeScrollbars": [
                    true
                ],
                "useBetaSite": [
                    true
                ],
                "preventMediaKeyHijacking": [],
                "autoUpdaterBetaBuilds": [],
                "menuBarVisible": [],
                "forceApplicationRegion": "",
                "allowMultipleInstances": [],
                "forceDisableWindowFrame": [],
                "forceApplicationMode": "",
                "listenNow": [],
                "discordClearActivityOnPause": [
                    true
                ],
                "settingsMenuKeybind": "Control+Alt+S"
            }
        },
        'sections': [{
            'id': 'general',
            'label': 'General Settings',
            'icon': 'settings-gear-63',
            'form': {
                'groups': [{
                    // General Settings
                    'label': 'General Settings',
                    'fields': [
                        { // Language
                            'label': 'Language',
                            'key': 'language',
                            'type': 'dropdown',
                            'options': [
                                {'label': 'English (USA)', 'value': 'us'},
                                {'label': 'English (GB)', 'value': 'gb'},
                                {'label': 'United Arab Emirates', 'value': 'ae'},
                                {'label': 'Antigua and Barbuda', 'value': 'ag'},
                                {'label': 'Anguilla', 'value': 'ai'},
                                {'label': 'Albania', 'value': 'al'},
                                {'label': 'Armenia', 'value': 'am'},
                                {'label': 'Angola', 'value': 'ao'},
                                {'label': 'Argentina', 'value': 'ar'},
                                {'label': 'Austria', 'value': 'at'},
                                {'label': 'Australia', 'value': 'au'},
                                {'label': 'Azerbaijan', 'value': 'az'},
                                {'label': 'Barbados', 'value': 'bb'},
                                {'label': 'Belgium', 'value': 'be'},
                                {'label': 'Burkina-Faso', 'value': 'bf'},
                                {'label': 'Bulgaria', 'value': 'bg'},
                                {'label': 'Bahrain', 'value': 'bh'},
                                {'label': 'Benin', 'value': 'bj'},
                                {'label': 'Bermuda', 'value': 'bm'},
                                {'label': 'Brunei Darussalam', 'value': 'bn'},
                                {'label': 'Bolivia', 'value': 'bo'},
                                {'label': 'Brazil', 'value': 'br'},
                                {'label': 'Bahamas', 'value': 'bs'},
                                {'label': 'Bhutan', 'value': 'bt'},
                                {'label': 'Botswana', 'value': 'bw'},
                                {'label': 'Belarus', 'value': 'by'},
                                {'label': 'Belize', 'value': 'bz'},
                                {'label': 'Canada', 'value': 'ca'},
                                {'label': 'Democratic Republic of the Congo', 'value': 'cg'},
                                {'label': 'Switzerland', 'value': 'ch'},
                                {'label': 'Chile', 'value': 'cl'},
                                {'label': 'China', 'value': 'cn'},
                                {'label': 'Colombia', 'value': 'co'},
                                {'label': 'Costa Rica', 'value': 'cr'},
                                {'label': 'Cape Verde', 'value': 'cv'},
                                {'label': 'Cyprus', 'value': 'cy'},
                                {'label': 'Czech Republic', 'value': 'cz'},
                                {'label': 'Germany', 'value': 'de'},
                                {'label': 'Denmark', 'value': 'dk'},
                                {'label': 'Dominica', 'value': 'dm'},
                                {'label': 'Dominican Republic', 'value': 'do'},
                                {'label': 'Algeria', 'value': 'dz'},
                                {'label': 'Ecuador', 'value': 'ec'},
                                {'label': 'Estonia', 'value': 'ee'},
                                {'label': 'Egypt', 'value': 'eg'},
                                {'label': 'Spain', 'value': 'es'},
                                {'label': 'Finland', 'value': 'fi'},
                                {'label': 'Fiji', 'value': 'fj'},
                                {'label': 'Federated States of Micronesia', 'value': 'fm'},
                                {'label': 'France', 'value': 'fr'},
                                {'label': 'Grenada', 'value': 'gd'},
                                {'label': 'Ghana', 'value': 'gh'},
                                {'label': 'Gambia', 'value': 'gm'},
                                {'label': 'Greece', 'value': 'gr'},
                                {'label': 'Guatemala', 'value': 'gt'},
                                {'label': 'Guinea Bissau', 'value': 'gw'},
                                {'label': 'Guyana', 'value': 'gy'},
                                {'label': 'Hong Kong', 'value': 'hk'},
                                {'label': 'Honduras', 'value': 'hn'},
                                {'label': 'Croatia', 'value': 'hr'},
                                {'label': 'Hungaria', 'value': 'hu'},
                                {'label': 'Indonesia', 'value': 'id'},
                                {'label': 'Ireland', 'value': 'ie'},
                                {'label': 'Israel', 'value': 'il'},
                                {'label': 'India', 'value': 'in'},
                                {'label': 'Iceland', 'value': 'is'},
                                {'label': 'Italy', 'value': 'it'},
                                {'label': 'Jamaica', 'value': 'jm'},
                                {'label': 'Jordan', 'value': 'jo'},
                                {'label': 'Japan', 'value': 'jp'},
                                {'label': 'Kenya', 'value': 'ke'},
                                {'label': 'Krygyzstan', 'value': 'kg'},
                                {'label': 'Cambodia', 'value': 'kh'},
                                {'label': 'Saint Kitts and Nevis', 'value': 'kn'},
                                {'label': 'South Korea', 'value': 'kr'},
                                {'label': 'Kuwait', 'value': 'kw'},
                                {'label': 'Cayman Islands', 'value': 'ky'},
                                {'label': 'Kazakhstan', 'value': 'kz'},
                                {'label': 'Laos', 'value': 'la'},
                                {'label': 'Lebanon', 'value': 'lb'},
                                {'label': 'Saint Lucia', 'value': 'lc'},
                                {'label': 'Sri Lanka', 'value': 'lk'},
                                {'label': 'Liberia', 'value': 'lr'},
                                {'label': 'Lithuania', 'value': 'lt'},
                                {'label': 'Luxembourg', 'value': 'lu'},
                                {'label': 'Latvia', 'value': 'lv'},
                                {'label': 'Moldova', 'value': 'md'},
                                {'label': 'Madagascar', 'value': 'mg'},
                                {'label': 'Macedonia', 'value': 'mk'},
                                {'label': 'Mali', 'value': 'ml'},
                                {'label': 'Mongolia', 'value': 'mn'},
                                {'label': 'Macau', 'value': 'mo'},
                                {'label': 'Mauritania', 'value': 'mr'},
                                {'label': 'Montserrat', 'value': 'ms'},
                                {'label': 'Malta', 'value': 'mt'},
                                {'label': 'Mauritius', 'value': 'mu'},
                                {'label': 'Malawi', 'value': 'mw'},
                                {'label': 'Mexico', 'value': 'mx'},
                                {'label': 'Malaysia', 'value': 'my'},
                                {'label': 'Mozambique', 'value': 'mz'},
                                {'label': 'Namibia', 'value': 'na'},
                                {'label': 'Niger', 'value': 'ne'},
                                {'label': 'Nigeria', 'value': 'ng'},
                                {'label': 'Nicaragua', 'value': 'ni'},
                                {'label': 'Netherlands', 'value': 'nl'},
                                {'label': 'Nepal', 'value': 'np'},
                                {'label': 'Norway', 'value': 'no'},
                                {'label': 'New Zealand', 'value': 'nz'},
                                {'label': 'Oman', 'value': 'om'},
                                {'label': 'Panama', 'value': 'pa'},
                                {'label': 'Peru', 'value': 'pe'},
                                {'label': 'Papua New Guinea', 'value': 'pg'},
                                {'label': 'Philippines', 'value': 'ph'},
                                {'label': 'Pakistan', 'value': 'pk'},
                                {'label': 'Poland', 'value': 'pl'},
                                {'label': 'Portugal', 'value': 'pt'},
                                {'label': 'Palau', 'value': 'pw'},
                                {'label': 'Paraguay', 'value': 'py'},
                                {'label': 'Qatar', 'value': 'qa'},
                                {'label': 'Romania', 'value': 'ro'},
                                {'label': 'Russia', 'value': 'ru'},
                                {'label': 'Saudi Arabia', 'value': 'sa'},
                                {'label': 'Soloman Islands', 'value': 'sb'},
                                {'label': 'Seychelles', 'value': 'sc'},
                                {'label': 'Sweden', 'value': 'se'},
                                {'label': 'Singapore', 'value': 'sg'},
                                {'label': 'Slovenia', 'value': 'si'},
                                {'label': 'Slovakia', 'value': 'sk'},
                                {'label': 'Sierra Leone', 'value': 'sl'},
                                {'label': 'Senegal', 'value': 'sn'},
                                {'label': 'Suriname', 'value': 'sr'},
                                {'label': 'Sao Tome e Principe', 'value': 'st'},
                                {'label': 'El Salvador', 'value': 'sv'},
                                {'label': 'Swaziland', 'value': 'sz'},
                                {'label': 'Turks and Caicos Islands', 'value': 'tc'},
                                {'label': 'Chad', 'value': 'td'},
                                {'label': 'Thailand', 'value': 'th'},
                                {'label': 'Tajikistan', 'value': 'tj'},
                                {'label': 'Turkmenistan', 'value': 'tm'},
                                {'label': 'Tunisia', 'value': 'tn'},
                                {'label': 'Turkey', 'value': 'tr'},
                                {'label': 'Republic of Trinidad and Tobago', 'value': 'tt'},
                                {'label': 'Taiwan', 'value': 'tw'},
                                {'label': 'Tanzania', 'value': 'tz'},
                                {'label': 'Ukraine', 'value': 'ua'},
                                {'label': 'Uganda', 'value': 'ug'},
                                {'label': 'Uruguay', 'value': 'uy'},
                                {'label': 'Uzbekistan', 'value': 'uz'},
                                {'label': 'Saint Vincent and the Grenadines', 'value': 'vc'},
                                {'label': 'Venezuela', 'value': 've'},
                                {'label': 'British Virgin Islands', 'value': 'vg'},
                                {'label': 'Vietnam', 'value': 'vn'},
                                {'label': 'Yemen', 'value': 'ye'},
                                {'label': 'South Africa', 'value': 'za'},
                                {'label': 'Zimbabwe', 'value': 'zw'}
                            ],
                            'help': 'You will need to restart the application for language settings to apply.'
                        },
                        {
                            'label': 'Sound Quality',
                            'key': 'audioQuality',
                            'type': 'dropdown',
                            'options': [
                                {'label': 'Automatic (Default)', 'value': 'auto'},
                                {'label': 'High (256kbps)', 'value': 'high'},
                                {'label': 'Normal (64kbps)', 'value': 'normal'}
                            ],
                            'help': `Allows the user to select a preferred audio bitrate for music playback. NOTE: This may not work on all songs.`
                        },
                        { // Discord Rich Presence
                            'label': 'Discord Rich Presence',
                            'key': 'discordRPC',
                            'type': 'checkbox',
                            'options': [{
                                'label': 'Display your current song as your Discord Game activity',
                                'value': true
                            }],
                            'help': `In order for this to appear, you must have 'Display current activity as status message.' turned on.`
                        },
                        { // Turning on playbackNotifications
                            'label': 'Notifications on Song Change',
                            'key': 'playbackNotifications',
                            'type': 'dropdown',
                            'options': [
                                {'label': 'Yes', 'value': true},
                                {'label': 'No', 'value': false},
                                {'label': 'Minimized', 'value': 'minimized'}
                            ],
                            'help': 'Enabling this means you will get notifications when you change song. The minimized option forces notifications to only appear if the app is hidden / minimized.'
                        },
                        { // Turning on trayTooltipSongName
                            'label': 'Show Song Name as Tray Icon Tooltip',
                            'key': 'trayTooltipSongName',
                            'type': 'checkbox',
                            'options': [
                                {'label': 'Tray Icon Tooltip Song Name', 'value': true}
                            ],
                            'help': 'Enabling this option allows you to see the song name in the tooltip on the taskbar when the application is minimized to the tray.'
                        },
                        { // LastFM
                            'heading': 'LastFM Notice',
                            'content': `<p style="size='8px'">For information regarding this section, read the wiki post found <a style="color: #227bff !important" target="_blank" href='https://github.com/cryptofyre/Apple-Music-Electron/wiki/LastFM'>here</a>.</p>`,
                            'type': 'message'
                        },
                        { // LastFM Toggle
                            'key': 'lastfmEnabled',
                            'type': 'checkbox',
                            'options': [
                                {'label': 'Scrobble LastFM on Song Change', 'value': true}
                            ]
                        },
                        { // LastFM Remove Featuring Artists
                            'key': 'lastfmRemoveFeaturingArtists',
                            'type': 'checkbox',
                            'options': [
                                {'label': 'Remove featuring artists', 'value': true}
                            ]
                        },
                        { // LastFM Auth Key
                            'label': 'LastFM Authentication Key',
                            'key': 'lastfmAuthKey',
                            'type': 'text'
                        },
                        { // startupPage
                            'label': 'Load Page on Startup',
                            'key': 'startupPage',
                            'type': 'dropdown',
                            'options': [
                                {'label': 'Browse', 'value': 'browse'},
                                {'label': 'Listen Now', 'value': 'listen-now'},
                                {'label': 'Radio', 'value': 'radio'},
                                {'label': 'Recently Added', 'value': 'library/recently-added'},
                                {'label': 'Albums', 'value': 'library/albums'},
                                {'label': 'Songs', 'value': 'library/songs'},
                                {'label': 'Made for You', 'value': 'library/made-for-you'}
                            ],
                            'help': 'Select what page you wish to be placed on when you start the application.'
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
                }]
            }
        },
            {
                'id': 'visual',
                'label': 'Visual Settings',
                'icon': 'eye-19',
                'form': {
                    'groups': [{
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
                                    {'label': 'OLED', 'value': 'oled'},
                                    {'label': 'Nord', 'value': 'nord'},
                                    {'label': 'Acrylic', 'value': 'acrylic'}
                                ]
                            },
                            {
                                'content': '<p>You can preview all the themes <a style="color: #227bff !important" target="_blank" href="https://github.com/cryptofyre/Apple-Music-Electron/wiki/Theme-Preview-Images">here</a>.</p>',
                                'type': 'message'
                            },
                            { // MacOS Application Emulation
                                'label': 'macOS Music Emulation',
                                'key': 'emulateMacOS',
                                'type': 'dropdown',
                                'options': [
                                    {'label': 'Left (Default)', 'value': 'left'},
                                    {'label': 'Right (Like Windows)', 'value': 'right'}
                                ],
                                'help': 'This enables various adjustments that make the Apple Music interface look like the MacOS Apple Music UI. Here it allows you to select a side that you would like to align the MacOS Window Controls.'
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
                                    {'label': 'Acrylic (W10 1809+)', 'value': 'acrylic'},
                                    {'label': 'Blur Behind', 'value': 'blur'}
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
                                'label': 'Disable Transparency when Unfocused (Acrylic)',
                                'key': 'transparencyDisableBlur',
                                'type': 'checkbox',
                                'options': [{
                                    'label': `Enable transparency on focus`,
                                    'value': true
                                }],
                                'help': 'If enabled, acrylic effect will be disabled when the window loses focus, to mimic the behaviour of normal UWP apps.'
                            },
                            { // Custom Refresh Rate
                                'label': 'Use Custom Window Refresh Rate',
                                'key': 'transparencyMaximumRefreshRate',
                                'type': 'dropdown',
                                'options': [
                                    {'label': '30', 'value': 30},
                                    {'label': '60', 'value': 60},
                                    {'label': '144', 'value': 144},
                                    {'label': '175', 'value': 175},
                                    {'label': '240', 'value': 240},
                                    {'label': '360', 'value': 360},
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

                            { // Back Button
                                'label': 'Back Button',
                                'key': 'backButton',
                                'type': 'checkbox',
                                'options': [{
                                    'label': 'Display a back button when going back is possible.',
                                    'value': true
                                }]
                            }
                        ]
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
                        'fields': [{ // Open Apple Music on Startup
                            'label': 'Open Apple Music automatically after login',
                            'key': 'appStartupBehavior',
                            'type': 'dropdown',
                            'options': [
                                {'label': 'Hidden', 'value': 'hidden'},
                                {'label': 'Minimized', 'value': 'minimized'},
                                {'label': 'Yes', 'value': true},
                                {'label': 'No', 'value': false}
                            ]
                        },
                            { // Turning on closeButtonMinimize
                                'key': 'closeButtonMinimize',
                                'type': 'checkbox',
                                'options': [
                                    {'label': 'Close button should minimize Apple Music', 'value': true}
                                ]
                            }
                        ],
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
                                    {'label': 'United Arab Emirates', 'value': 'ae'},
                                    {'label': 'Antigua and Barbuda', 'value': 'ag'},
                                    {'label': 'Anguilla', 'value': 'ai'},
                                    {'label': 'Albania', 'value': 'al'},
                                    {'label': 'Armenia', 'value': 'am'},
                                    {'label': 'Angola', 'value': 'ao'},
                                    {'label': 'Argentina', 'value': 'ar'},
                                    {'label': 'Austria', 'value': 'at'},
                                    {'label': 'Australia', 'value': 'au'},
                                    {'label': 'Azerbaijan', 'value': 'az'},
                                    {'label': 'Barbados', 'value': 'bb'},
                                    {'label': 'Belgium', 'value': 'be'},
                                    {'label': 'Burkina-Faso', 'value': 'bf'},
                                    {'label': 'Bulgaria', 'value': 'bg'},
                                    {'label': 'Bahrain', 'value': 'bh'},
                                    {'label': 'Benin', 'value': 'bj'},
                                    {'label': 'Bermuda', 'value': 'bm'},
                                    {'label': 'Brunei Darussalam', 'value': 'bn'},
                                    {'label': 'Bolivia', 'value': 'bo'},
                                    {'label': 'Brazil', 'value': 'br'},
                                    {'label': 'Bahamas', 'value': 'bs'},
                                    {'label': 'Bhutan', 'value': 'bt'},
                                    {'label': 'Botswana', 'value': 'bw'},
                                    {'label': 'Belarus', 'value': 'by'},
                                    {'label': 'Belize', 'value': 'bz'},
                                    {'label': 'Canada', 'value': 'ca'},
                                    {'label': 'Democratic Republic of the Congo', 'value': 'cg'},
                                    {'label': 'Switzerland', 'value': 'ch'},
                                    {'label': 'Chile', 'value': 'cl'},
                                    {'label': 'China', 'value': 'cn'},
                                    {'label': 'Colombia', 'value': 'co'},
                                    {'label': 'Costa Rica', 'value': 'cr'},
                                    {'label': 'Cape Verde', 'value': 'cv'},
                                    {'label': 'Cyprus', 'value': 'cy'},
                                    {'label': 'Czech Republic', 'value': 'cz'},
                                    {'label': 'Germany', 'value': 'de'},
                                    {'label': 'Denmark', 'value': 'dk'},
                                    {'label': 'Dominica', 'value': 'dm'},
                                    {'label': 'Dominican Republic', 'value': 'do'},
                                    {'label': 'Algeria', 'value': 'dz'},
                                    {'label': 'Ecuador', 'value': 'ec'},
                                    {'label': 'Estonia', 'value': 'ee'},
                                    {'label': 'Egypt', 'value': 'eg'},
                                    {'label': 'Spain', 'value': 'es'},
                                    {'label': 'Finland', 'value': 'fi'},
                                    {'label': 'Fiji', 'value': 'fj'},
                                    {'label': 'Federated States of Micronesia', 'value': 'fm'},
                                    {'label': 'France', 'value': 'fr'},
                                    {'label': 'Grenada', 'value': 'gd'},
                                    {'label': 'Ghana', 'value': 'gh'},
                                    {'label': 'Gambia', 'value': 'gm'},
                                    {'label': 'Greece', 'value': 'gr'},
                                    {'label': 'Guatemala', 'value': 'gt'},
                                    {'label': 'Guinea Bissau', 'value': 'gw'},
                                    {'label': 'Guyana', 'value': 'gy'},
                                    {'label': 'Hong Kong', 'value': 'hk'},
                                    {'label': 'Honduras', 'value': 'hn'},
                                    {'label': 'Croatia', 'value': 'hr'},
                                    {'label': 'Hungaria', 'value': 'hu'},
                                    {'label': 'Indonesia', 'value': 'id'},
                                    {'label': 'Ireland', 'value': 'ie'},
                                    {'label': 'Israel', 'value': 'il'},
                                    {'label': 'India', 'value': 'in'},
                                    {'label': 'Iceland', 'value': 'is'},
                                    {'label': 'Italy', 'value': 'it'},
                                    {'label': 'Jamaica', 'value': 'jm'},
                                    {'label': 'Jordan', 'value': 'jo'},
                                    {'label': 'Japan', 'value': 'jp'},
                                    {'label': 'Kenya', 'value': 'ke'},
                                    {'label': 'Krygyzstan', 'value': 'kg'},
                                    {'label': 'Cambodia', 'value': 'kh'},
                                    {'label': 'Saint Kitts and Nevis', 'value': 'kn'},
                                    {'label': 'South Korea', 'value': 'kr'},
                                    {'label': 'Kuwait', 'value': 'kw'},
                                    {'label': 'Cayman Islands', 'value': 'ky'},
                                    {'label': 'Kazakhstan', 'value': 'kz'},
                                    {'label': 'Laos', 'value': 'la'},
                                    {'label': 'Lebanon', 'value': 'lb'},
                                    {'label': 'Saint Lucia', 'value': 'lc'},
                                    {'label': 'Sri Lanka', 'value': 'lk'},
                                    {'label': 'Liberia', 'value': 'lr'},
                                    {'label': 'Lithuania', 'value': 'lt'},
                                    {'label': 'Luxembourg', 'value': 'lu'},
                                    {'label': 'Latvia', 'value': 'lv'},
                                    {'label': 'Moldova', 'value': 'md'},
                                    {'label': 'Madagascar', 'value': 'mg'},
                                    {'label': 'Macedonia', 'value': 'mk'},
                                    {'label': 'Mali', 'value': 'ml'},
                                    {'label': 'Mongolia', 'value': 'mn'},
                                    {'label': 'Macau', 'value': 'mo'},
                                    {'label': 'Mauritania', 'value': 'mr'},
                                    {'label': 'Montserrat', 'value': 'ms'},
                                    {'label': 'Malta', 'value': 'mt'},
                                    {'label': 'Mauritius', 'value': 'mu'},
                                    {'label': 'Malawi', 'value': 'mw'},
                                    {'label': 'Mexico', 'value': 'mx'},
                                    {'label': 'Malaysia', 'value': 'my'},
                                    {'label': 'Mozambique', 'value': 'mz'},
                                    {'label': 'Namibia', 'value': 'na'},
                                    {'label': 'Niger', 'value': 'ne'},
                                    {'label': 'Nigeria', 'value': 'ng'},
                                    {'label': 'Nicaragua', 'value': 'ni'},
                                    {'label': 'Netherlands', 'value': 'nl'},
                                    {'label': 'Nepal', 'value': 'np'},
                                    {'label': 'Norway', 'value': 'no'},
                                    {'label': 'New Zealand', 'value': 'nz'},
                                    {'label': 'Oman', 'value': 'om'},
                                    {'label': 'Panama', 'value': 'pa'},
                                    {'label': 'Peru', 'value': 'pe'},
                                    {'label': 'Papua New Guinea', 'value': 'pg'},
                                    {'label': 'Philippines', 'value': 'ph'},
                                    {'label': 'Pakistan', 'value': 'pk'},
                                    {'label': 'Poland', 'value': 'pl'},
                                    {'label': 'Portugal', 'value': 'pt'},
                                    {'label': 'Palau', 'value': 'pw'},
                                    {'label': 'Paraguay', 'value': 'py'},
                                    {'label': 'Qatar', 'value': 'qa'},
                                    {'label': 'Romania', 'value': 'ro'},
                                    {'label': 'Russia', 'value': 'ru'},
                                    {'label': 'Saudi Arabia', 'value': 'sa'},
                                    {'label': 'Soloman Islands', 'value': 'sb'},
                                    {'label': 'Seychelles', 'value': 'sc'},
                                    {'label': 'Sweden', 'value': 'se'},
                                    {'label': 'Singapore', 'value': 'sg'},
                                    {'label': 'Slovenia', 'value': 'si'},
                                    {'label': 'Slovakia', 'value': 'sk'},
                                    {'label': 'Sierra Leone', 'value': 'sl'},
                                    {'label': 'Senegal', 'value': 'sn'},
                                    {'label': 'Suriname', 'value': 'sr'},
                                    {'label': 'Sao Tome e Principe', 'value': 'st'},
                                    {'label': 'El Salvador', 'value': 'sv'},
                                    {'label': 'Swaziland', 'value': 'sz'},
                                    {'label': 'Turks and Caicos Islands', 'value': 'tc'},
                                    {'label': 'Chad', 'value': ''},
                                    {'label': '', 'value': 'td'},
                                    {'label': 'Thailand', 'value': 'th'},
                                    {'label': 'Tajikistan', 'value': 'tj'},
                                    {'label': 'Turkmenistan', 'value': 'tm'},
                                    {'label': 'Tunisia', 'value': 'tn'},
                                    {'label': 'Turkey', 'value': 'tr'},
                                    {'label': 'Republic of Trinidad and Tobago', 'value': 'tt'},
                                    {'label': 'Taiwan', 'value': 'tw'},
                                    {'label': 'Tanzania', 'value': 'tz'},
                                    {'label': 'Ukraine', 'value': 'ua'},
                                    {'label': 'Uganda', 'value': 'ug'},
                                    {'label': 'United States of America', 'value': 'us'},
                                    {'label': 'United Kingdom', 'value': 'gb'},
                                    {'label': 'Uruguay', 'value': 'uy'},
                                    {'label': 'Uzbekistan', 'value': 'uz'},
                                    {'label': 'Saint Vincent and the Grenadines', 'value': 'vc'},
                                    {'label': 'Venezuela', 'value': 've'},
                                    {'label': 'British Virgin Islands', 'value': 'vg'},
                                    {'label': 'Vietnam', 'value': 'vn'},
                                    {'label': 'Yemen', 'value': 'ye'},
                                    {'label': 'South Africa', 'value': 'za'},
                                    {'label': 'Zimbabwe', 'value': 'zw'}
                                ],
                                'help': 'WARNING: This can cause unexpected side affects. This is not advised. On most cases, the webapp will force you to your Apple ID Region or Region based on IP.'
                            },
                            { // Forcing Application Mode / Theme
                                'label': 'forceApplicationMode',
                                'key': 'forceApplicationMode',
                                'type': 'dropdown',
                                'options': [
                                    {'label': 'Dark Mode', 'value': 'dark'},
                                    {'label': 'Light Mode', 'value': 'light'}
                                ],
                                'help': 'If you want the application to be in a mode that your system is not using by default.'
                            },
                            {
                                'key': 'alwaysOnTop',
                                'type': 'checkbox',
                                'options': [
                                    {'label': 'alwaysOnTop', 'value': true}
                                ]
                            },
                            { // Turning on autoUpdaterBetaBuilds
                                'key': 'autoUpdaterBetaBuilds',
                                'type': 'checkbox',
                                'options': [
                                    {'label': 'autoUpdaterBetaBuilds', 'value': true}
                                ]
                            },
                            { // Turning on useBeta
                                'key': 'useBetaSite',
                                'type': 'checkbox',
                                'options': [
                                    {'label': 'useBeta', 'value': true}
                                ]
                            },
                            { // Turning on preventMediaKeyHijacking
                                'key': 'preventMediaKeyHijacking',
                                'type': 'checkbox',
                                'options': [
                                    {'label': 'preventMediaKeyHijacking', 'value': true}
                                ]
                            },
                            { // Turning on discordClearActivityOnPause
                                'key': 'discordClearActivityOnPause',
                                'type': 'checkbox',
                                'options': [
                                    {'label': 'discordClearActivityOnPause', 'value': true}
                                ]
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
                            { // Turning on forceDisableWindowFrame
                                'key': 'forceDisableWindowFrame',
                                'type': 'checkbox',
                                'options': [
                                    {'label': 'forceDisableWindowFrame', 'value': true}
                                ],
                                'help': 'This is for linux users who use a tiling window manager.'
                            },
                            { // Turning on menuBarVisible
                                'key': 'menuBarVisible',
                                'type': 'checkbox',
                                'options': [
                                    {'label': 'menuBarVisible', 'value': true}
                                ]
                            },
                            { // Turning on removeScrollbars
                                'key': 'removeScrollbars',
                                'type': 'checkbox',
                                'options': [
                                    {'label': 'removeScrollbars', 'value': true}
                                ]
                            },
                            { // Development Tools
                                'heading': 'Development Tools',
                                'content': `The following options are made for development of the application and/or themes.`,
                                'type': 'message'
                            },
                            { // Turning on devTools
                                'key': 'devTools',
                                'type': 'dropdown',
                                'options': [
                                    {'label': 'Detached', 'value': 'detached'},
                                    {'label': 'Built-in', 'value': 'built-in'}
                                ],
                                'help': 'This allows users to access the chrome developer tools. Find more information at https://developer.chrome.com/docs/devtools/'
                            },
                            { // Theme Development (Prevents copying and replacing existing themes)
                                'key': 'themeDevelopment',
                                'type': 'checkbox',
                                'options': [
                                    {'label': 'themeDevelopment', 'value': true}
                                ],
                                'help': 'This prevents copying and replacing existing themes when launched.'
                            },
                            { // Turning on allowMultipleInstances
                                'key': 'allowMultipleInstances',
                                'type': 'checkbox',
                                'options': [
                                    {'label': 'allowMultipleInstances', 'value': true}
                                ]
                            },
                        ],
                    }]
                }
            },
            {
                'id': 'Credits',
                'label': 'Credits',
                'icon': 'multiple-11',
                'form': {
                    'groups': [
                        {
                            'label': 'Credits',
                            'fields': [
                                {
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

    // Check the Configuration File
    const ExistingConfigurationPath = path.resolve(app.getPath('userData'), 'preferences.json');

    // Update the configuration
    try {
        console.log(`[OpenMenu][ConfigurationCheck] Checking for existing configuration at '${ExistingConfigurationPath}'`)
        if (fs.existsSync(ExistingConfigurationPath)) {
            console.log(`[OpenMenu][ConfigurationCheck] '${ExistingConfigurationPath}' exists!`)
            const data = fs.readFileSync(ExistingConfigurationPath, {encoding:'utf8', flag:'r'});
            const userConfiguration = JSON.parse(data.toString())
            const baseConfiguration = app.preferences.defaults;

            Object.keys(baseConfiguration).forEach(function (parentKey) {
                if (parentKey in userConfiguration) {
                    Object.keys(baseConfiguration[parentKey]).forEach(function (childKey) {
                        if (!userConfiguration[parentKey].hasOwnProperty(childKey)) {
                            console.log(`[OpenMenu][ConfigurationCheck][MissingKey] ${parentKey}.${childKey} - Value found in defaults: ${(baseConfiguration[parentKey][childKey]).toString() ? baseConfiguration[parentKey][childKey].toString() : '[]'}`)
                            app.preferences.value(`${parentKey}.${childKey}`, baseConfiguration[parentKey][childKey]);
                        }
                    })
                } else {
                    console.log(`[OpenMenu][ConfigurationCheck][MissingKey] ${parentKey} - Value found in defaults: ${(baseConfiguration[parentKey]).toString() ? (baseConfiguration[parentKey]).toString() : '[]'}`)
                    app.preferences.value(parentKey, baseConfiguration[parentKey]);
                }
            })
        }
    } catch (err) {
        console.log(`[OpenMenu][ConfigurationCheck] ${err}`)
    }

    app.whenReady().then(() => {
        globalShortcut.register(app.preferences.value('advanced.settingsMenuKeybind'), () => {
            app.preferences.show();
        })

    })
}