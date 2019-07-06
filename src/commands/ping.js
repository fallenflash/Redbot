exports.run = (client, message, args) => {
    message.channel.send(":ping_pong: pong!").catch(console.error);
}
exports.conf = {
    enabled: true,
    guildOnly: false,
    aliases: ['hello'],
    permLevel: "User"
};

exports.help = {
    name: "ping",
    category: "general",
    description: "Checks to see if the bot is active",
    usage: "ping"
};