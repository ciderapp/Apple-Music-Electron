const log = require("electron-log");

exports.InitializeLogging = function () {
    console.log('[InitializeLogging] Started.')

    console.log = log.log;
    console.error = log.error;
    console.warn = log.warn;
    console.debug = log.debug;

    console.log('---------------------------------------------------------------------')
    console.log('Apple-Music-Electron application has started.');
    console.log("---------------------------------------------------------------------")
}