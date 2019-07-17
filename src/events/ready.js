module.exports = (client) => {
    var message = client.config.bot.ready ? client.config.bot.ready : "hiya";
    if (client.config.bot.ready === message) {
        var channel = client.config.bot.defaultChannel;
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