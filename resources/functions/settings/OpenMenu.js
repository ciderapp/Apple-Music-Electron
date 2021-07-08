const path = require('path');
const os = require('os');
const ElectronPreferences = require('electron-preferences');
const { app, globalShortcut } = require('electron')

exports.SettingsMenuInit = function() {
    const SettingsMenu = new ElectronPreferences({
        'dataStore': path.resolve(app.getPath('userData'), 'preferences.json'),
        /**
         * Default values.
         */
        'defaults': {
            "quick": {
                "authMode": [],
                "lastfmEnabled": [],
                "lastfmAuthKey": "Put your Auth Key here."
            },
            "css": {
                "cssTheme": "",
                "emulateMacOS": [
                    true
                ],
                "transparencyMode": [
                    true
                ],
                "streamerMode": []
            },
            "preferences": {
                "closeButtonMinimize": [
                    true
                ],
                "discordRPC": [
                    true
                ],
                "playbackNotifications": [
                    true,
                    "minimized"
                ],
                "trayTooltipSongName": [
                    true
                ]
            },
            "advanced": {
                "allowMultipleInstances": [],
                "autoUpdaterBetaBuilds": [],
                "enableDevTools": [],
                "forceDisableWindowFrame": [],
                "forceApplicationLanguage": "",
                "forceApplicationRegion": "",
                "forceDarkMode": [],
                "menuBarVisible": [],
                "removeScrollbars": [
                    true
                ],
                "useBeta": [
                    true
                ],
                "preventMediaKeyHijacking": []
            }
        },
        'sections': [
            {
                // New Section for Quick Settings
                'id': 'quick',
                'label': 'Quick Settings',
                'icon': 'settings-gear-63',
                'form': {
                    'groups': [
                        {
                            // Quick Settings Page Contents
                            'label': 'Quick Settings',
                            'fields': [
                                { // Auth Mode
                                    'label': 'Authentication Mode',
                                    'key': 'authMode',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'Auth Mode', 'value': true },
                                    ],
                                    'help': 'Enable Authentication Mode to allow some users to sign in.'
                                },
                                { // LastFM
                                    'heading': 'LastFM Notice',
                                    'content': '<p>For information regarding this section, read the wiki post found <a style="color: #227bff !important" target="_blank" href="https://github.com/cryptofyre/Apple-Music-Electron/wiki/LastFM">here</a>.</p>',
                                    'type': 'message',
                                },
                                { // LastFM Toggle
                                    'key': 'lastfmEnabled',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'LastFM Scrobbling', 'value': true }
                                    ],
                                    'help': 'Enable this option and fill out the the Authentication Key to use LastFM scrobbling.'
                                },
                                { // LastFM Auth Key
                                    'label': 'LastFM Authentication Key',
                                    'key': 'lastfmAuthKey',
                                    'type': 'text',
                                    'help': 'Read the notice above for more information regarding what you need to put in this field.'
                                }
                            ]
                        }
                    ]
                }
            },
            {
                // New Section for Themes and CSS
                'id': 'css',
                'label': 'Themes and CSS Features',
                'icon': 'layers-3',
                'form': {
                    'groups': [
                        {
                            // Section Header (Again)
                            'label': 'Themes and CSS Features',
                            'fields': [
                                {
                                    'heading': 'Themes Notice',
                                    'content': '<p>You can preview all the themes <a style="color: #227bff !important" target="_blank" href="https://github.com/cryptofyre/Apple-Music-Electron/wiki/Theme-Preview-Images">here</a>.</p>',
                                    'type': 'message'
                                },
                                // Setting Your Theme
                                {
                                    'label': 'Themes:',
                                    'key': 'cssTheme',
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
                                // MacOS Application Emulation
                                {
                                    'label': 'emulate MacOS Interface',
                                    'key': 'emulateMacOS',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'Turn on emulateMacOS?', 'value': true },
                                        { 'label': 'Would you like it aligned to the right (Like Windows)', 'value': 'rightAlign' },
                                    ],
                                    'help': 'This enables various adjustments that make the Apple Music interface look like the MacOS Apple Music UI. Enabling rightAlign will replicate the Windows Operating System\'s Window Control.'
                                },
                                // Turning on transparency
                                {
                                    'label': 'Transparency',
                                    'key': 'transparencyMode',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'Enable Transparency', 'value': true }
                                    ],
                                    'help': 'This enables the transparency affect for the Apple Music UI. This can affect performance if you are using older hardware.'
                                },
                                // Streaming Mode
                                {
                                    'label': 'Streaming Mode',
                                    'key': 'streamerMode',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'Enable Streaming Mode', 'value': true }
                                    ],
                                    'help': 'Enabling this will remove certain personal elements (your profile picture) and will allow you to scale the app to a size that allows you to use it in streams.'
                                }
                            ]
                        }
                    ]
                }
            },
            {
                'id': 'preferences',
                'label': 'User Preferences',
                'icon': 'preferences',
                'form': {
                    'groups': [
                        {
                            'label': 'User Preferences',
                            'fields': [
                                // Turning on closeButtonMinimize
                                {
                                    'label': 'Close Button Minimize',
                                    'key': 'closeButtonMinimize',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'Close Button Should Minimize Application', 'value': true }
                                    ],
                                    'help': 'Should the close button minimize your apple music or should it quit the app.'
                                },
                                // Turning on discordRPC
                                {
                                    'label': 'Discord Rich Presence',
                                    'key': 'discordRPC',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'DiscordRPC', 'value': true }
                                    ],
                                    'help': 'Enable/Disable Discord Rich Presence.'
                                },
                                // Turning on playbackNotifications
                                {
                                    'label': 'Notifications on Song Change',
                                    'key': 'playbackNotifications',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'Playback Notifications', 'value': true },
                                        { 'label': 'Playback Notifications when Minimized or Hidden', 'value': 'minimized' }
                                    ],
                                    'help': 'Enabling this means you will get notifications when you change song. The minimized option forces notifications to only appear if the app is hidden / minimized.'
                                },
                                // Turning on trayTooltipSongName
                                {
                                    'label': 'Show Song Name as Tray Icon Tooltip',
                                    'key': 'trayTooltipSongName',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'Tray Icon Tooltip Song Name', 'value': true }
                                    ],
                                    'help': 'Enabling this option allows you to see the song name in the tooltip on the taskbar when the application is minimized to the tray.'
                                },
                            ],
                        }
                    ]
                }
            },
            {
                'id': 'advanced',
                'label': 'Advanced Options',
                'icon': 'preferences',
                'form': {
                    'groups': [
                        {
                            'label': 'User Preferences',
                            'fields': [
                                {
                                    'heading': 'Warning',
                                    'content': "<p><b>Do not mess with these options unless you know what you're doing.</b></p>",
                                    'type': 'message'
                                },
                                // Turning on allowMultipleInstances
                                {
                                    'key': 'allowMultipleInstances',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'allowMultipleInstances', 'value': true }
                                    ]
                                },
                                // Turning on autoUpdaterBetaBuilds
                                {
                                    'key': 'autoUpdaterBetaBuilds',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'autoUpdaterBetaBuilds', 'value': true }
                                    ]
                                },
                                // Turning on enableDevTools
                                {
                                    'key': 'enableDevTools',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'enableDevTools', 'value': true }
                                    ]
                                },
                                // Turning on forceDisableWindowFrame
                                {
                                    'key': 'forceDisableWindowFrame',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'forceDisableWindowFrame', 'value': true }
                                    ]
                                },
                                // Turning on forceApplicationLanguage
                                {
                                    'label': 'forceApplicationLanguage',
                                    'key': 'forceApplicationLanguage',
                                    'type': 'text',
                                },
                                // Turning on forceApplicationRegion
                                {
                                    'label': 'forceApplicationRegion',
                                    'key': 'forceApplicationRegion',
                                    'type': 'text',
                                },
                                // Turning on forceDarkMode
                                {
                                    'key': 'forceDarkMode',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'forceDarkMode', 'value': true }
                                    ]
                                },
                                // Turning on menuBarVisible
                                {
                                    'key': 'menuBarVisible',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'menuBarVisible', 'value': true }
                                    ]
                                },
                                // Turning on removeScrollbars
                                {
                                    'key': 'removeScrollbars',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'removeScrollbars', 'value': true }
                                    ]
                                },
                                // Turning on useBeta
                                {
                                    'key': 'useBeta',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'useBeta', 'value': true }
                                    ]
                                },
                                // Turning on preventMediaKeyHijacking
                                {
                                    'key': 'preventMediaKeyHijacking',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'preventMediaKeyHijacking', 'value': true }
                                    ]
                                },
                            ],
                        }
                    ]
                }
            }
        ],
        browserWindowOpts: {
            'title': 'Settings',
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
        globalShortcut.register('Alt+CommandOrControl+S', () => {
            SettingsMenu.show();
        })
    })
}
