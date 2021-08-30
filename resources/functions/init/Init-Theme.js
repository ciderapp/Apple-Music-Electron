const {app, nativeTheme, dialog} = require('electron');
const {resolve, join} = require('path');
const {copySync} = require('fs-extra');
const chmodr = require('chmodr');
const fs = require('fs');
const {Analytics} = require("../analytics/sentry");
Analytics.init()

exports.InitializeTheme = function () {
    console.log('[InitializeTheme] Started.')
    if (app.preferences.value('advanced.forceApplicationMode') === 'dark') {
        nativeTheme.themeSource = "dark"
    } else if (app.preferences.value('advanced.forceApplicationMode') === 'light') {
        nativeTheme.themeSource = "light"
    } else {
        if (nativeTheme.shouldUseDarkColors === true) {
            app.preferences.value('advanced.forceApplicationMode', 'dark');
        } else {
            app.preferences.value('advanced.forceApplicationMode', 'light');
        }
    }

    // Set the folder
    app.userThemesPath = resolve(app.getPath('userData'), 'themes');
    app.themesPath = join(__dirname, '../../themes/')
    console.log('---------------------------------------------------------------------')
    console.log(`User Themes Path: '${app.userThemesPath}'`)
    console.log(`Application Themes Path: '${app.themesPath}'`)
    console.log('---------------------------------------------------------------------')

    // Make sure you can access the folder with the correct permissions
    console.log(`[InitializeTheme][existsSync] Checking if themes directory exists. ('${app.userThemesPath}')`)

    // Checks if the folder exists and create themes if it doesnt
    if (!fs.existsSync(app.userThemesPath)) {
        copySync(app.themesPath, app.userThemesPath)
        console.log(`[InitializeTheme][existsSync] Initial Themes have been copied to '${app.userThemesPath}'`)
    } else {
        console.log("[InitializeTheme][existsSync] Folder exists!")
    }

    // Access
    console.log('[InitializeTheme][access] Checking if file is readable')
    fs.access(join(app.userThemesPath, 'Template.css'), fs.constants.F_OK, (err) => {
        if (err) {
            console.error(`[InitializeTheme][access] ${err} - Template.css could not be read. Attempting to change permissions.`)
            chmodr(app.userThemesPath, 0o777, (err) => {
                if (err) {
                    console.error(`[InitializeTheme][chmodr] ${err} - Theme set to default to prevent application launch halt.`);
                    app.preferences.value('visual.theme', 'default')

                    if (err.toString().includes('permission denied') && process.platform === 'linux') { // Just gonna use this for now
                        dialog.showMessageBox(undefined, {
                            title: "Permission Change Needed!",
                            message: `In order for you to be able to use Themes, you will need to manually change the permissions of the directory: '${app.userThemesPath}'. This is caused because the application does not have sufficient permissions to set the folder permissions. You can run the following command to set permissions: \n\nsudo chmod 777 -R '${app.userThemesPath}'`,
                            type: "warning"
                        })
                    }
                } else {
                    console.log('[InitializeTheme] Folder permissions successfully set.');
                }
            });
        } else {
            console.log('[InitializeTheme] File is readable.');

            // Save all the file names to array and log it
            try {
                app.themesList = fs.readdirSync(app.userThemesPath);
                console.log('---------------------------------------------------------------------')
                console.log(`Available Themes: ${app.themesList.join(', ')}`)
                console.log('---------------------------------------------------------------------')
            } catch (err) {
                console.error(err)
            }

            // Overwrite if theme development is disabled
            if (!app.preferences.value('advanced.themeDevelopment').includes(true)) {
                copySync(app.themesPath, app.userThemesPath, {overwrite: true})
                console.log(`[InitializeTheme][copyThemes] Themes overwritten at '${app.userThemesPath}'`)
            }
        }
    });
}