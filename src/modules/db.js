module.exports = (client) => {
    const mysql = require('mysql');
    const util = require('util');

    const pool = mysql.createPool({
        connectionLimit: client.config.database.connections,
        host: client.config.database.host,
        user: client.config.database.user,
        password: client.config.database.password,
        database: client.config.database.name,
        port: client.config.database.port,
        charset: 'utf8mb4'
    });

    // Ping database to check for common exception errors.
    pool.getConnection((err, connection) => {
        if (err) {
            if (err.code === 'PROTOCOL_CONNECTION_LOST') {
                client.logger.log('Database connection was closed.', 'error');
            }
            if (err.code === 'ER_CON_COUNT_ERROR') {
                client.logger.log('Database has too many connections.', 'error');
            }
            if (err.code === 'ECONNREFUSED') {
                client.logger.log('Database connection was refused.', 'error');
            }
        }
        if (connection) connection.release();

    });

    pool.query = util.promisify(pool.query);

    return pool;
};