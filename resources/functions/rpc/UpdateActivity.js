const {app} = require('electron')

exports.UpdateActivity = function (attributes) {
    console.log('[DiscordRPC] [UpdateActivity] Started.')

    if (!app.discord.client || !app.config.preferences.discordRPC) return;

    if (!app.discord.cachedAttributes) {
        app.discord.cachedAttributes = attributes
        return true // Generate First Cache
    } else if (app.discord.cachedAttributes === attributes) {
        return true // Same Song and State
    }

    console.log(`[DiscordRPC] Updating Play Presence for ${attributes.name} to ${attributes.status}`)

    if (a.status === true) {
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
    return true


}