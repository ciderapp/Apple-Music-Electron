const {app} = require('electron')

exports.UpdateMetaData = function (attributes) {
    if (!app.config.preferences.mprisSupport || !app.mpris || process.platform !== "linux") return;

    console.log('[Mpris] [UpdateMetaData] Updating Mpris Meta Data...')
    let url = `${attributes.artwork.url.replace('/{w}x{h}bb', '/35x35bb')}`
    url = `${url.replace('/2000x2000bb', '/35x35bb')}`
    m = {
        'mpris:trackid': app.mpris.objectPath(`track/${attributes.playParams.id.replace(/[.]+/g, "")}`),
        'mpris:length': attributes.durationInMillis * 1000, // In microseconds
        'mpris:artUrl': url,
        'xesam:title': `${attributes.name}`,
        'xesam:album': `${attributes.albumName}`,
        'xesam:artist': [`${attributes.artistName}`,],
        'xesam:genre': attributes.genreNames
    }

    if (app.mpris.metadata["mpris:trackid"] === m["mpris:trackid"]) {
        return
    }
    app.mpris.metadata = m
}