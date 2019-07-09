exports.run = (client, message, args) => {
    const ms = require('ms');
    const users = message.mentions.users;
    const roles = message.mentions.roles;
    const ids = [];
    const alert = [];
    let values = null;
    let sql = null;
    let result = null;
    if (users) {
        users.forEach((u) => {
            ids.push(u.id);
        });
    }
    if (roles) {
        roles.forEach((r) => {
            r.members.map(m => m.id).forEach(function (roleMember) {
                ids.push(roleMember);
            });
        });
    }
    if (ids.length === 0) {
        client.logger.log("cant recognize mentions");
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
        client.logger.log("time format unrecognized.  given time " + args[0] + ',' + args[1], "error");
    }
    const mentions = args.slice(2);
    if (mentions.length === 1 && mentions[0] === 'active') {
        sql = `UPDATE 
        subscriptions a inner join ( 
            SELECT MAX(end) AS mxend,
                user
            FROM subscriptions 
            GROUP BY user) b
            ON a.user = b.user and a.end = b.mxend
            SET a.end = DATE_ADD( a.end,  INTERVAL ? SECOND);
    WHERE NOW() < a.end;`;
        values = timeDiff;
    } else if (mentions.length === 1 && mentions[0] === 'all' || mentions.length === 0) {
        sql = `UPDATE 
        subscriptions a inner join ( 
            SELECT MAX(end) AS end,
                user
            FROM subscriptions 
            GROUP BY user) b
            ON a.user = b.user and a.end = b.end
            SET a.end = DATE_ADD( a.end,  INTERVAL ? SECOND);`;
        values = timeDiff;
    } else if (mentions.length >= 1 && mentions[0] !== 'active' && mentions[0] !== 'all;') {

        sql = `UPDATE 
                subscriptions a INNER JOIN (
                SELECT MAX(end) AS end, user FROM subscriptions GROUP BY user) b 
                ON a.user = b.user AND a.end = b.end 
                SET a.end = DATE_ADD(a.end, INTERVAL ? SECOND)
                WHERE a.user IN (?);`
        values = [
            timeDiff,
            ids.join(",")
        ];
    } else {
        alert.push("I cant seem to figure out who your trying to add time to");
        client.logger.log("error with username input", "error");
    }

    if (sql !== null && values !== null && alert.length === 0) {

        client.pool.query(sql, values)
            .then(results => {
                console.log(results);
                if (ids.length > 0 && results.affectedRows === ids.length) {
                    result = "All subscriptions successfully edited.";
                } else if (mentions[0] === "all" || mentions.length === 0) {
                    result = "added ${addtime} to every members subscriptions";
                } else if (mentions[0] === "active") {
                    result = "increased all active subscription time by ${addtime}";
                }
                client.database.send({
                    type: "checkRoles",
                    message: ids.length > 0 ? ids.join(",") : null
                });
                message.channel.send(result);
            }).catch(err => {
                console.log(err);
                client.logger.error("mysql error" + err);
            });

    } else if (!sql || !values) {
        alert.push("error with your sql query -- please contact bot administrator");
    }

    if (alert.length > 0) {
        message.channel.send(JSON.stringify(
            alert
        ));
    }
};
exports.conf = {
    aliases: ['add'],
    enabled: true,
    guildOnly: false,
    permLevel: "Administrator"
};

exports.help = {
    category: "subscription",
    description: "adds time to the users subscriptions and verifies appropriate roles",
    name: "addtime",
    usage: "addtime <amount> <denomination> <all|active|user|role>..."
};