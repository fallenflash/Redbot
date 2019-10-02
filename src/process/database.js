/* eslint-disable indent */
const fs = require('fs');
const ini = require('ini');
const config = ini.parse(fs.readFileSync(__dirname + '/../../config/config.ini', 'utf-8'));
const logger = require('./../modules/logger.js');
const botVersion = 1;
const trick = {
    config: config,
    logger: logger
};
const conn = require('../modules/db.js')(trick);
const polingTime = config.server.polingTime ? config.server.polingTime : 300;

function init() {
    conn.query('SELECT `version`, `populated` FROM `bot`;')
        .then(results => {
            const version = results[0].version;
            const populated = results[0].populated;
            if (version == botVersion) {
                logger.log('Bot version ' + version + ',and up to date');
            }
            if (populated === 0) {
                const message = {
                    type: 'getMembers',
                    data: 0
                };
                process.send(message);
            } else {
                dbFunctions.checkActive('first');

            }
        }).catch(err => {
            if (err.errno == 1146) {
                dbFunctions.create();
            } else {
                throw err;
            }
        });

    setInterval(function() {
        logger.debug(`checking subscriptions, next check in ${polingTime} seconds`);
        dbFunctions.checkActive(polingTime);
    }, polingTime * 1000);
}


process.on('message', (m) => {
    logger.debug('database worker recieved message ' + m.type, 'log');
    const type = m.type;
    const data = m.data;
    switch (type) {
        case 'addTime':
            break;
        case 'test':
            logger.debug(data);
            break;
        case 'fillDb':
            dbFunctions.populate(data);
            break;
        case 'ready':
            init();
            break;
        case 'checkRoles':
            dbFunctions.checkActive(data);
            break;
        default:
            logger.warn(type + ':' + data);
            break;
    }
});


const dbFunctions = {
    create: function() {
        const sql = fs.readFileSync(__dirname + '/../utils/create.sql').toString();
        const sqlArray = sql.split(';');
        for (let i = 0; i < sqlArray.length; i++) {
            if (sqlArray[i].length > 0) {
                conn.syncQuery(sqlArray[i], function(err, res) {
                    if (err) logger.error([err, sqlArray[i]]);
                    if (res) logger.log(res);
                });
            }
        }

        logger.log('database created');
        const message = {
            type: 'getMembers',
            data: 0
        };
        process.send(message);
    },
    populate: async function(users) {
        users = JSON.parse(users);
        let i = 0;
        const values1 = [];
        const values2 = [];
        for (i = 0; i < users.length; i++) {

            values1.push([
                users[i][0],
                users[i][1],
                users[i][2],
                users[i][3],
                users[i][4],
                users[i][5]
            ]);
            values2.push([
                users[i][0],
                'initial'
            ]);
        }
        const sql = 'INSERT IGNORE INTO users (id, username, discrim, joined, created, avatar) VALUES ?';
        const sql2 = 'INSERT IGNORE INTO subscriptions (user, created_by) VALUES ?';
        const userInsert = await conn.query(sql, [values1])
            .catch((err) => {
                logger.error(err);
            });
        const subInsert = await conn.query(sql2, [values2])
            .catch((err) => {
                logger.error(err);
            });
        logger.log('inserted ' + userInsert.affectedRows + ' users into initial DB.');
        logger.log('created ' + subInsert.affectedRows + ' starter subscriptions for placeholding');

        conn.query('UPDATE bot set populated = 1')
            .then(() => {
                logger.log('database populated, checking active subscriptions');
                dbFunctions.checkActive('first');
            });
    },
    checkActive: function(ids) {
        let sql = null;
        if (ids === 'first') {
            sql = 'SELECT user, active from active;';
        } else if (ids === polingTime) {
            ids += 1;
            sql = `SELECT 
                        user, 
                        active 
                    FROM active 
                    WHERE (final > date_sub(CURRENT_TIMESTAMP(), INTERVAL ${ids} SECOND) AND final < CURRENT_TIMESTAMP()) OR updated > date_sub(CURRENT_TIMESTAMP(), INTERVAL ${ids} SECOND);`;
        } else {
            sql = 'SELECT user, active FROM active WHERE user IN (' + ids + ');';
        }
        conn.query(sql)
            .then(res => {
                const roleMessage = {
                    add: [],
                    remove: []
                };
                res.forEach((item) => {
                    if (item.active === 0) roleMessage.remove.push(item.user);
                    if (item.active === 1) roleMessage.add.push(item.user);
                });
                if (roleMessage.add.length > 0 || roleMessage.remove.length > 0) {
                    process.send({
                        type: 'updateSubscription',
                        data: JSON.stringify(roleMessage)
                    });
                }
            }).catch(err => {
                logger.error(err);
            });
    }
};