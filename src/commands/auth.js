exports.run = (client, message, args) => {
    const moment = require('moment');
    const ms = require('ms');
    const users = message.mentions.members.filter(member => !member.user.bot);
    const alert = [];
    const values = [];
    if (users.length === 0) {
        client.logger.error('no users mentioned');
        alert.push("I don't recognize who your trying to add time too");
    }
    if (['m', 'months', 'month', 'mth'].includes(args[1])) {
        args[0] *= 30;
        args[1] = 'days';
    } else if (['week', 'wks', 'w', 'weeks'].includes(args[1])) {
        args[0] *= 7;
        args[1] = 'days';
    }
    const addtime = args[0] + ' ' + args[1];
    const timeDiff = ms(addtime) / 1000;
    if (!timeDiff) {
        alert.push("I cant recognize the time");
        client.logger.error("time format unrecognized.  given time " + args[0] + ',' + args[1]);
    }
    if (users.length !== 0 && timeDiff) {
        current = `SELECT 
                    if (MAX(end) >= CURRENT_TIMESTAMP, MAX(end), CURRENT_TIMESTAMP) as ending,
                    user as user
                    FROM subscriptions WHERE user in (?);`;
        client.pool.query(current, [users.map(u => u.id).join(',')], function (err, res) {
            if (err) {
                alert.push(`error checking previous subscriptions`);
                client.logger.warn(`error checking previous subscriptions`);
            }
            if (res) {
                const newSub = `INSERT INTO subscriptions (user, created_by, begin, end)
                                VALUES ?;`;
                res.forEach(result => {
                    let u = result.user;
                    let b = moment(result.ending).format('YYYY-MM-DD HH:mm:ss');
                    let e = moment(b).add(timeDiff, 'seconds').format('YYYY-MM-DD HH:mm:ss');
                    values.push([u, message.author.username, b, e]);
                });
                client.pool.query(newSub, [values], function (err, res) {
                    if (err) {
                        alert.push(`error adding new subscriptions`);
                        client.logger.warn(`error adding new subscriptions`);
                    }
                    if (res) {
                        let ids = users.map(u => u.id);
                        ids.forEach(id => {
                            client.addRole(id, client.config.server.subscriberRole)
                                .then(res => {
                                    if (res) client.logger.log(`added ${res.role} to ${res.member}`);
                                })
                                .catch(err => {
                                    client.logger.warn(err);
                                });
                        });
                    }
                });
            }
        })

    } else {
        alert.push("Its just all messed up now isn't it");
        client.logger.error("error with everything");
    }
    if (alert.length > 0) {
        client.channels.get(client.config.bot.logChannel).send(alert.join("\n"));
    } else {
        let names = users.map(user => user.displayName).join(", ");
        message.channel.send(`Succesfully added subscriptions for ${names} `);
    }
}
exports.conf = {
    aliases: ['authorize'],
    enabled: true,
    guildOnly: false,
    permLevel: "Administrator"
};

exports.help = {
    category: "subscription",
    description: "used for adding subsctriptions to a single or multiple users",
    name: "auth",
    usage: "auth <amount> <denomination> <user mention[s]> ..."
};