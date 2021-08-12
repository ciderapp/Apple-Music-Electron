const {app} = require('electron')
const {Client} = require('discord-rpc');
const Sentry = require('@sentry/electron');
if (app.preferences.value('general.analyticsEnabled').includes(true)) {
    Sentry.init({ dsn: "https://20e1c34b19d54dfcb8231e3ef7975240@o954055.ingest.sentry.io/5903033" });
}

module.exports = {
    connect: function (clientId) {
        if (!app.preferences.value('general.discordRPC').includes(true)) return;
        app.discord.client = new Client({
            transport: "ipc",
        });

        // Login to Discord
        app.discord.client.login({clientId})
            .then(() => {
                console.log("[DiscordRPC][connect] Successfully Connected to Discord!");
                app.discord.connected = true;

                if (app.discord.activityCache) {
                    app.discord.client.setActivity(app.discord.activityCache).catch((e) => console.error(e));
                    app.discord.activityCache = null;
                }
            })
            .catch((e) => console.error(`[DiscordRPC][connect] ${e}`));

        // Handles Errors
        app.discord.client.on('error', err => {
            console.error(`[DiscordRPC][connect] Error: ${err}`);
            console.error(`[DiscordRPC][connect] Disconnecting from Discord.`)
            this.disconnect()
            app.discord.client = false;
        });
    },

    disconnect: function () {
        if (!app.preferences.value('general.discordRPC').includes(true)) return;
        console.log('[DiscordRPC][disconnect] Disconnecting from discord.')
        app.discord.client.destroy().catch((e) => console.error(`[DiscordRPC][disconnect] ${e}`));
    },

    updateActivity: function (attributes) {
        if (!app.preferences.value('general.discordRPC').includes(true)) return;

        if (!app.discord.connected) {
            this.connect()
        }

        console.log('[DiscordRPC][updateActivity] Updating Discord Activity.')
        if (!app.discord.connected) return;
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
                }).catch((e) => console.error(`[DiscordRPC][setActivity] ${e}`));
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
                }).catch((e) => console.error(`[DiscordRPC][setActivity] ${e}`));
            }
        } else {
            if (app.preferences.value('advanced.discordClearActivityOnPause').includes(true)) {
                app.discord.client.clearActivity().catch((e) => console.error(`[DiscordRPC][clearActivity] ${e}`));
            } else {
                app.discord.client.setActivity({
                    details: attributes.name,
                    state: `by ${attributes.artistName}`,
                    largeImageKey: 'apple',
                    largeImageText: attributes.albumName,
                    smallImageKey: 'pause',
                    smallImageText: 'Paused',
                    instance: false,
                }).catch((e) => console.error(`[DiscordRPC][setActivity] ${e}`));
            }

        }
    },
}