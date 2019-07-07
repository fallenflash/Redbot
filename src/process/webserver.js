const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const ini = require('ini');
const config = ini.parse(fs.readFileSync(__dirname + '/../../config/config.ini', 'utf-8'))
const logger = require('./../modules/logger.js');

process.on('message', (m) => {
    switch (m) {
        case 'start':
            start();
            break;
    }
});
app.use(helmet());
app.use(bodyParser.json());

app.post('/woocomerce', function (req, res) {

    res.json({
        message: 'Message Recieved by Redbot'
    });
    if (config.webServer.webhookSource !== req.headers['x-wc-webhook-source'] &&
        config.webServer.webhookSource !== false) {
        logger.warn(`Webhook from ${req.headers['x-wc-webhook-source']} recieved. source not verified`);
    } else {
        if (req.headers['x-wc-webhook-resource'] !== "order") {
            logger.debug(`webhook recieved for rescource: ${req.headers['x-wc-webhook-resource']} ignored.`);
        } else {

            if (req.body.status === "processing") {
                let message = {
                    wooComerceID: req.body.id,
                    dateCreated: req.body.date_created_gmt,
                    discordName: req.body.customer_note,
                    purchases: req.body.line_items.map(item => item.name)

                };
                console.log(message);

            }
        }
    }
});

// Start listening on the configured port.
function start() {

    app.listen(config.webServer.port, function () {
        process.send({
            type: 'message',
            data: 'server has started on port ' + config.webServer.port + '.'
        });
    });
}