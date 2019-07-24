module.exports = (client) => {
    var message = client.config.bot.ready ? client.config.bot.ready : "hiya";
    if (client.config.bot.ready === message) {
        var channel = client.config.server.defaultChannel;
        client.channels.get(channel).send(message);
        client.logger.log('ready');
        client.database.send({
            type: "ready",
            data: "ready"
        });
    } else {
        client.logger.log(message, "warning");
    }
}