const path = require('path');
const os = require('os');
const ElectronPreferences = require('electron-preferences');
const { app, globalShortcut } = require('electron')

exports.settingsmenuinit = function() {
    const settingsmenu = new ElectronPreferences({
        'dataStore': path.resolve(app.getPath('userData'), 'preferences.json'),
        'defaults': {
            // remind me to set this up later
        },
        'sections': [
            {
                'id': 'quick',
                'label': 'Quick Settings',
                'icon': 'notes',
                'form': {
                    'groups': [
                        {
                            'label': 'Quick Settings',
                            'fields': [
                                {
                                    'label': 'Authentication Mode',
                                    'key': 'Enable Auth Mode',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'Auth Mode', 'value': 'authEnabled' },
                                    ],
                                    'help': 'Enable Authentication Mode to allow some users to sign in.'
                                },
                                {
                                    'label': 'LastFM',
                                    'key': 'lastfm',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'LastFM Scrobbling', 'value': 'lastfmEnabled' }
                                    ],
                                    'help': 'Enable this option and fill out the the Authentication Key to use LastFM scrobbling.'
                                },
                                {
                                    'label': 'LastFM Authentication Key',
                                    'key': 'lastfm-authkey',
                                    'type': 'text',
                                    'help': 'Enter your authentication key you get from this link https://www.last.fm/api/auth?api_key=174905d201451602407b428a86e8344d&cb=https://cryptofyre.org/auth/lastfm/ to enable LastFM scrobbling.'
                                },
                                {
                                    'label': 'Discord RPC',
                                    'key': 'discordrpc',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'Discord RPC', 'value': 'discordrpcEnabled' }
                                    ],
                                    'help': 'Enabling this allows other users on Discord to see what your listening to.'
                                },
                                {
                                    'label': 'Streamer Mode',
                                    'key': 'streamerMode',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'Streamer Mode', 'value': 'streamerModeEnabled' }
                                    ],
                                    'help': 'Enabling this option allows you to show off your Music to your stream without showing personal data.'
                                },
                                {
                                    'label': 'Force Application Language',
                                    'key': 'appLang',
                                    'type': 'text',
                                    'help': 'Enter a language ex. en or fr'
                                },
                                {
                                    'label': 'Force Application Region',
                                    'key': 'appRegion',
                                    'type': 'text',
                                    'help': 'Enter a region ex. ca or de'
                                },

                            ]
                        }
                    ]
                }
            },
            {
                'id': 'theme',
                'label': 'Themes',
                'icon': 'layers-3',
                'form': {
                    'groups': [
                        {
                            'label': 'Theme Settings',
                            'fields': [
                                {
                                    'heading': 'Important Message',
                                    'content': '<p>These settings require an app restart to take effect.</p>',
                                    'type': 'message',
                                },
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
                                {
                                    'label': 'Window Settings',
                                    'key': 'css',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'emulateMacOS', 'value': 'emumacosEnabled' },
                                        { 'label': 'emulateMacOS Right Align', 'value': 'emumacosRightAlignEnabled'}
                                    ],
                                    'help': 'These options allow you to control Window behavior.'
                                },
                                {
                                    'label': 'Transparency',
                                    'key': 'transparency',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'Enable Transparency', 'value': 'transparentEnabled' }
                                    ],
                                    'help': 'Enable Glasstron transparency'
                                },
                            ]
                        }
                    ]
                }
            },
            {
                'id': 'others',
                'label': 'Other Settings',
                'icon': 'preferences',
                'form': {
                    'groups': [
                        {
                            'label': 'Other Settings',
                            'fields': [
                                {
                                    'label': 'Extras',
                                    'key': 'extras',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'Minimize to tray', 'value': 'trayEnabled' },
                                        { 'label': 'Show Song on tray', 'value': 'traySongEnabled' },
                                        { 'label': 'Song Notifications', 'value': 'notificationsEnabled' },
                                        { 'label': 'Song Notifications when Minimized', 'value': 'minnotificationsEnabled' },
                                    ],
                                    'help': 'Enabling these options allows you to use extra features supported by Apple Music Electron'
                                },
                                {
                                    'label': 'Advanced',
                                    'key': 'advanced',
                                    'type': 'checkbox',
                                    'options': [
                                        { 'label': 'allowMultipleInstances', 'value': 'multipleInstancesEnabled' },
                                        { 'label': 'Enable Beta Versions', 'value': 'betaversEnabled' },
                                        { 'label': 'Enable Dev Tools', 'value': 'devtoolsEnabled' },
                                        { 'label': 'Force Dark Mode', 'value': 'forcedarkEnabled' },
                                        { 'label': 'Show Menu Bar', 'value': 'menubarEnabled' },
                                        { 'label': 'Remove Scrollbars', 'value': 'noscrollsEnabled' },
                                        { 'label': 'Use Beta Site', 'value': 'usebetaSiteEnabled' },
                                        { 'label': 'Prevent Media Key Hijacking', 'value': 'preventmediaKeyHijackingEnabled' },
                                    ],
                                    'help': 'These options should only be touched if you know what your doing.'
                                },
                            ]
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
