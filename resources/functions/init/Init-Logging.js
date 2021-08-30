const log = require("electron-log");
const {app} = require('electron')
const os = require('os')
const pjson = require('../../../package.json')

exports.InitializeLogging = function () {
    console.log('[InitializeLogging] Started.')

    console.log = log.log;
    console.error = log.error;
    console.warn = log.warn;
    console.debug = log.debug;

    console.log('---------------------------------------------------------------------')
    console.log(`${app.name} has started.`);
    console.log(`Version: ${pjson.version} | Electron Version: ${process.versions.electron}`)
    console.log(`Type: ${os.type} | Release: ${os.release()} | Platform: ${os.platform()}`)
    console.log(`User Data Path: '${app.getPath('userData')}'`)
    console.log("---------------------------------------------------------------------")
}