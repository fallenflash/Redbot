// first import configuration
if (Number(process.version.slice(1).split('.')[0]) < 8) throw new Error('Node 8.0.0 or higher is required. Update Node on your system.');
const discord = require('discord.js');
const ini = require('ini');
const fs = require('fs');
const client = new discord.Client();
const configFile = ini.parse(fs.readFileSync(__dirname + '/../../config/config.ini', 'utf-8'));
const mysql = require('mysql');


client.config = require(__dirname + '/../modules/config.js')(configFile);
client.logger = require(__dirname + '/../modules/logger.js');
client.functions = require(__dirname + '/../modules/functions.js')(client);
client.conn = mysql.createConnection({
    host: client.config.database.host,
    user: client.config.database.user,
    password: client.config.database.password,
    database: client.config.database.name,
    port: client.config.database.port,
    multipleStatements: true,
    charset: 'utf8mb4'
});


const init = () => {

    client.on('ready', function() {
        client.logger.log('ready');
        install();
    });
    client.login(client.config.token);
};

const createDB = () => {
    const sqlFile = fs.readFileSync(__dirname + '/create.sql').toString();
    client.conn.connect(function(err) {
        if (err) client.logger.error(err);
        client.conn.query(sqlFile, function(error, result) {
            if (result) {
                client.logger.debug(result);
            } else if (error) {
                client.logger.error(error);
            }
        });
    });
    client.logger.log('database created');
};

function populate(users) {
    const values1 = [];
    const values2 = [];
    let i = 0;
    for (i = 0; i < users.length; i++) {
        const j = i + 1;
        client.logger.debug(`processing user ${j}`);
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
    client.conn.query(sql, [values1], function(err, result) {
        client.logger.debug('insert');
        if (err) client.logger.error(err);
        if (result) client.logger.log('inserted ' + result.affectedRows + ' users into initial DB.');
    });
    client.conn.query(sql2, [values2], function(err, result) {
        client.logger.debug('create');
        if (err) client.logger.error(err);
        if (result) client.logger.log('created ' + result.affectedRows + ' starter subscriptions for placeholding');
    });
    client.conn.query('UPDATE bot set populated = 1');
    client.logger.log('database set to populated');

}
const getMembers = (guild) => {
    guild = client.guilds.get(guild);
    guild.fetchMembers();
    const userDB = guild.members.filter(member => !member.user.bot).map((m) => {
        const member = [
            m.id,
            m.user.username,
            m.user.discriminator,
            m.joinedAt,
            m.user.createdAt,
            m.user.avatarURL
        ];
        return member;
    });
    client.logger.log(`successfully compiled data for ${userDB.length} members`);
    return userDB;
};

const install = () => {
    createDB();
    const members = getMembers(client.config.server.serverId);
    populate(members);
    client.logger.log('Instalation Complete');
    client.logger.log('Start Bot with \'Node app.js\'');
    client.conn.end();
    process.exit();
};
init();