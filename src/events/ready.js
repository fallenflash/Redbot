module.exports = (client) => {
    const message = client.config.bot.ready ? client.config.bot.ready : 'hiya';
    if (client.config.bot.ready === message) {
        const channel = client.config.server.defaultChannel;
        client.channels.get(channel).send(message);
        client.logger.log('ready');
        client.database.send({
            type: 'ready',
            data: 'ready'
        });
    } else {
        client.logger.warn(message);
    }
};