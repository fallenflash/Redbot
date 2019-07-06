const config = require('../../config/config.json');
const mysql = require('mysql');
const fs = require('fs');
const logger = require('./../modules/logger.js');
const schemaVersion = 1;
let populated = null;
const trick = {
  config: config,
}
var conn = require("../modules/db.js")(trick);

function init() {
  conn.query('SELECT `version`, `populated` FROM `schema;', function (err, results, fields) {
    if (err) {
      if (err.errno == 1146) {
        dbFunctions.create();
      } else {
        throw err;
      }
    }

    var version = results[0].version;
    populated = results[0].populated;
    if (version == schemaVersion) {
      logger.log('Schema version ' + version + ',and up to date', "log");
    }
    if (populated === 0) {
      message = {
        type: 'getMembers',
        data: 0
      };
      process.send(message);
    }
  });

  dbFunctions.checkActive('first');

  setInterval(function () {
    dbFunctions.checkActive();
  }, 300000);

}



process.on('message', (m) => {
  logger.log("database worker recieved message " + m.type, "log");
  var type = m.type;
  var data = m.data;
  switch (type) {
    case "addTime":
      var time = data.time;
      var period = data.period;
      var user = data.user;
      break;
    case "test":
      logger.debug(data);
      break;
    case "fillDb":
      dbFunctions.populate(data);
      break;
    case "ready":
      init();
      break;
    default:
      logger.warn(type = ":" + data);
      break;
  }
});


var dbFunctions = {
  create: function () {
    var sql = fs.readFileSync(__dirname + '/../utils/create.sql').toString();
    conn.query(sql, function (err, results) {
      if (err) throw err
      // `results` is an array with one element for every statement in the query:
      var i;
      for (i = 0; i < results.length; i++) {
        logger.debug(results[i]);
      }
    });
  },
  populate: function (users) {
    users = JSON.parse(users);
    let i = 0;
    const message = [];
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
    let sql = "INSERT IGNORE INTO users (id, username, discrim, joined, created, avatar) VALUES ?";
    let sql2 = "INSERT IGNORE INTO subscriptions (user, created_by) VALUES ?";
    conn.query(sql, [values1], function (err, result) {
      if (err) throw err;
      if (result) logger.log('inserted ' + result.affectedRows + ' users into initial DB.')
    });
    conn.query(sql2, [values2], function (err, result) {
      if (err) throw err;
      if (result) logger.log('created ' + result.affectedRows + ' starter subscriptions for placeholding');
    });
    conn.query("UPDATE `schema` set `populated` = '1'");
    process.send({
      type: "message",
      data: message.join("\n")
    });
    dbFunctions.checkActive();
  },
  checkActive: function (ids = null) {
    let sql = null;
    if (ids === 'first') {
      sql = "SELECT `user`, `active` from `active`;";
    } else if (ids && ids !== 'first') {
      sql = "SELECT `user`, active` FROM `active` WHERE `id` IN (" + ids.join(',') + ");";
    } else {
      sql = "SELECT `user`, `active` FROM `active` WHERE `updated` > CURRENT_TIMESTAMP() - INTERVAL 5 MINUTE;";
    }
    conn.query(sql, function (err, res) {
      if (err) throw err;
      if (res) {
        const roleMessage = {
          add: [],
          remove: []
        };
        res.forEach((item) => {
          if (item.active === 0) roleMessage.remove.push(item.user);
          if (item.active === 1) roleMessage.add.push(item.user);
        });
        process.send({
          type: "updateSubscription",
          data: JSON.stringify(roleMessage)
        });
      }
    });
  }
}