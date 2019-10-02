exports.run = (client, message) => {
    const embed = require(__dirname + '/../modules/embed.js');
    const timeMessage = client.config.server.demoLength > 1 ? `${client.config.server.demoLenth} hours` : `${client.config.server.demoLenth} hour`;
    const user = message.member;
    const subRole = client.config.server.subscriberRole;
    const check = `SELECT * FROM subscriptions WHERE user = ${user.id} AND created_by = 'demo';`;
    let demoEmbed;
    client.pool.query(check, (err, res) => {
        if (err) client.logger.error(err);
        if (res.length === 0) {
            const demo = `INSERT INTO 
                subscriptions (user, created_by, end) 
                values (${user.id}, 'demo', CURRENT_TIMESTAMP + INTERVAL ${client.config.server.demoLength} HOUR);`;
            client.pool.query(demo, (err, result) => {
                if (err) client.logger.error(err);
                if (result.affectedRows === 1) {
                    client.addRole(user.id, subRole)
                        .then(() => {
                            demoEmbed = embed.demo(client, message, timeMessage);
                            console.log(demoEmbed);

                            message.channel.send(demoEmbed);
                        })
                        .catch(err => {
                            client.logger.error(err);
                            message.channel.send(`Sorry ${user.displayName}, there seems to be an issue, please contact an admin for help`);
                        });
                } else {
                    message.channel.send(`Sorry ${user.displayName}, there seems to be an issue, please contact an admin for help`);
                }
            });
        } else if (res.length === 1) {
            demoEmbed = embed.demo(client, message);
            console.log(demoEmbed);
            message.channel.send({
                embed: demoEmbed
            });
        }
    });
};
exports.conf = {
    aliases: ['demo'],
    enabled: true,
    guildOnly: false,
    permLevel: 'User'
};

exports.help = {
    category: 'subsctiption',
    description: 'gives the user a 1 time 1 hour demo of what subscription offers',
    name: 'demo',
    usage: 'demo'
};