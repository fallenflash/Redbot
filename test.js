const moment = require('moment');
const ini = require('ini');
const fs = require('fs');
const config = ini.parse(fs.readFileSync(__dirname + '/config/config.ini', 'utf-8'));
const tester = {
    config: config
};
const pool = require(__dirname + '/src/modules/db.js')(tester);
const now = moment();
async function test() {
    pool.query(`Select final from active LIMIT 1`).then(res => {
            let final = moment(res[0].final);
            if (now.isBefore(final)) {
                console.log([now, final]);
            }
            console.log(['after', now, final]);
        })
        .catch(err => {
            console.log(err);
        })

}
test();
console.log(moment("1 week"));