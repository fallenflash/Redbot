module.exports = (client, info) => {
    if (client.config.bot.logLevel && client.config.bot.logLevel === 'debug') {
        client.logger.debug(info);
    } else {
        return null;
    }
};