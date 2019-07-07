exports.respond = (client, message) => {
    let type = message.type;
    let data = message.data;

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
                        if (res) client.logger.log(`added ${res.role} to ${res.member}`);
                    })
                    .catch(err => {
                        client.logger.warn(err);
                    })
            }

            for (let i = 0; i < data.remove.length; i++) {
                client.removeRole(data.remove[i], role)
                    .then(res => {
                        if (res) client.logger.log(`removed ${res.role} from ${res.member}`);
                    })
                    .catch(err => {
                        client.logger.warn(err);

                    })

            }


            if (error.length >= 1) {
                client.channels.get(client.config.bot.logChannel).send(error.join("\n"));
            }

            break;
        default:
            client.logger.log(data);
            break;
    }


};