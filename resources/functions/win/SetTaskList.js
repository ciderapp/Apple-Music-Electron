const {app} = require('electron')

exports.SetTaskList = function () {

    if (process.platform !== "win32") return;

    app.setUserTasks([
        {
            program: process.execPath,
            arguments: '--force-quit',
            iconPath: process.execPath,
            iconIndex: 0,
            title: 'Quit Apple Music'
        }
    ]);
    return true


}