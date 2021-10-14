const {app, nativeImage, nativeTheme, Notification, dialog} = require("electron"),
    {existsSync, readFileSync, readdirSync, constants, access} = require("fs"),
    {join, resolve} = require("path"),
    {autoUpdater} = require("electron-updater"),
    os = require("os"),
    chmod = require("chmodr"),
    rimraf = require("rimraf"),
    clone = require("git-clone"),
    trayIconDir = (nativeTheme.shouldUseDarkColors ? join(__dirname, `../icons/media/light/`) : join(__dirname, `../icons/media/dark/`)),
    ElectronSentry = require("@sentry/electron");

const Utils = {

    /* hexToRgb - Converts hex codes to rgb */
    hexToRgb: (hex) => {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    },

    /* isVibrancySupported - Checks if the operating system support electron-acrylic-window (Windows 10 or greater) */
    isVibrancySupported: () => {
        return (process.platform === 'win32' && parseInt(os.release().split('.')[0]) >= 10)
    },

    /* isAcrylicSupported - Checks if the operating system supports the acrylic transparency affect (Windows RS3 (Redstone 3) 1709 or Greater) */
    isAcrylicSupported: () => {
        return (process.platform === 'win32' && parseInt(os.release().replace(/\./g, "").replace(',', '.')) >= 10016299)
    },

    /* fetchThemeMeta - Fetches the meta data associated to a theme */
    fetchThemeMeta: (fileName) => {
        const filePath = resolve(app.getPath("userData"), "themes", `${fileName}.css`);
        if (!existsSync(filePath)) return;
        const file = readFileSync(filePath, "utf8");

        if (!file) return;

        let fileMeta = {name: null, author: null, description: null, transparency: {dark: null, light: null}};

        file.split(/\r?\n/).forEach((line) => {
            if (line.includes("@name")) {
                fileMeta.name = line.split("@name ")[1].trim();
            }

            if (line.includes("@author")) {
                fileMeta.author = line.split("@author ")[1].trim();
            }

            if (line.includes("@description")) {
                fileMeta.description = line.split("@description ")[1]
            }

            if (line.includes("--lightTransparency")) {
                fileMeta.transparency.light = line.split("--lightTransparency: ")[1].trim().split(' ')[0];
            }

            if (line.includes("--darkTransparency")) {
                fileMeta.transparency.dark = line.split("--darkTransparency: ")[1].trim().split(' ')[0];
            }

            if (fileMeta.transparency.dark && fileMeta.transparency.light) {
                fileMeta.transparency = nativeTheme.shouldUseDarkColors ? fileMeta.transparency.dark : fileMeta.transparency.light
            }

            if (!fileMeta.transparency.dark || !fileMeta.transparency.light) {
                if (line.includes("--transparency")) {
                    fileMeta.transparency = line.split("--transparency: ")[1].split(' ')[0];
                }
            }
        });

        if (typeof fileMeta.transparency == "object") {
            if (!fileMeta.transparency.dark || !fileMeta.transparency.light) {
                fileMeta.transparency = false;
            }
        }

        console.verbose(`[fetchThemeMeta] Returning ${fileMeta.toString()}`);
        return fileMeta
    },

    /* fetchTransparencyOptions - Fetches the transparency options */
    fetchTransparencyOptions: () => {
        if (process.platform === "darwin" && (!app.preferences.value('visual.transparencyEffect') || !Utils.isVibrancySupported())) {
            app.transparency = true;
            return "fullscreen-ui"
        } else if (!app.preferences.value('visual.transparencyEffect') || !Utils.isVibrancySupported()) {
            console.verbose(`[fetchTransparencyOptions] Vibrancy not created. Required options not met. (transparencyEffect: ${app.preferences.value('visual.transparencyEffect')} | isVibrancySupported: ${Utils.isVibrancySupported()})`);
            app.transparency = false;
            return false
        }

        console.log('[fetchTransparencyOptions] Fetching Transparency Options')
        let transparencyOptions = {
            theme: null,
            effect: app.preferences.value('visual.transparencyEffect'),
            debug: app.preferences.value('advanced.devTools') !== '',
        }

        //------------------------------------------
        //  Disable on blur for acrylic
        //------------------------------------------
        if (app.preferences.value('visual.transparencyEffect') === 'acrylic') {
            transparencyOptions.disableOnBlur = (!!app.preferences.value('visual.transparencyDisableBlur').includes(true));
        }

        //------------------------------------------
        //  Set the transparency theme
        //------------------------------------------
        if (app.preferences.value('visual.transparencyTheme') === 'appearance-based') {
            if (app.preferences.value('visual.theme') && app.preferences.value('visual.theme') !== "default") {
                transparencyOptions.theme = Utils.fetchThemeMeta(app.preferences.value('visual.theme')).transparency; /* Fetch the Transparency from the Themes Folder */
            } else if ((!app.preferences.value('visual.theme') || app.preferences.value('visual.theme') === "default") && app.preferences.value('visual.transparencyEffect') === 'acrylic') {
                transparencyOptions.theme = (nativeTheme.shouldUseDarkColors ? '#3C3C4307' : '#EBEBF507') /* Default Theme when Using Acrylic */
            } else { // Fallback
                transparencyOptions.theme = (nativeTheme.shouldUseDarkColors ? 'dark' : 'light')
            }
        } else {
            transparencyOptions.theme = app.preferences.value('visual.transparencyTheme');
        }

        //------------------------------------------
        //  Set the refresh rate
        //------------------------------------------
        if (app.preferences.value('visual.transparencyMaximumRefreshRate')) {
            transparencyOptions.useCustomWindowRefreshMethod = true
            transparencyOptions.maximumRefreshRate = app.preferences.value('visual.transparencyMaximumRefreshRate')
        }

        app.transparency = true
        console.log(`[fetchTransparencyOptions] Returning: ${JSON.stringify(transparencyOptions)}`)
        return transparencyOptions
    },

    /* fetchThemesListing - Fetches the themes directory listing (Lists .css files) */
    fetchThemesListing: () => {
        if (!existsSync(resolve(app.getPath("userData"), "themes"))) return;

        let themesFileNames = [], themesListing = {};


        readdirSync(resolve(app.getPath("userData"), "themes")).forEach((value) => {
            if (value.split('.').pop() === 'css') {
                themesFileNames.push(value.split('.').shift())
            }
        });

        // Get the Info
        themesFileNames.forEach((themeFileName) => {
            const themeData = Utils.fetchThemeMeta(themeFileName);
            if (themeData && themeData.name && themeData.description && themeData.author) {
                themesListing[themeFileName] = themeData;
            }
        })

        return themesListing
    },

    /* fetchOperatingSystem - Fetches the operating system name */
    fetchOperatingSystem: () => {
        if (process.platform === "win32") {
            if (parseFloat(os.release()) >= parseFloat('10.0.22000')) {
                return 'Windows 11'
            } else if (parseFloat(os.release()) < parseFloat('10.0.22000') && parseFloat(os.release()) >= parseFloat('10.0.10240')) {
                return 'Windows 10'
            }
        }
    },

    /* updateThemes - Purges the themes directory and clones a fresh copy of the themes */
    updateThemes: async () => {
        rimraf(resolve(app.getPath("userData"), "themes"), [], () => {
            console.warn(`[updateThemes] Themes directory cleared for fresh clone.`)
            clone('https://github.com/Apple-Music-Electron/Apple-Music-Electron-Themes', resolve(app.getPath("userData"), "themes"), [], (err) => {
                console.verbose(`[updateThemes][clone] ${err ? err : `Re-cloned Themes.`}`)
                return Promise.resolve(err)
            })
        })
    },

    /* permissionsCheck - Checks of the file can be read and written to, if it cannot be chmod -r is run on the directory */
    permissionsCheck: (folder, file) => {
        console.verbose(`[permissionsCheck] Running check on ${join(folder, file)}`)
        access(join(folder, file), constants.R_OK | constants.W_OK, (err) => {
            if (err) { // File cannot be read after cloning
                console.error(`[permissionsCheck][access] ${err}`)
                chmod(folder, 0o777, (err) => {
                    if (err) {
                        console.error(`[permissionsCheck][chmod] ${err} - Theme set to default to prevent application launch halt.`);
                    }
                });
            } else {
                console.verbose('[permissionsCheck] Check passed.')
            }
        })
    },

    /* initAnalytics - Sentry Analytics */
    initAnalytics: () => {
        if (app.preferences.value('general.analyticsEnabled').includes(true) && app.isPackaged) {
            ElectronSentry.init({dsn: "https://20e1c34b19d54dfcb8231e3ef7975240@o954055.ingest.sentry.io/5903033"});
        }
    },

    /* checkForUpdates - Checks for update using electron-updater (Part of electron-builder) */
    checkForUpdates: () => {
        if (!app.isPackaged || process.env.NODE_ENV !== 'production') return;

        autoUpdater.logger = require("electron-log");
        autoUpdater.logger.transports.file.resolvePath = (vars) => {
            return join(app.getPath('userData'), 'logs', vars.fileName);
        }
        autoUpdater.logger.transports.file.level = "info";

        if (app.preferences.value('advanced.autoUpdaterBetaBuilds').includes(true)) {
            autoUpdater.allowPrerelease = true
            autoUpdater.allowDowngrade = false
        }

        autoUpdater.on('update-not-available', () => {
            if (manual === true) {
                let bodyVer = `You are on the latest version. (v${app.getVersion()})`
                new Notification({title: "Apple Music", body: bodyVer}).show()
            }
        })

        autoUpdater.on('download-progress', (progress) => {
            let convertedProgress = parseFloat(progress);
            app.win.setProgressBar(convertedProgress)
        })

        autoUpdater.on("error", function(error) {
            console.error(`[checkUpdates] Error ${error}`)
        });

        autoUpdater.on('update-downloaded', (updateInfo) => {
            console.warn('[checkUpdates] New version downloaded. Starting user prompt.');

            dialog.showMessageBox(app.win, {
                type: 'info',
                title: 'Updates Available',
                message: `Update was found and downloaded, would you like to install the update now?`,
                details: updateInfo,
                buttons: ['Sure', 'No']
            }).then(({response}) => {
                if (response === 0) {
                    const isSilent = true;
                    const isForceRunAfter = true;
                    autoUpdater.quitAndInstall(isSilent, isForceRunAfter);
                } else {
                    updater.enabled = true
                    updater = null
                }
            })

        })

        autoUpdater.checkForUpdates()
            .then(r => {
                console.verbose(`[checkUpdates] Check for updates completed. Response: ${r}`)
            })
            .catch(err => {
                console.error(`[checkUpdates] An error occurred while checking for updates: ${err}`)
            })
    },

    /* Media Controlling Functions (Pause/Play/Skip/Previous) */
    media: {
        pausePlay() {
            console.verbose('[AppleMusic] pausePlay run.')
            app.win.webContents.executeJavaScript("MusicKitInterop.pausePlay()").catch((err) => console.error(err))
        },

        nextTrack() {
            console.verbose('[AppleMusic] nextTrack run.')
            app.win.webContents.executeJavaScript("MusicKitInterop.nextTrack()").catch((err) => console.error(err))
        },

        previousTrack() {
            console.verbose('[AppleMusic] previousTrack run.')
            app.win.webContents.executeJavaScript("MusicKitInterop.previousTrack()").catch((err) => console.error(err))
        }
    },

    /* Media-associated Icons (Used for Thumbar and TouchBar) */
    icons: {
        pause: nativeImage.createFromPath(join(trayIconDir, 'pause.png')).resize({width: 32, height: 32}),
        play: nativeImage.createFromPath(join(trayIconDir, 'play.png')).resize({width: 32, height: 32}),
        nextTrack: nativeImage.createFromPath(join(trayIconDir, 'next.png')).resize({width: 32, height: 32}),
        previousTrack: nativeImage.createFromPath(join(trayIconDir, 'previous.png')).resize({width: 32, height: 32}),
        inactive: {
            play: nativeImage.createFromPath(join(trayIconDir, 'play-inactive.png')).resize({width: 32, height: 32}),
            nextTrack: nativeImage.createFromPath(join(trayIconDir, 'next-inactive.png')).resize({
                width: 32,
                height: 32
            }),
            previousTrack: nativeImage.createFromPath(join(trayIconDir, 'previous-inactive.png')).resize({
                width: 32,
                height: 32
            }),
        }
    }
}

Utils.initAnalytics()
module.exports = Utils;