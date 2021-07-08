const {app} = require('electron')
if (app.config.quick.lastfm_enabled.includes(true)) {
    var {scrobble} = require("../lastfm/scrobbleSong");
}

exports.UpdateActivity = function (attributes) {
    console.log('[DiscordRPC] [UpdateActivity] Started.')

    if (!app.discord.client || !app.config.preferences.discordRPC.includes(true)) return;

    if (!app.discord.cachedAttributes) {
        app.discord.cachedAttributes = attributes
        return // Generate First Activity Cache
    } else if (app.discord.cachedAttributes === attributes) {
        return // Same Song and Activity State
    }

    console.log(`[DiscordRPC] Updating Play Presence for ${attributes.name} to ${attributes.status}`)

    if (attributes.status === true) {
        app.discord.client.updatePresence({
            details: attributes.name,
            state: `by ${attributes.artistName}`,
            startTimestamp: attributes.startTime,
            endTimestamp: attributes.endTime,
            largeImageKey: 'apple',
            largeImageText: attributes.albumName,
            smallImageKey: 'play',
            smallImageText: 'Playing',
            instance: false,
        });
        if (app.config.quick.lastfm.enabled.includes(true)) {
            scrobble(attributes)
        }
    } else {
        app.discord.client.updatePresence({
            details: attributes.name,
            state: `by ${attributes.artistName}`,
            largeImageKey: 'apple',
            largeImageText: attributes.albumName,
            smallImageKey: 'pause',
            smallImageText: 'Paused',
            instance: false,
        });
    }


}