const {app} = require('electron')
const {Client} = require('discord-rpc');

module.exports = {
    connect: function(clientId) {
        if (!app.preferences.value('general.discordRPC').includes(true)) return;
        app.discord.client = new Client({ transport: (typeof window !== 'undefined') ? 'websocket' : 'ipc' });

        // Login to Discord
        app.discord.client.login({ clientId })
            .then(() => {
                console.log("[DiscordRPC][connect] Successfully Connected to Discord!");
                app.discord.connected = true;

                if (app.discord.activityCache) {
                    app.discord.client.setActivity(app.discord.activityCache).catch((e) => console.log(e));
                    app.discord.activityCache = null;
                }
            })
            .catch((e) => console.log(`[DiscordRPC][connect] ${e}`));

        // Handles Errors
        app.discord.client.on('error', err => {
            console.log(`[DiscordRPC][connect] Error: ${err}`);
            console.log(`[DiscordRPC][connect] Disconnecting from Discord.`)
            this.disconnect()
            app.discord.client = false;
        });
    },

    disconnect: function() {
        if (!app.preferences.value('general.discordRPC').includes(true)) return;
        console.log('[DiscordRPC][disconnect] Disconnecting from discord.')
        app.discord.client.destroy().catch((e) => console.log(`[DiscordRPC][disconnect] ${e}`));
    },

    clearActivity: function() {
        if (!app.preferences.value('general.discordRPC').includes(true)) return;
        console.log('[DiscordRPC][clearActivity] Clearing Activity.')
        app.discord.client.clearActivity().catch((e) => console.log(`[DiscordRPC][clearActivity] ${e}`))
    },

    updateActivity: function(attributes) {
        if (!app.preferences.value('general.discordRPC').includes(true)) return;

        if (app.discord.connected) {

            if (!app.discord.activityCache) {
                app.discord.activityCache = attributes
                return // Generate First Activity Cache
            } else if (app.discord.activityCache === attributes) {
                return // Same Song and Activity State
            }

            if (attributes.status === true) {
                if (app.preferences.value('advanced.discordClearActivityOnPause').includes(true)) {
                    app.discord.client.setActivity({
                        details: attributes.name,
                        state: `by ${attributes.artistName}`,
                        startTimestamp: attributes.startTime,
                        endTimestamp: attributes.endTime,
                        largeImageKey: 'apple',
                        largeImageText: attributes.albumName,
                        instance: false,
                    }).catch((e) => console.log(`[DiscordRPC][updateActivity] ${e}`));
                } else {
                    app.discord.client.setActivity({
                        details: attributes.name,
                        state: `by ${attributes.artistName}`,
                        startTimestamp: attributes.startTime,
                        endTimestamp: attributes.endTime,
                        largeImageKey: 'apple',
                        largeImageText: attributes.albumName,
                        smallImageKey: 'play',
                        smallImageText: 'Playing',
                        instance: false,
                    }).catch((e) => console.log(`[DiscordRPC][updateActivity] ${e}`));
                }
            } else {
                if (app.preferences.value('advanced.discordClearActivityOnPause').includes(true)) {
                    this.clearActivity()
                } else {
                    app.discord.client.setActivity({
                        details: attributes.name,
                        state: `by ${attributes.artistName}`,
                        largeImageKey: 'apple',
                        largeImageText: attributes.albumName,
                        smallImageKey: 'pause',
                        smallImageText: 'Paused',
                        instance: false,
                    }).catch((e) => console.log(`[DiscordRPC][updateActivity] ${e}`));
                }

            }

        } else {
            app.discord.activityCache = attributes;
        }
    },
}