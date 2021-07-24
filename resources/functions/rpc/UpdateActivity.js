const {app} = require('electron')

exports.UpdateRPCActivity = function (attributes) {
    if (!app.discord.client || !app.preferences.value('general.discordRPC').includes(true)) return;

    // This prevents the script from running constantly when the attributes are:
    // - the same
    // - only just been created
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