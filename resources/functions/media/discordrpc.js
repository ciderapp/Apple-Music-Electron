const {app} = require('electron')
const DiscordRPC = require('discord-rpc');
const {Analytics} = require("../sentry");
Analytics.init()

module.exports = {
    connect: function (clientId) {
        if (!app.preferences.value('general.discordRPC').includes(true)) return;

        DiscordRPC.register(clientId) // Apparently needed for ask to join, join, spectate etc.
        const client = new DiscordRPC.Client({ transport: "ipc" });
        app.discord = Object.assign(client,{error: false, activityCache: null, isConnected: false});

        // Login to Discord
        app.discord.login({ clientId })
            .then(() => {
                app.discord.isConnected = true;
            })
            .catch((e) => console.error(`[DiscordRPC][connect] ${e}`));

        app.discord.on('ready', () => {
            console.log(`[DiscordRPC][connect] Successfully Connected to Discord. Authed for user: ${client.user.username} (${client.user.id})`);

            if (app.discord.activityCache) {
                client.setActivity(app.discord.activityCache).catch((e) => console.error(e));
                app.discord.activityCache = null;
            }
        })

        // Handles Errors
        app.discord.on('error', err => {
            console.error(`[DiscordRPC] ${err}`);
            this.disconnect()
            app.discord.isConnected = false;
        });
    },

    disconnect: function () {
        if (!app.preferences.value('general.discordRPC').includes(true) || !app.discord.isConnected) return;
        console.log('[DiscordRPC][disconnect] Disconnecting from discord.')
        try {
            app.discord.destroy().catch((e) => console.error(`[DiscordRPC][disconnect] ${e}`));
        } catch (err) {
            console.error(err)
        }
    },

    updateActivity: function (attributes) {
        if (!app.preferences.value('general.discordRPC').includes(true)) return;

        if (!app.discord.isConnected) {
            this.connect()
        }

        if (!app.discord.isConnected) return;

        if (app.preferences.value('advanced.verboseLogging').includes(true)) {
            console.log('[DiscordRPC][updateActivity] Updating Discord Activity.')
        }

        const listenURL = `https://applemusicelectron.com/p?id=${attributes.playParams.id}`
        let ActivityObject = {
            details: attributes.name,
            state: `by ${attributes.artistName}`,
            startTimestamp: attributes.startTime,
            endTimestamp: attributes.endTime,
            largeImageKey: 'logo',
            largeImageText: attributes.albumName,
            smallImageKey: 'play',
            smallImageText: 'Playing',
            instance: true,
            buttons: [
                {label: "Listen", url: listenURL},
                {label: "Download", url: "https://github.com/Apple-Music-Electron/Apple-Music-Electron"},
            ]
        };

        if (app.preferences.value('advanced.verboseLogging').includes(true)) console.log(`[LinkHandler] Listening URL has been set to: ${listenURL}`);

        if (!((new Date(attributes.endTime)).getTime() > 0)) {
            delete ActivityObject.startTimestamp
            delete ActivityObject.endTimestamp
        }

        if (!attributes.artistName) {
            delete ActivityObject.state
        }

        if (!attributes.albumName) {
            delete ActivityObject.largeImageText
        }

        if (attributes.status) {
            if (app.preferences.value('advanced.discordClearActivityOnPause').includes(true)) {
                delete ActivityObject.smallImageKey
                delete ActivityObject.smallImageText
            }
        } else {
            if (app.preferences.value('advanced.discordClearActivityOnPause').includes(true)) {
                app.discord.clearActivity().catch((e) => console.error(`[DiscordRPC][clearActivity] ${e}`));
                ActivityObject = null
            } else {
                delete ActivityObject.startTimestamp
                delete ActivityObject.endTimestamp
                ActivityObject.smallImageKey = 'pause'
                ActivityObject.smallImageText = 'Paused'
            }
        }

        if (ActivityObject) {
            try {
                app.discord.setActivity(ActivityObject)
            } catch (err) {
                console.error(`[DiscordRPC][setActivity] ${err}`)
            }

        }
    },
}