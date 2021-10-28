const {app, Menu, ipcMain, shell, dialog, Notification, BrowserWindow, systemPreferences, nativeTheme, clipboard} = require('electron'),
    {join} = require('path'),
    {readFile, readFileSync ,writeFile} = require('fs'),
    rimraf = require('rimraf'),
    {initAnalytics} = require('./utils'),
    { RtAudio, RtAudioFormat, RtAudioApi } = require("audify");

    const os =  require('os');
    const mdns = require('mdns-js');
    const ssdp = require('node-ssdp-lite');
    const express = require('express');
    const audioClient = require('castv2-client').Client;
    const DefaultMediaReceiver = require('castv2-client').DefaultMediaReceiver;
    var getPort = require('get-port');
    const { Stream } = require('stream');

initAnalytics();

const handler = {

    LaunchHandler: function () {
        // Version Fetch
        if (app.commandLine.hasSwitch('version') || app.commandLine.hasSwitch('v')) {
            console.log(app.getVersion())
            app.exit()
        }

        // Verbose Check
        if (app.commandLine.hasSwitch('verbose')) {
            console.log("[Apple-Music-Electron] User has launched the application with --verbose");
        }

        // Log File Location
        if (app.commandLine.hasSwitch('log') || app.commandLine.hasSwitch('l')) {
            console.log(join(app.getPath('userData'), 'logs'))
            app.exit()
        }
    },

    InstanceHandler: function () {
        console.verbose('[InstanceHandler] Started.')

        app.on('second-instance', (_e, argv) => {
            console.warn(`[InstanceHandler][SecondInstanceHandler] Second Instance Started with args: [${argv.join(', ')}]`)

            // Checks if first instance is authorized and if second instance has protocol args
            argv.forEach((value) => {
                if (value.includes('ame://') || value.includes('itms://') || value.includes('itmss://') || value.includes('musics://') || value.includes('music://')) {
                    console.warn(`[InstanceHandler][SecondInstanceHandler] Found Protocol!`)
                    handler.LinkHandler(value);
                }
            })

            if (argv.includes("--force-quit")) {
                console.warn('[InstanceHandler][SecondInstanceHandler] Force Quit found. Quitting App.');
                app.isQuiting = true
                app.quit()
            } else if (app.win && !app.cfg.get('advanced.allowMultipleInstances')) { // If a Second Instance has Been Started
                console.warn('[InstanceHandler][SecondInstanceHandler] Showing window.');
                app.win.show()
                app.win.focus()
            }
        })

        if (!app.requestSingleInstanceLock() && !app.cfg.get('advanced.allowMultipleInstances')) {
            console.warn("[InstanceHandler] Existing Instance is Blocking Second Instance.");
            app.quit();
            app.isQuiting = true
        }
    },

    PlaybackStateHandler: function () {
        console.verbose('[playbackStateDidChange] Started.');

        ipcMain.on('playbackStateDidChange', (_event, a) => {
            console.verbose('[handler] playbackStateDidChange received.');
            app.media = a;

            app.ame.win.SetButtons()
            app.ame.win.SetTrayTooltip(a)
            app.ame.discord.updateActivity(a)
            app.ame.lastfm.scrobbleSong(a)
            app.ame.lastfm.updateNowPlayingSong(a)
            app.ame.mpris.updateState(a)
        });
    },

    MediaStateHandler: function () {
        console.verbose('[MediaStateHandler] Started.');

        ipcMain.on('nowPlayingItemDidChange', (_event, a) => {
            console.verbose('[handler] nowPlayingItemDidChange received.');
            app.media = a;

            app.ame.win.CreateNotification(a);
            app.ame.mpris.updateActivity(a);

            if (app.cfg.get('audio.seemlessAudioTransitions')) {
                app.ame.win.SetButtons()
                app.ame.win.SetTrayTooltip(a)
                app.ame.discord.updateActivity(a)
                app.ame.lastfm.scrobbleSong(a)
                app.ame.lastfm.updateNowPlayingSong(a)
                app.ame.mpris.updateState(a)
            }
        });
    },

    WindowStateHandler: function () {
        console.verbose('[WindowStateHandler] Started.');

        app.win.webContents.setWindowOpenHandler(({url}) => {
            shell.openExternal(url).then(() => console.log(`[WindowStateHandler] User has opened ${url} which has been redirected to browser.`));
            return {
                action: 'deny'
            }
        })

        let incognitoNotification;
        app.win.webContents.on('did-finish-load', () => {
            console.verbose('[did-finish-load] Completed.');
            app.ame.load.LoadOneTimeFiles();
            app.win.webContents.setZoomFactor(parseFloat(app.cfg.get("visual.scaling")))
            if (app.cfg.get('general.incognitoMode') && !incognitoNotification) {
                incognitoNotification = new Notification({
                    title: 'Incognito Mode Enabled',
                    body: `Listening activity is hidden.`,
                    icon: join(__dirname, '../icons/icon.png')
                })
                incognitoNotification.show()
            }
        });

        app.win.webContents.on('did-fail-load', (event, errCode, errDesc, url, mainFrame) => {
            console.error(`Error Code: ${errCode}\nLoading: ${url}\n${errDesc}`)
            if (mainFrame) {
                app.exit()
            }
        });

        // Windows specific: Handles window states
        // Needed because Aero Snap events do not send the same way as clicking the frame buttons.
        if (process.platform === "win32" && app.cfg.get('visual.frameType') !== 'mac' || app.cfg.get('visual.frameType') !== 'mac-right') {
            var WND_STATE = {
                MINIMIZED: 0,
                NORMAL: 1,
                MAXIMIZED: 2,
                FULL_SCREEN: 3
            }
            var wndState = WND_STATE.NORMAL

            app.win.on("resize", (_event) => {
                const isMaximized = app.win.isMaximized()
                const isMinimized = app.win.isMinimized()
                const isFullScreen = app.win.isFullScreen()
                const state = wndState;
                if (isMinimized && state !== WND_STATE.MINIMIZED) {
                    wndState = WND_STATE.MINIMIZED
                } else if (isFullScreen && state !== WND_STATE.FULL_SCREEN) {
                    wndState = WND_STATE.FULL_SCREEN
                } else if (isMaximized && state !== WND_STATE.MAXIMIZED) {
                    wndState = WND_STATE.MAXIMIZED
                    app.win.webContents.executeJavaScript(`document.querySelector("#maximize").classList.add("maxed")`)
                } else if (state !== WND_STATE.NORMAL) {
                    wndState = WND_STATE.NORMAL
                    app.win.webContents.executeJavaScript(`document.querySelector("#maximize").classList.remove("maxed")`)
                }
            })
        }

        app.win.on('unresponsive', () => {
            dialog.showMessageBox({
                message: `${app.getName()} has become unresponsive`,
                title: 'Do you want to try forcefully reloading the app?',
                buttons: ['Yes', 'Quit', 'No'],
                cancelId: 1
            }).then(({response}) => {
                if (response === 0) {
                    app.win.contents.forcefullyCrashRenderer()
                    app.win.contents.reload()
                } else if (response === 1) {
                    console.log("[WindowStateHandler] Application has become unresponsive and has been closed.")
                    app.exit();
                }
            })
        })

        app.win.on('page-title-updated', (event, title) => {
            console.verbose(`[page-title-updated] Title updated Running necessary files. ('${title}')`)
            app.ame.load.LoadFiles();
        })

        app.win.on('close', (e) => {
            if (!app.isQuiting) {
                if (app.isMiniplayerActive) {
                    ipcMain.emit("set-miniplayer", false);
                    e.preventDefault()
                } else if (app.cfg.get('window.closeButtonMinimize') || process.platform === "darwin") {
                    app.win.hide()
                    e.preventDefault()
                }
            } else {
                app.win.destroy()
                if (app.lyrics.mxmWin) { app.lyrics.mxmWin.destroy(); }
                if (app.lyrics.neteaseWin) { app.lyrics.neteaseWin.destroy(); }
                if (app.lyrics.ytWin) { app.lyrics.ytWin.destroy(); }
            }
        })

        app.win.on('maximize', (e) => {
            if (app.isMiniplayerActive) {
                e.preventDefault()
            }
        })

        app.win.on('show', () => {
            app.ame.win.SetContextMenu(true)
            app.ame.win.SetButtons()
            if (app.win.isVisible()) {
                app.win.focus()
            }
        });

        app.win.on('hide', () => {
            app.ame.win.SetContextMenu(false)
            if (app.pluginsEnabled) {
                app.win.webContents.executeJavaScript(`_plugins.execute('OnHide')`)
            }
        });
    },

    SettingsHandler: function () {
        console.verbose('[SettingsHandler] Started.');
        let DialogMessage = false,
            storedChanges = [],
            handledConfigs = [];

        systemPreferences.on('accent-color-changed', (event, color) => {
            if (color && app.cfg.get('visual.useOperatingSystemAccent') && (process.platform === "win32" || process.platform === "darwin")) {
                const accent = '#' + color.slice(0, -2)
                app.win.webContents.insertCSS(`
                :root {
                    --keyColor: ${accent} !important;
                    --systemAccentBG: ${accent} !important;
                    --systemAccentBG-pressed: rgba(${app.ame.utils.hexToRgb(accent).r}, ${app.ame.utils.hexToRgb(accent).g}, ${app.ame.utils.hexToRgb(accent).b}, 0.75) !important;
                    --keyColor-rgb: ${app.ame.utils.hexToRgb(accent).r} ${app.ame.utils.hexToRgb(accent).g} ${app.ame.utils.hexToRgb(accent).b} !important;
                }`).then((key) => {
                    app.injectedCSS['useOperatingSystemAccent'] = key
                })
            }
        })

        /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        *  Restart Required Configuration Handling
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */

        app.cfg.onDidAnyChange((newConfig, oldConfig) => {
            let currentChanges = [];

            for (const [categoryTitle, categoryContents] of Object.entries(newConfig)) {
                if (categoryContents !== oldConfig[categoryTitle]) { // This has gotten the changed category
                    for (const [settingTitle, settingValue] of Object.entries(newConfig[categoryTitle])) {
                        if (JSON.stringify(settingValue) !== JSON.stringify(oldConfig[categoryTitle][settingTitle])) {
                            currentChanges.push(`${categoryTitle}.${settingTitle}`)
                            if (!storedChanges.includes(`${categoryTitle}.${settingTitle}`)) {
                                storedChanges.push(`${categoryTitle}.${settingTitle}`)
                            }
                        }
                    }
                }
            }

            console.verbose(`[SettingsHandler] Found changes: ${currentChanges} | Total Changes: ${storedChanges}`);

            if (!DialogMessage && !currentChanges.includes('tokens.lastfm') && !currentChanges.includes('window.closeButtonMinimize') && !handledConfigs.includes(currentChanges[0])) {
                DialogMessage = dialog.showMessageBox({
                    title: "Relaunch Required",
                    message: "A relaunch is required in order for the settings you have changed to apply.",
                    type: "warning",
                    buttons: ['Relaunch Now', 'Relaunch Later']
                }).then(({response}) => {
                    if (response === 0) {
                        app.relaunch()
                        app.quit()
                    }
                })
            }
        })

        /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
        *  Individually Handled Configuration Options
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
        handledConfigs.push('advanced.devToolsOnStartup', 'general.storefront', 'tokens.lastfm') // Stuff for the restart to just ignore

        // Theme Changes
        handledConfigs.push('visual.theme');
        app.cfg.onDidChange('visual.theme', (newValue, _oldValue) => {
            app.win.webContents.executeJavaScript(`AMStyling.loadTheme("${(newValue === 'default' || !newValue) ? '' : newValue}");`).catch((e) => console.error(e));
            const updatedVibrancy = app.ame.utils.fetchTransparencyOptions();
            if (app.transparency && updatedVibrancy && process.platform !== 'darwin') app.win.setVibrancy(updatedVibrancy);
        })

        // Transparency Changes
        handledConfigs.push('visual.transparencyEffect', 'visual.transparencyTheme', 'visual.transparencyDisableBlur', 'visual.transparencyMaximumRefreshRate');
        app.cfg.onDidChange('visual.transparencyEffect' || 'visual.transparencyTheme' || 'visual.transparencyDisableBlur' || 'visual.transparencyMaximumRefreshRate', (_newValue, _oldValue) => {
            const updatedVibrancy = app.ame.utils.fetchTransparencyOptions()
            if (app.transparency && updatedVibrancy && process.platform !== 'darwin') {
                app.win.setVibrancy(updatedVibrancy);
                app.win.webContents.executeJavaScript(`AMStyling.setTransparency(true);`).catch((e) => console.error(e));
            } else {
                app.win.setVibrancy();
                app.win.webContents.executeJavaScript(`AMStyling.setTransparency(false);`).catch((e) => console.error(e));
            }
        })

        // Reload scripts
        handledConfigs.push('visual.removeUpsell', 'visual.removeAppleLogo', 'visual.removeFooter', 'visual.useOperatingSystemAccent');
        app.cfg.onDidChange('visual.removeUpsell', (newValue, _oldValue) => {
            app.ame.load.LoadFiles();
        })
        app.cfg.onDidChange('visual.removeAppleLogo', (newValue, _oldValue) => {
            app.ame.load.LoadFiles();
        })
        app.cfg.onDidChange('visual.removeFooter', (newValue, _oldValue) => {
            app.ame.load.LoadFiles();
        })
        app.cfg.onDidChange('visual.useOperatingSystemAccent', (newValue, _oldValue) => {
            if (!newValue) {
                app.ame.win.removeInsertedCSS('useOperatingSystemAccent')
            } else {
                app.ame.load.LoadFiles();
            }
        })


        // IncognitoMode Changes
        handledConfigs.push('general.incognitoMode');
        app.cfg.onDidChange('general.incognitoMode', (newValue, _oldValue) => {
            if (newValue) {
                console.log("[Incognito] Incognito Mode enabled. DiscordRPC and LastFM updates are ignored.")
            }
        })

        // Scaling Changes
        handledConfigs.push('visual.scaling');
        app.cfg.onDidChange('visual.scaling', (newValue, _oldValue) => {
            app.win.webContents.setZoomFactor(parseFloat(newValue))
        });

        // Mode Changes
        handledConfigs.push('advanced.forceApplicationMode');
        app.cfg.onDidChange('advanced.forceApplicationMode', (newValue, _oldValue) => {
            nativeTheme.themeSource = newValue;
        });
    },

    RendererListenerHandlers: () => {

        // Showing the OOBE on first launch
        ipcMain.on('showOOBE', (event) => {
            event.returnValue = app.ame.showOOBE;
            app.ame.showOOBE = false
        })

        // Themes Listing Update
        ipcMain.handle('updateThemesListing', (_event) => {
            return app.ame.utils.fetchThemesListing();
        })

        // Plugins Listing Update
        ipcMain.handle('fetchPluginsListing', (_event) => {
            return app.ame.utils.fetchPluginsListing();
        })

        // Acrylic Check
        ipcMain.handle('isAcrylicSupported', (_event) => {
            return app.ame.utils.isAcrylicSupported();
        })

        // Electron-Store Renderer Handling for Getting Values
        ipcMain.handle('getStoreValue', (event, key, defaultValue) => {
            return (defaultValue ? app.cfg.get(key, true) : app.cfg.get(key));
        });

        // Electron-Store Renderer Handling for Setting Values
        ipcMain.handle('setStoreValue', (event, key, value) => {
            app.cfg.set(key, value);
        });

        // Copy Log File
        ipcMain.on('copyLogFile', (event) => {
            const data = readFileSync(app.log.transports.file.getFile().path, {encoding:'utf8', flag:'r'});
            clipboard.writeText(data)
            event.returnValue = true
        });

        // Electron-Store Renderer Handling for Getting Configuration
        ipcMain.on('getStore', (event) => {
            event.returnValue = app.cfg.store
        })

        // Electron-Store Renderer Handling for Setting Configuration
        ipcMain.on('setStore', (event, store) => {
            app.cfg.store = store
        })

        // Update Themes
        ipcMain.on('updateThemes', (_event) => {
            app.ame.utils.updateThemes().catch((e) => console.error(e))
        });

        // Authorization (This needs to be cleaned up a bit, an alternative to reload() would be good )
        ipcMain.on('authorizationStatusDidChange', (_event, authorized) => {
            console.log(`authorization updated. status: ${authorized}`)
            app.win.reload()
            app.ame.load.LoadFiles()
            app.isAuthorized = (authorized === 3)
        })

        // Window Navigation - Minimize
        ipcMain.on('minimize', () => { // listen for minimize event
            if (typeof app.win.minimize === 'function') {
                app.win.minimize()
            }
        });

        // Window Navigation - Maximize
        ipcMain.on('maximize', () => { // listen for maximize event and perform restore/maximize depending on window state

            if (app.win.isMaximized()) {
                app.win.unmaximize()
                if (process.platform !== "win32") {
                    app.win.webContents.executeJavaScript(`document.querySelector("#maximize").classList.remove("maxed")`)
                }
            } else {
                app.win.maximize()
                if (process.platform !== "win32") {
                    app.win.webContents.executeJavaScript(`document.querySelector("#maximize").classList.add("maxed")`)
                }
            }
        })

        // Window Navigation - Close
        ipcMain.on('close', () => { // listen for close event
            app.win.close();
        })

        // Window Navigation - Back
        ipcMain.on('back', () => { // listen for back event
            if (app.win.webContents.canGoBack()) {
                app.win.webContents.goBack()
            }
        })

        // Window Navigation - Resize
        ipcMain.on("resize-window", (event, width, height) => {
            app.win.setSize(width, height)
        })

        // miniPlayer
        const minSize = app.win.getMinimumSize()
        ipcMain.on("set-miniplayer", (event, val) => {
            if (val) {
                app.isMiniplayerActive = true;
                app.win.setSize(300, 300);
                app.win.setMinimumSize(300, 55);
                app.win.setMaximumSize(300, 300);
                app.win.maximizable = false;
                app.win.webContents.executeJavaScript("_miniPlayer.setMiniPlayer(true)").catch((e) => console.error(e));
                if (app.win.isMaximized) { app.win.unmaximize(); }
            } else {
                app.isMiniplayerActive = false;
                app.win.setMaximumSize(9999, 9999);
                app.win.setMinimumSize(minSize[0], minSize[1]);
                app.win.setSize(1024, 600);
                app.win.maximizable = true;
                app.win.webContents.executeJavaScript("_miniPlayer.setMiniPlayer(false)").catch((e) => console.error(e));
            }
        })

        ipcMain.on("show-miniplayer-menu", () => {
            const menuOptions = [{
                type: "checkbox",
                label: "Always On Top",
                click: () => {
                    if (app.win.isAlwaysOnTop()) {
                        app.win.setAlwaysOnTop(false, 'screen')
                    } else {
                        app.win.setAlwaysOnTop(true, 'screen')
                    }
                },
                checked: app.win.isAlwaysOnTop()
            }, {
                label: "Exit Mini Player",
                click: () => {
                    ipcMain.emit("set-miniplayer", false)
                }
            },
            //     {
            //     label: "Full Screen Miniplayer",
            //     click: () => {
            //         ipcMain.emit("set-miniplayerLarge", false)
            //     }
            // }
        ]
            const menu = Menu.buildFromTemplate(menuOptions)
            menu.popup(app.win)
        })

        ipcMain.on("alwaysOnTop", (event, val) => {
            if (val) {
                app.win.setAlwaysOnTop(true, 'screen')
            } else {
                app.win.setAlwaysOnTop(false, 'screen')
            }
        })

        ipcMain.on("load-plugin", (event, plugin) => {
            let path = join(app.userPluginsPath, plugin.toLowerCase() + ".js")
            readFile(path, "utf-8", (error, data) => {
                if (!error) {
                    try {
                        app.win.webContents.executeJavaScript(data).then(() => {
                            console.verbose(`[Plugins] Injected Plugin`)
                        })
                    } catch (err) {
                        console.error(`[Plugins] error injecting plugin: ${path} - Error: ${err}`)
                    }
                } else {
                    console.error(`[Plugins] error reading plugin: ${path} - Error: ${error}`)
                }
            })
        })

        // Get Wallpaper
        ipcMain.on("get-wallpaper", (event) => {
            function base64_encode(file) {
                var bitmap = readFileSync(file)
                return `data:image/png;base64,${new Buffer(bitmap).toString('base64')}`
            }

            let spawn = require("child_process").spawn, child;
            child = spawn("powershell.exe", [`Get-ItemProperty -Path Registry::"HKCU\\Control Panel\\Desktop\\" -Name "Wallpaper" | ConvertTo-JSON`])
            child.stdout.on("data", function (data) {
                console.log("Powershell Data: " + data)
                const parsed = JSON.parse(data);
                event.returnValue = base64_encode(parsed["WallPaper"])
            })
            child.stderr.on("data", function (data) {
                console.log("Powershell Errors: " + data)
            })
            child.on("exit", function () {
                console.log("Powershell Script finished")
            })
            child.stdin.end()
        })

        // Set BrowserWindow zoom factor
        ipcMain.on("set-zoom-factor", (event, factor)=>{
            app.win.webContents.setZoomFactor(factor)
        })

    },

    LinkHandler: function (startArgs) {
        if (!startArgs || !app.win || !app.isAuthorized) return;


        if (String(startArgs).includes('auth')) {
            let authURI = String(startArgs).split('/auth/')[1]
            if (authURI.startsWith('lastfm')) { // If we wanted more auth options
                const authKey = authURI.split('lastfm?token=')[1];
                app.cfg.set('general.lastfm', true);
                app.cfg.set('tokens.lastfm', authKey);
                app.win.webContents.send('LastfmAuthenticated', authKey);
                app.ame.lastfm.authenticate()
            }
        } else {
            if (!app.isAuthorized) return
            const formattedSongID = startArgs.replace('ame://', '').replace('/', '');
            console.warn(`[LinkHandler] Attempting to load song id: ${formattedSongID}`);

            // setQueue can be done with album, song, url, playlist id
            app.win.webContents.executeJavaScript(`
                MusicKit.getInstance().setQueue({ song: '${formattedSongID}'}).then(function(queue) {
                    MusicKit.getInstance().play();
                });
            `).catch((err) => console.error(err));
        }

    },

    LyricsHandler: function () {
        app.lyrics = {neteaseWin: null, mxmWin: null, ytWin: null, miniPlayerLarge: null, artworkURL: '', savedLyric: '' }

        app.lyrics.neteaseWin = new BrowserWindow({
            width: 1,
            height: 1,
            show: false,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        app.lyrics.mxmWin = new BrowserWindow({
            width: 1,
            height: 1,
            show: false,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,

            },
        });

        app.lyrics.ytWin = new BrowserWindow({
            width: 1,
            height: 1,
            show: false,
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false,

            },
        });

        // app.lyrics.miniPlayerLarge = new BrowserWindow({
        //     width: 800,
        //     height: 600,
        //     show: false,
        //     autoHideMenuBar: true,
        //     webPreferences: {
        //         fullscreen: true,
        //         nodeIntegration: true,
        //         contextIsolation: false,

        //     }
        // });  

        // ipcMain.on('set-miniplayerLarge', (event)=> {
        //         if (app.lyrics.miniPlayerLarge == null){
        //             app.lyrics.miniPlayerLarge = new BrowserWindow({
        //                 width: 800,
        //                 height: 600,
        //                 show: false,
        //                 autoHideMenuBar: true,
        //                 webPreferences: {
        //                     fullscreen: true,
        //                     nodeIntegration: true,
        //                     contextIsolation: false,
                        
        //             }                   
        //         });
        //         }
        //         // Or load a local HTML file
        //         app.lyrics.miniPlayerLarge.loadFile(join(__dirname, '../lyrics/index.html'));
        //         app.lyrics.miniPlayerLarge.show();
        //         app.lyrics.miniPlayerLarge.on('closed', () => {
        //             app.lyrics.miniPlayerLarge  = null
        //         });
        //             app.win.webContents.executeJavaScript(`ipcRenderer.send('updateMiniPlayerMetaData',MusicKit.getInstance().nowPlayingItem.title,MusicKit.getInstance().nowPlayingItem.artistName,MusicKit.getInstance().nowPlayingItem.albumName);`);
        //         app.lyrics.miniPlayerLarge.webContents.on('did-finish-load', ()=>{
        //             if (app.lyrics.miniPlayerLarge){
        //                 app.lyrics.miniPlayerLarge.webContents.send('truelyrics', app.lyrics.savedLyric);
        //                 app.lyrics.miniPlayerLarge.webContents.send('albumart', app.lyrics.albumart);
        //         }    
        //         })
                
        // })
        // ipcMain.on('updateMiniPlayerMetaData', function (event, track, artist, album){
        //     if (app.lyrics.miniPlayerLarge){
        //         app.lyrics.miniPlayerLarge.webContents.executeJavaScript(`lrc.setLrc('')`);
        //         app.win.webContents.executeJavaScript(`_lyrics.GetLyrics(1,false)`);
        //         app.lyrics.miniPlayerLarge.webContents.send('updateMiniPlayerMetaData',track, artist, album)};
        // })
        ipcMain.on('YTTranslation', function (event, track, artist, lang) {
            try {
                if (app.lyrics.ytWin == null) {
                    app.lyrics.ytWin = new BrowserWindow({
                        width: 1,
                        height: 1,
                        show: false,
                        autoHideMenuBar: true,
                        webPreferences: {
                            nodeIntegration: true,
                            contextIsolation: false,
                        }
                    });


                } else {
                    app.lyrics.ytWin.webContents.send('ytcors', track, artist, lang);
                }
                if (!app.lyrics.ytWin.webContents.getURL().includes('youtube.html')) {
                    app.lyrics.ytWin.loadFile(join(__dirname, '../lyrics/youtube.html'));
                    app.lyrics.ytWin.webContents.on('did-finish-load', () => {
                        app.lyrics.ytWin.webContents.send('ytcors', track, artist, lang);
                    });
                }

                app.lyrics.ytWin.on('closed', () => {
                    app.lyrics.ytWin = null
                });

            } catch (e) {
                console.error(e)
            }
        });

        ipcMain.on('MXMTranslation', function (event, track, artist, lang, time) {
            try {
                if (app.lyrics.mxmWin == null) {
                    app.lyrics.mxmWin = new BrowserWindow({
                        width: 1,
                        height: 1,
                        show: false,
                        autoHideMenuBar: true,
                        webPreferences: {
                            nodeIntegration: true,
                            contextIsolation: false,

                        }
                    });


                } else {
                    app.lyrics.mxmWin.webContents.send('mxmcors', track, artist, lang, time);
                }
                // try{

                // const cookie = { url: 'https://apic-desktop.musixmatch.com/', name: 'x-mxm-user-id', value: '' }
                // app.lyrics.mxmWin.webContents.session.defaultSession.cookies.set(cookie);
                // } catch (e){}
                if (!app.lyrics.mxmWin.webContents.getURL().includes('musixmatch.html')) {
                    app.lyrics.mxmWin.loadFile(join(__dirname, '../lyrics/musixmatch.html'));
                    app.lyrics.mxmWin.webContents.on('did-finish-load', () => {
                        app.lyrics.mxmWin.webContents.send('mxmcors', track, artist, lang, time);
                    });
                }

                app.lyrics.mxmWin.on('closed', () => {
                    app.lyrics.mxmWin = null
                });

            } catch (e) {
                console.error(e)
            }
        });
        ipcMain.on('NetEaseLyricsHandler', function (event, data) {
            try {
                if (app.lyrics.neteaseWin == null) {
                    app.lyrics.neteaseWin = new BrowserWindow({
                        width: 100,
                        height: 100,
                        show: false,
                        autoHideMenuBar: true,
                        webPreferences: {
                            nodeIntegration: true,
                            contextIsolation: false,

                        }
                    });
                    app.lyrics.neteaseWin.webContents.on('did-finish-load', () => {
                        app.lyrics.neteaseWin.webContents.send('neteasecors', data);
                    });
                } else {
                    app.lyrics.neteaseWin.webContents.on('did-finish-load', () => {
                        app.lyrics.neteaseWin.webContents.send('neteasecors', data);
                    });
                }
                app.lyrics.neteaseWin.loadFile(join(__dirname, '../lyrics/netease.html'));
                app.lyrics.neteaseWin.on('closed', () => {
                    app.lyrics.neteaseWin = null
                });

            } catch (e) {
                console.log(e);
                // if (app.lyrics.miniPlayerLarge){
                //     app.lyrics.miniPlayerLarge.webContents.send('truelyrics', '[00:00] Instrumental. / Lyrics not found.');
                // }
                app.lyrics.savedLyric = '[00:00] Instrumental. / Lyrics not found.';
                app.win.send('truelyrics', '[00:00] Instrumental. / Lyrics not found.');
            }
        });

        ipcMain.on('LyricsHandler', function (event, data, artworkURL) {
            // if (app.lyrics.miniPlayerLarge){
            //     app.lyrics.miniPlayerLarge.webContents.send('truelyrics', data);
            //     app.lyrics.miniPlayerLarge.webContents.send('albumart', artworkURL);
            // }
            app.win.send('truelyrics', data);
            app.win.send('albumart', artworkURL);
            app.lyrics.savedLyric = data;
            app.lyrics.albumart = artworkURL;
        });
        
        ipcMain.on('updateMiniPlayerArt', function (event, artworkURL) {
            app.lyrics.albumart = artworkURL;
            // if (app.lyrics.miniPlayerLarge){
            //     app.lyrics.miniPlayerLarge.webContents.send('albumart', artworkURL);
            // }

        })
        ipcMain.on('LyricsHandlerNE', function (event, data) {
            if (app.lyrics.miniPlayerLarge){
            app.lyrics.miniPlayerLarge.webContents.send('truelyrics', data);}
            app.win.send('truelyrics', data);
            app.lyrics.savedLyric = data;
        });

        ipcMain.on('LyricsHandlerTranslation', function (event, data) {
            // if (app.lyrics.miniPlayerLarge){
            // app.lyrics.miniPlayerLarge.send('lyricstranslation', data);
            // }
            app.win.send('lyricstranslation', data);
        });

        ipcMain.on('LyricsTimeUpdate', function (event, data) {
            // if (app.lyrics.miniPlayerLarge){
            //     app.lyrics.miniPlayerLarge.webContents.send('ProgressTimeUpdate', data);
            // }
            app.win.send('ProgressTimeUpdate', data);
        });

        ipcMain.on('LyricsUpdate', function (event, data, artworkURL) {
            // if (app.lyrics.miniPlayerLarge){
            //     app.lyrics.miniPlayerLarge.webContents.send('truelyrics', data);
            //     app.lyrics.miniPlayerLarge.webContents.send('albumart', artworkURL);
            // }
            app.win.send('truelyrics', data);
            app.win.send('albumart', artworkURL);
            app.lyrics.savedLyric = data;
            app.lyrics.albumart = artworkURL;
        });

        ipcMain.on('LyricsMXMFailed', function (_event, _data) {
            app.win.send('backuplyrics', '');
        });

        ipcMain.on('LyricsYTFailed', function (_event, _data) {
            app.win.send('backuplyricsMV', '');
        });

        ipcMain.on('ProgressTimeUpdateFromLyrics', function (event, data) {
            app.win.webContents.executeJavaScript(`MusicKit.getInstance().seekToTime('${data}')`).catch((e) => console.error(e));
        });


    },

    AudioHandler: function(){


        let api = RtAudioApi.UNSPECIFIED;


        switch (process.platform){
            case "win32":
                api = RtAudioApi.WINDOWS_WASAPI;
                break;    
            case "linux":
                api = RtAudioApi.LINUX_ALSA;
                break; 
            case "darwin":
                api = RtAudioApi.MACOSX_CORE;
                break; 
        }
        const rtAudio = new RtAudio(api);
        console.log(rtAudio.getDevices());
        rtAudio.openStream(
            { deviceId: 0, // Need to change to get wrote
            nChannels: 2, // Number of channels
            firstChannel: 0 // First channel index on device (default = 0).
            },null,
            RtAudioFormat.RTAUDIO_FLOAT32,
            48000,
            16384,"Apple Music Electron",
        );

        rtAudio.start();

        // mix the channels
        function interleave(leftChannel, rightChannel){
            var length = leftChannel.length + rightChannel.length;
            var result = new Float32Array(length);
            
            var inputIndex = 0;
            
            for (var index = 0; index < length; ){
             result[index++] = leftChannel[inputIndex];
             result[index++] = rightChannel[inputIndex];
             inputIndex++;
            }
            return result;
        }

        ipcMain.on('changeAudioMode' , function (event, mode) {
          console.log(rtAudio.getApi());
        });
        console.log(rtAudio.getApi());
        ipcMain.on('writePCM' , function (event, leftpcm, rightpcm) { 
            // do anything with stereo pcm here
            buffer = Buffer.from(new Int8Array(interleave(Float32Array.from(leftpcm),Float32Array.from(rightpcm)).buffer));
            rtAudio.write(buffer);
        });
        ipcMain.on('muteAudio' ,function (event, mute){ 
        app.win.webContents.setAudioMuted(mute);});


       
    },
    GoogleCastHandler: function(){
        var devices = [];
        var GCRunning = false;
        var GCBuffer ;
        var expectedConnections = 0;
        var currentConnections = 0;
        var activeConnections = [];
        var requests = [];
        var GCstream = new Stream.PassThrough();
        var connectedHosts = {};


        var port = false;
        var server = false;
        var bufcount = 0;
        var bufcount2 = 0;
        var headerSent = false;

        const audioserver = express(); 
        audioserver.get('/', playData.bind(this));

        function playData(req,res){
            console.log("Device requested: /");
            req.connection.setTimeout(Number.MAX_SAFE_INTEGER);
            requests.push({req: req, res: res});
            var pos = requests.length-1;
            req.on("close", () => {
                console.info("CLOSED", requests.length);
                requests.splice(pos,1);
                console.info("CLOSED", requests.length);
            });
        
                
                GCstream.on('data', (data) => {
                    try { 
                        res.write(data);
                    } catch (ex) {
                        console.log("Dead", ex);
                    }
                })   
            
        }

        ipcMain.on('writeWAV' , function (event, leftpcm, rightpcm, bufferlength) { 

            function interleave16(leftChannel, rightChannel){
                var length = leftChannel.length + rightChannel.length;
                var result = new Int16Array(length);
    
                var inputIndex = 0;
    
                for (var index = 0; index < length; ){
                 result[index++] = leftChannel[inputIndex];
                 result[index++] = rightChannel[inputIndex];
                 inputIndex++;
                }
                return result;
            }
            
             //https://github.com/HSU-ANT/jsdafx
            function quantization(audiobufferleft, audiobufferright){
                var h = Float32Array.from([1]);
                var nsState = new Array(0);
                var ditherstate = new Float32Array(0);
                var qt = Math.pow(2, 1-16);
   
                //noise shifting order 3
                h = Float32Array.from([1.623, -0.982, 0.109]);                   
                for (let i = 0; i < nsState.length; i++) {
                    nsState[i] = new Float32Array(h.length);
                }

                function setChannelCount(nc) {
                    if (ditherstate.length !== nc) {
                      ditherstate = new Float32Array(nc);
                    }
                    if (nsState.length !== nc) {
                      nsState = new Array(nc);
                      for (let i = 0; i < nsState.length; i++) {
                        nsState[i] = new Float32Array(h.length);
                      }
                    }
                }
   
                function hpDither(channel) {
                    const rnd = Math.random() - 0.5;
                    const d = rnd - ditherstate[channel];
                    ditherstate[channel] = rnd;
                    return d;
                }
                

                setChannelCount(2);
                const inputs = [audiobufferleft,audiobufferright];
                const outputs = [audiobufferleft,audiobufferright];
                
                for (let channel = 0; channel < inputs.length; channel++) {
                    const inputData = inputs[channel];
                    const outputData = outputs[channel];
                    for (let sample = 0; sample < bufferlength; sample++) {
                    let input = inputData[sample];

                        for (let i = 0; i < h.length; i++) {
                        input -= h[i] * nsState[channel][i];
                        }
                    
                        let d_rand = 0.0;
                        ditherstate = 0.0;
                        d_rand = hpDither(channel);

                        const tmpOutput = qt * Math.round(input/qt + d_rand);
                        for (let i = h.length-1; i >= 0; i--) {
                            nsState[channel][i] = nsState[channel][i-1];
                        }
                        nsState[channel][0] = tmpOutput - input;
                        outputData[sample] = tmpOutput;
                    }
                }  
                return outputs;
            }


            function convert(n) {
                var v = n < 0 ? n * 32768 : n * 32767;       // convert in range [-32768, 32767]
                return Math.max(-32768, Math.min(32768, v)); // clamp
            }
             var newaudio = quantization(leftpcm,rightpcm);

            //  writeFile(join(app.getPath('userData'), 'buffertest.raw'), Buffer.from(new Int8Array(interleave16(Int16Array.from(newaudio[0], x => convert(x)),Int16Array.from(newaudio[1], x => convert(x))).buffer)),{flag: 'a+'}, function (err) {
            //     if (err) throw err;
            //      console.log('It\'s saved!');
            //  });
            //do anything with stereo pcm here
            var pcmData = Buffer.from(new Int8Array(interleave16(Int16Array.from(newaudio[0], x => convert(x)),Int16Array.from(newaudio[1], x => convert(x))).buffer)); 

            console.log('oof')
            if(!headerSent){
            const header = new Buffer.alloc(44)

            header.write('RIFF', 0)
            header.writeUInt32LE(2147483600, 4)
            header.write('WAVE', 8)
            header.write('fmt ', 12)
            header.writeUInt8(16, 16)
            header.writeUInt8(1, 20)
            header.writeUInt8(2, 22)
            header.writeUInt32LE(48000, 24)
            header.writeUInt32LE(16, 28)
            header.writeUInt8(4, 32)
            header.writeUInt8(16, 34)
            header.write('data', 36)
            header.writeUInt32LE(2147483600+ 44 - 8, 40)
            GCstream.write(Buffer.concat([header,pcmData]));
            headerSent = true;
        } else {GCstream.write(pcmData);}

            });

    	function parseServiceDescription(body, address) {
            var parseString = require('xml2js').parseString;
            parseString(body, (err, result) => {
                if (!err && result && result.root && result.root.device) {
                    var device = result.root.device[0];
                    this.ondeviceup(address, device.friendlyName.toString());
                }
            });
        }

        function getServiceDescription(url, address) {
            var request = require('request');
            request.get(url, (error, response, body) => {
                if (!error && response.statusCode == 200) {
                    parseServiceDescription(body, address);
                }
            });
        }

        function ondeviceup(host, name) {
            if (devices.indexOf(host) == -1) {
                devices.push(host);
                if (name) {
                    app.win.webContents.executeJavaScript(`console.log('deviceFound','ip: ${host} name:${name}')`);
                    console.log("deviceFound", host, name);
                }
            } else {
                app.win.webContents.executeJavaScript(`console.log('deviceFound (added)','ip: ${host} name:${name}')`);
                console.log("deviceFound (added)", host, name);
            }
        }

        function searchForGCDevices() {
            try{
            let browser = mdns.createBrowser(mdns.tcp('googlecast'));
            browser.on('ready', browser.discover);
    
            browser.on('update', (service) => {
                if (service.addresses && service.fullname) {
                    ondeviceup(service.addresses[0], service.fullname.substring(0, service.fullname.indexOf("._googlecast")));
                }
            });
            
            // also do a SSDP/UPnP search
            let ssdpBrowser = new ssdp();
            ssdpBrowser.on('response', (msg, rinfo) => {
                var location = getLocation(msg);
                if (location != null) {
                    getServiceDescription(location, rinfo.address);
                }
                
            });

            function getLocation(msg) {
                msg.replace('\r', '');
                var headers = msg.split('\n');
                var location = null;
                for (var i = 0; i < headers.length; i++) {
                    if (headers[i].indexOf('LOCATION') == 0)
                        location = headers[i].replace('LOCATION:', '').trim();
                }
                return location;
            }
            ssdpBrowser.search('urn:dial-multiscreen-org:device:dial:1');} catch(e){
                console.log('Search GC err');
            }
        }

        function setupGCServer() {
            return new Promise((resolve, reject) => {
                   getPort()
                    .then(port2 => {
                        port = port2;
                        server = audioserver.listen(port, () => {
                            console.info('Example app listening at http://%s:%s', getIp(), port);
                        });
                        GCRunning = true;
                        resolve()
                    })
                    .catch(reject);
            });
        }

        function loadMedia(client, song, artist, album, albumart, cb) {
            client.launch(DefaultMediaReceiver, (err, player) => {
                if (err) {
                    console.log(err);
                    return;
                }    
                    let media = {
                        // Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
                        contentId: 'http://' + getIp() + ':' + server.address().port + '/',
                        contentType: 'audio/vnd.wav',
                        streamType: 'BUFFERED', // or LIVE
    
                        // Title and cover displayed while buffering
                        metadata: {
                            type: 0,
                            metadataType: 3,
                            title: song ?? "", 
                            albumName: album ?? "",
                            artist: artist ?? "",
                            images: [
                              { url: albumart ?? "" }]
                        }
                    };
                    ipcMain.on('setupNewTrack', function(event, song, artist, album, albumart) {
                        try{
                        let newmedia = {
                            // Here you can plug an URL to any mp4, webm, mp3 or jpg file with the proper contentType.
                            contentId:  'http://' + getIp() + ':' + server.address().port + '/',
                            contentType: 'audio/vnd.wav',
                            streamType: 'BUFFERED', // or LIVE
        
                            // Title and cover displayed while buffering
                            metadata: {
                                type: 0,
                                metadataType: 3,
                                title: song, 
                                albumName: album,
                                artist: artist,
                                images: [
                                  { url: albumart }]
                            }
                        };
                        player.pause();
                        headerSent = false;
                        player.load(newmedia, {
                            autoplay: true
                        }, (err, status) => {
                            console.log('media loaded playerState=%s', status);
                        }); 
                    }catch(e){
                        console.log('GCerror',e)
                    }   
                    });
                    
    
                    player.on('status', status => {
                        console.log('status broadcast playerState=%s', status);
                    });
    
                    console.log('app "%s" launched, loading media %s ...', player, media);
    
                    player.load(media, {
                        autoplay: true
                    }, (err, status) => {
                        console.log('media loaded playerState=%s', status);
                    });                   

    
                    client.getStatus((x, status) => {
                        if (status && status.volume)
                        {
                            client.volume = status.volume.level;
                            client.muted = status.volume.muted;
                            client.stepInterval = status.volume.stepInterval;
                        }
                    })

            });
        }



        function getIp() {
            var ip = false
            var alias = 0;
            let ifaces = os.networkInterfaces();
            for (var dev in ifaces) {
                ifaces[dev].forEach(details => {
                    if (details.family === 'IPv4') {
                        if (!/(loopback|vmware|internal|hamachi|vboxnet|virtualbox)/gi.test(dev + (alias ? ':' + alias : ''))) {
                            if (details.address.substring(0, 8) === '192.168.' ||
                                details.address.substring(0, 7) === '172.16.' ||
                                details.address.substring(0, 3) === '10.'
                            ) {
                                ip = details.address;
                                ++alias;
                            }
                        }
                    }
                });
            }
            return ip;
        }

        function stream(host, song, artist, album, albumart){
            let client = new audioClient();
            client.volume = 100;
            client.stepInterval = 0.5;
            client.muted = false;
    
            client.connect(host, () => {
                console.log('connected, launching app ...', 'http://' + getIp() + ':' + server.address().port + '/');
                if (!connectedHosts[host]) {
                    connectedHosts[host] = client;
                    activeConnections.push(client);
                }
                loadMedia(client, song, artist, album, albumart);
            });
            client.on('close', ()  => {
                console.info("Client Closed");
                for (var i = activeConnections.length - 1; i >= 0; i--) {
                    if (activeConnections[i] == client) {
                        activeConnections.splice(i,1);
                        return;
                    }
                }
            });
            client.on('error', err => {
                console.log('Error: %s', err.message);
                client.close();
                delete connectedHosts[host];
            });
        }

        ipcMain.on('performGCCast',function(event, ip, song, artist, album, albumart){
            setupGCServer().then(function(){
                app.win.webContents.setAudioMuted(true);
                stream(ip, song, artist, album, albumart);})
        });

        ipcMain.on('getChromeCastDevices',function(event, data){
            searchForGCDevices();
        });
        
        ipcMain.on('stopGCast',function(event){
            app.win.webContents.setAudioMuted(false);
            GCRunning = false;
            expectedConnections = 0;
            currentConnections = 0;
            activeConnections = [];
            requests = [];
            GCstream = new Stream.PassThrough();
            connectedHosts = {};
            port = false;
            server = false;
            bufcount = 0;
            bufcount2 = 0;
            headerSent = false;
        })
    }
}

module.exports = handler
