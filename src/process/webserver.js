const express = require('express');
const helmet = require('helmet');
const bodyParser = require('body-parser');
const fs = require('fs');
const app = express();
const ini = require('ini');
const config = ini.parse(fs.readFileSync(__dirname + '/../../config/config.ini', 'utf-8'));
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
        message: 'Message Received by Redbot'
    });
    if (config.webServer.webhookSource === req.headers['x-wc-webhook-source'] ||
        config.webServer.webhookSource === 'false') {
        if (req.headers['x-wc-webhook-resource'] !== "order") {
            logger.debug(`webhook received for resources: ${req.headers['x-wc-webhook-resource']} ignored.`);

        } else {
            if (req.body.status === "processing") {
                let message = {
                    wooCommerceID: req.body.id,
                    created: req.body.date_created_gmt,
                    user: req.body.customer_note,
                    purchases: req.body.line_items.map(item => item.name)

                };
                process.send({
                    "type": "webhookReceived",
                    "data": JSON.stringify(message)
                });

            }
        }
    } else {
        logger.warn(`Webhook from ${req.headers['x-wc-webhook-source']} received. source not verified`);

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