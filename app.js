//first import configuration
if (Number(process.version.slice(1).split(".")[0]) < 8) throw new Error("Node 8.0.0 or higher is required. Update Node on your system.");

// Load up the discord.js library and other dependencies
const discord = require("discord.js");
const {
    promisify
} = require("util");
const readdir = promisify(require("fs").readdir);
const Enmap = require("enmap");
const cp = require('child_process');
const messages = require(__dirname + '/src/modules/messages.js');
const ini = require('ini');
const fs = require('fs');
// initialize discord object
const client = new discord.Client();

// load and parse and bind config file to the client
const configFile = ini.parse(fs.readFileSync(__dirname + '/config/config.ini', 'utf-8'));
client.config = require(__dirname + '/src/modules/config.js')(configFile);

//bind other helper modules to the client
client.logger = require(__dirname + "/src/modules/Logger");
client.functions = require(__dirname + "/src/modules/functions.js")(client);
client.pool = require(__dirname + "/src/modules/db.js")(client);

//webserver starting and handeling
client.server = cp.fork(__dirname + '/src/process/webserver.js');
client.server.send('start');
client.server.on('message', (m) => {
    messages.respond(client, m);
});

//handle the database watcher thread 
client.database = cp.fork(__dirname + '/src/process/database.js');
client.database.on('message', (m) => {
    messages.respond(client, m);
});

client.commands = new Enmap();
client.aliases = new Enmap();
client.settings = new Enmap({
    name: "settings"
});



const init = async () => {

    // Here we load **commands** into memory, as a collection, so they're accessible
    // here and everywhere else.
    const cmdFiles = await readdir(__dirname + "/src/commands/");
    client.logger.log(`Loading a total of ${cmdFiles.length} commands.`);
    cmdFiles.forEach(f => {
        if (!f.endsWith(".js")) return;
        const response = client.loadCommand(f);
        if (response) client.logger.log(response, "log");
    });

    // Then we load events, which will include our message and ready event.
    const evtFiles = await readdir(__dirname + "/src/events/");
    client.logger.log(`Loading a total of ${evtFiles.length} events.`);
    evtFiles.forEach(file => {
        const eventName = file.split(".")[0];
        client.logger.log(`Loading Event: ${eventName}`);
        const event = require(__dirname + `/src/events/${file}`);
        // Bind the client to any event, before the existing arguments
        // provided by the discord.js event. 
        // This line is awesome by the way. Just sayin'.
        client.on(eventName, event.bind(null, client));
    });

    // Generate a cache of client permissions for pretty perm names in commands.
    client.levelCache = {};
    for (let i = 0; i < client.config.permLevels.length; i++) {
        const thisLevel = client.config.permLevels[i];
        client.levelCache[thisLevel.name] = thisLevel.level;
    }
    //begin discord bot
    client.login(client.config.token);
};


init();