const {app} = require('electron')

exports.InitializeRPC = function () {


    if (!app.config.preferences.discordRPC) return;

    app.discord = {client: false, error: false, cachedAttributes: false};
    app.discord.client = require('discord-rich-presence')('749317071145533440');
    console.log("[DiscordRPC] Initializing Client.")

    // Connected to Discord
    app.discord.client.on("connected", () => {
        console.log("[DiscordRPC] Successfully Connected to Discord!");
    });

    // Error Handler
    app.discord.client.on('error', err => {
        console.log(`[DiscordRPC] Error: ${err}`);
        console.log(`[DiscordRPC] Disconnecting from Discord.`)
        app.discord.client.disconnect()
        app.discord.client = false;
    });


}