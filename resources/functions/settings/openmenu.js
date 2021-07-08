const path = require('path');
const os = require('os');
const ElectronPreferences = require('electron-preferences');
const { app, globalShortcut } = require('electron')

exports.settingsmenuinit = function() {
    const settingsmenu = new ElectronPreferences({
        'dataStore': path.resolve(app.getPath('userData'), 'preferences.json'),
        /**
         * Default values.
         */
        'defaults': {
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
                                    'label': 'LastFM',
                                    'key': 'lastfm.enabled',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'LastFM Scrobbling', 'value': true }
                                    ],
                                    'help': 'Enable this option and fill out the the Authentication Key to use LastFM scrobbling.'
                                },
                                { // LastFM Auth Key
                                    'label': 'LastFM Authentication Key',
                                    'key': 'lastfm.authKey',
                                    'type': 'text',
                                    'help': 'Enter your authentication key you get from this link https://www.last.fm/api/auth?api_key=174905d201451602407b428a86e8344d&cb=https://cryptofyre.org/auth/lastfm/ to enable LastFM scrobbling.'
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
                                    'heading': 'Important Message',
                                    'content': '<p>These settings require an app restart to take effect.</p>',
                                    'type': 'message',
                                },
                                // Setting Your Theme
                                {
                                    'label': 'Themes:',
                                    'key': 'cssTheme',
                                    'type': 'dropdown',
                                    'options': [
                                        {'label': 'Default', 'value': 'default'},
                                        {'label': 'Blurple', 'value': 'blurple'},
                                        {'label': 'Blurple-Dark', 'value': 'blurple-dark'},
                                        {'label': 'Dracula', 'value': 'dracula'},
                                        {'label': 'Jungle', 'value': 'jungle'},
                                        {'label': 'Spotify', 'value': 'spotify'},
                                        {'label': 'OLED Dark', 'value': 'oled-dark'}
                                    ],
                                    'help': 'Select a theme'
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
                                // Turning on allowMultipleInstances
                                {
                                    'label': 'allowMultipleInstances',
                                    'key': 'allowMultipleInstances',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'allowMultipleInstances', 'value': true }
                                    ],
                                    'help': 'tba'
                                },
                                // Turning on autoUpdaterBetaBuilds
                                {
                                    'label': 'autoUpdaterBetaBuilds',
                                    'key': 'autoUpdaterBetaBuilds',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'autoUpdaterBetaBuilds', 'value': true }
                                    ],
                                    'help': 'tba'
                                },
                                // Turning on enableDevTools
                                {
                                    'label': 'enableDevTools',
                                    'key': 'enableDevTools',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'enableDevTools', 'value': true }
                                    ],
                                    'help': 'tba'
                                },
                                // Turning on forceDisableWindowFrame
                                {
                                    'label': 'forceDisableWindowFrame',
                                    'key': 'forceDisableWindowFrame',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'forceDisableWindowFrame', 'value': true }
                                    ],
                                    'help': 'tba'
                                },
                                // Turning on forceApplicationLanguage
                                {
                                    'label': 'forceApplicationLanguage',
                                    'key': 'forceApplicationLanguage',
                                    'type': 'text',
                                    'help': 'tba'
                                },
                                // Turning on forceApplicationRegion
                                {
                                    'label': 'forceApplicationRegion',
                                    'key': 'forceApplicationRegion',
                                    'type': 'text',
                                    'help': 'tba'
                                },
                                // Turning on forceDarkMode
                                {
                                    'label': 'forceDarkMode',
                                    'key': 'forceDarkMode',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'forceDarkMode', 'value': true }
                                    ],
                                    'help': 'tba'
                                },
                                // Turning on menuBarVisible
                                {
                                    'label': 'menuBarVisible',
                                    'key': 'menuBarVisible',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'menuBarVisible', 'value': true }
                                    ],
                                    'help': 'tba'
                                },
                                // Turning on removeScrollbars
                                {
                                    'label': 'removeScrollbars',
                                    'key': 'removeScrollbars',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'removeScrollbars', 'value': true }
                                    ],
                                    'help': 'tba'
                                },
                                // Turning on useBeta
                                {
                                    'label': 'useBeta',
                                    'key': 'useBeta',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'useBeta', 'value': true }
                                    ],
                                    'help': 'tba'
                                },
                                // Turning on preventMediaKeyHijacking
                                {
                                    'label': 'preventMediaKeyHijacking',
                                    'key': 'preventMediaKeyHijacking',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'preventMediaKeyHijacking', 'value': true }
                                    ],
                                    'help': 'tba'
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
            settingsmenu.show();
        })
    })
}
