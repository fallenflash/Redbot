module.exports = (client, member) => {
    if (member.user.bot) {
        return client.logger.log(`Bot ${member.displayName} joined the guild, no action taken`);
    }
    const id = member.id;
    client.pool.query(`SELECT * FROM users WHERE id = ${id}`)
        .then((res) => {
            if (res.length === 0) {
                const sql = 'INSERT IGNORE INTO users (id, username, discrim, joined, created, avatar) VALUES ?';
                const sql2 = 'INSERT IGNORE INTO subscriptions (user, created_by) VALUES ?';
                const values = {
                    one: [
                        member.id,
                        member.user.username,
                        member.user.discriminator,
                        member.joinedAt,
                        member.user.createdAt,
                        member.user.avatarURL
                    ],
                    two: [
                        member.id,
                        'initial'
                    ]
                };
                client.pool.query(sql, [values.one])
                    .then((re) => {
                        if (re.affectedRows === 1) {
                            client.pool.query(sql2, [values.two], function(err, result) {
                                if (err) client.logger.error(err);
                                if (result.affectedRows) client.logger.log(`added ${member.displayName} to the database`);
                            });
                        }
                    })
                    .catch((err) => {
                        client.logger.error(err);
                    });
            }
        })
        .catch(() => {
            client.logger.warn(`error adding member ${member.displayName} to database`);
        });

};