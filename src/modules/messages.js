exports.respond = async (client, message) => {
    let type = message.type;
    let data = message.data;
    client.logger.debug(`received ${type} message with data:`);
    client.logger.debug(data);
    switch (type) {
        case "getMembers":
            client.populateDB(client.config.server.serverId);
            break;
        case "message":
            client.logger.log(data);
            break;
        case "updateSubscription":
            data = JSON.parse(data);
            const error = [];
            const guild = client.guilds.get(client.config.server.serverId);
            const role = client.config.server.subscriberRole;
            for (let i = 0; i < data.add.length; i++) {
                client.addRole(data.add[i], role)
                    .then(res => {
                        if (res) client.logger.log(`${res.member} ${res.role} status ${res.status}`);
                    })
                    .catch(err => {
                        client.logger.warn(err);
                    })
            }
            for (let i = 0; i < data.remove.length; i++) {
                client.removeRole(data.remove[i], role)
                    .then(res => {
                        if (res) client.logger.log(`${res.member} ${res.role} status ${res.status}`);
                    })
                    .catch(err => {
                        client.logger.warn(err);
                    })
            }
            if (error.length >= 1) {
                client.channels.get(client.config.bot.logChannel).send(error.join("\n"));
            }

            break;
        case "webhookReceived":
            data = JSON.parse(data);
            const moment = require('moment');
            const created = moment(data.created);
            let duration = 0;
            let begin;
            let end;
            data.purchases.forEach(purchase => {
                duration = duration + purchase.match(/\d{1,2}/);
            });

            let user = await client.findMemberByName(data.user);
            if (user) {
                await client.addRole(user.id, client.config.server.subscriberRole)
                    .catch(err => {
                        client.logger.warn(err);
                    });
                await client.pool.query(`SELECT final FROM active WHERE user = ${user.id}`)
                    .then(res => {
                        let final = moment(res[0].final);
                        if (final.isBefore(created)) {
                            begin = created.format('YYYY-MM-DD HH:mm:ss');
                        } else {
                            begin = final.format('YYYY-MM-DD HH:mm:ss');
                        }
                        end = moment(begin).add(duration, 'M').format('YYYY-MM-DD HH:mm:ss');
                    }).catch(err => {
                        client.logger.error(err)
                    });
                await client.pool.query(`INSERT IGNORE INTO subscriptions (user,created_by,woocomerce_id, begin, end)
                                        VALUES (?,?,?,?,?)`, [user.id, 'webhook', data.wooCommerceID, begin, end])
                    .then(res => {
                        if (res.affectedRows === 1) {
                            client.logger.log(`successfully added subscription for ${user.displayName}`);
                        }
                    })
                    .catch(err => {
                        client.logger.error(`issue adding subscription from webhook ${err}`);
                    })
            } else {
                client.logger.warn(`new subscription webhook received for ${data.user}, unable to find user to update`);

            }
            break;
        default:
            client.logger.log(data);
            break;
    }


}