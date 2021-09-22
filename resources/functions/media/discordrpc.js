const {app} = require('electron')
const DiscordRPC = require('discord-rpc');
const {Analytics} = require("../sentry");
Analytics.init()

module.exports = {
    connect: function (clientId) {
        if (!app.preferences.value('general.discordRPC')) return;

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
        if (!app.preferences.value('general.discordRPC') || !app.discord.isConnected) return;
        console.log('[DiscordRPC][disconnect] Disconnecting from discord.')
        try {
            app.discord.destroy().catch((e) => console.error(`[DiscordRPC][disconnect] ${e}`));
        } catch (err) {
            console.error(err)
        }
    },

    updateActivity: function (attributes) {
        if (!app.preferences.value('general.discordRPC')) return;

        if (!app.discord.isConnected) {
            this.connect()
        }

        if (!app.discord.isConnected) return;

        console.verbose('[DiscordRPC][updateActivity] Updating Discord Activity.')

        const listenURL = `https://applemusicelectron.com/p?id=${attributes.playParams.id}`

        let ActivityObject = {
            details: attributes.name,
            state: `by ${attributes.artistName}`,
            startTimestamp: attributes.startTime,
            endTimestamp: attributes.endTime,
            largeImageKey: 'logo',
            largeImageText: attributes.albumName,
            smallImageKey: 'nightly',
            smallImageText: 'Playing',
            instance: true,
            buttons: [
                {label: "Open in AME", url: listenURL},
            ]
        };
        console.verbose(`[LinkHandler] Listening URL has been set to: ${listenURL}`);

        // clear Activity Values
        if (app.preferences.value('general.discordClearActivityOnPause').includes(true)) {
            ActivityObject.largeImageKey = 'apple'
            ActivityObject.largeImageText = attributes.albumName
            ActivityObject.smallImageKey = app.getVersion().includes('nightly') ? 'nightlylarge' : 'logo'
            ActivityObject.smallImageText = `Apple Music Electron v${app.getVersion()}`
        } else {
            if (app.getVersion().includes('nightly')) {
                ActivityObject.largeImageKey = 'nightly'
            }
        }

        // Check all the values work
        if (!((new Date(attributes.endTime)).getTime() > 0)) {
            delete ActivityObject.startTimestamp
            delete ActivityObject.endTimestamp
        }
        if (!attributes.artistName) {
            delete ActivityObject.state
        }
        if (!ActivityObject.largeImageText || Array.from(ActivityObject.largeImageText).length < 2) {
            delete ActivityObject.largeImageText
        }

        // Clear if if needed
        if (!attributes.status) {
            if (app.preferences.value('general.discordClearActivityOnPause').includes(true)) {
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
                console.verbose(`[DiscordRPC][setActivity] Setting activity to ${JSON.stringify(ActivityObject)}`);
                app.discord.setActivity(ActivityObject)
            } catch (err) {
                console.error(`[DiscordRPC][setActivity] ${err}`)
            }

        }
    },
}