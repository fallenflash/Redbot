var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var config = require('../../config/config.json');
const logger = require('./../modules/logger.js');

process.on('message', (m) => {
    switch (m) {
        case 'start':
            start();
            break;
    }
})
app.use(bodyParser.json());

app.post('/', function (req, res) {

    res.json({
        message: 'Message recieved by Bitbot.'
    });
    // console.log(req.body);
    // Turn the response into something easier to work with.
    let message = {
        "body": req.body
    };
    logger.log(message);
    post(message);
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