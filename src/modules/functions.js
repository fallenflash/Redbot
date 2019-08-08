module.exports = (client) => {

    client.addRole = async (user, role) => {
        const guild = client.guilds.get(client.config.server.serverId);
        role = guild.roles.get(role);
        const member = guild.members.get(user);
        if (member) {
            if (!member.roles.has(role.id)) {
                await member.addRole(role)
                    .catch((err) => {
                        throw new Error(err);
                    });
                return {
                    member: member.displayName,
                    role: role.name,
                    status: 'updated'
                };
            } else {
                return {
                    member: member.displayName,
                    role: role.name,
                    status: 'not updated'
                };
            }
        } else {
            return false;
        }
    };
    client.removeRole = async (user, role) => {
        const guild = client.guilds.get(client.config.server.serverId);
        role = guild.roles.get(role);
        const member = guild.members.get(user);
        if (member) {
            if (member.roles.has(role.id)) {
                await member.removeRole(role)
                    .catch((err) => {
                        throw new Error(err);
                    });
                return {
                    member: member.displayName,
                    role: role.name,
                    status: 'updated'
                };
            } else {
                return {
                    member: member.displayName,
                    role: role.name,
                    status: 'not updated'
                };
            }
        }
        return false;
    };
    client.findMemberByName = async (user, guild = client.config.server.serverId) => {
        const regex = /((?!_)[^@#:]{1,32}(?<!_))#?(\d{4})?/gui;
        const match = regex.exec(user.trim().toLowerCase());
        let result;
        if (match[0] && match[2]) {
            result = await client.guilds.get(guild)
                .members.find(member => member.user.tag === match[0]);
        } else if (match[0] && !match[2]) {
            result = await client.guilds.get(guild)
                .members.find(member => member.displayName === match[1]);
            if (!result) {
                result = await client.guilds.get(guild)
                    .members.find(member => member.user.username === match[1]);
            }
        }
        if (result) {
            return result;
        } else {
            client.logger.warn(`unable to find user ${user.trim()}`);
            return false;
        }


    };
    /*
    PERMISSION LEVEL FUNCTION
    This is a very basic permission system for commands which uses "levels"
    "spaces" are intentionally left black so you can add them if you want.
    NEVER GIVE ANYONE BUT OWNER THE LEVEL 10! By default this can run any
    command including the VERY DANGEROUS `eval` and `exec` commands!
    */
    client.permlevel = message => {
        let permlvl = 0;

        const permOrder = client.config.permLevels.slice(0).sort((p, c) => p.level < c.level ? 1 : -1);

        while (permOrder.length) {
            const currentLevel = permOrder.shift();
            if (message.guild && currentLevel.guildOnly) continue;
            if (currentLevel.check(message)) {
                permlvl = currentLevel.level;
                break;
            }
        }
        return permlvl;
    };

    /*
    GUILD SETTINGS FUNCTION
    This function merges the default settings (from config.defaultSettings) with any
    guild override you might have for particular guild. If no overrides are present,
    the default settings are used.
    */

    // THIS IS HERE BECAUSE SOME PEOPLE DELETE ALL THE GUILD SETTINGS
    // And then they're stuck because the default settings are also gone.
    // So if you do that, you're resetting your defaults. Congrats.
    const defaultSettings = {
        prefix: client.config.bot.prefix ? client.config.bot.prefix : '-',
        modLogChannel: client.config.server.modLogChannel ? client.config.server.modLogChannel : 'mod-log',
        modRole: client.config.server.modRole ? client.config.server.modRole : 'Moderator',
        adminRole: client.config.server.adminRole ? client.config.server.adminRole : 'Administrator',
        systemNotice: client.config.bot.systemNotice ? client.config.bot.systemNotice : 'true',
        welcomeChannel: client.config.server.welcomeChannel ? client.config.server.welcomeChannel : 'welcome',
        welcomeMessage: client.config.server.welcomeMessage ? client.config.server.welcomeMessage : 'Say hello to {{user}}, everyone! We all need a warm welcome sometimes :D',
        welcomeEnabled: client.config.server.welcomeEnabled ? client.config.server.welcomeEnabled : 'false'
    };

    // getSettings merges the client defaults with the guild settings. guild settings in
    // enmap should only have *unique* overrides that are different from defaults.
    client.getSettings = (guild) => {
        client.settings.ensure('default', defaultSettings);
        if (!guild) return client.settings.get('default');
        const guildConf = client.settings.get(guild.id) || {};
        // This "..." thing is the "Spread Operator". It's awesome!
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Spread_syntax
        return ({
            ...client.settings.get('default'),
            ...guildConf
        });
    };

    /*
    SINGLE-LINE AWAITMESSAGE
    A simple way to grab a single reply, from the user that initiated
    the command. Useful to get "precisions" on certain things...
    USAGE
    const response = await client.awaitReply(msg, "Favourite Color?");
    msg.reply(`Oh, I really love ${response} too!`);
    */
    client.awaitReply = async (msg, question, limit = 60000) => {
        const filter = m => m.author.id === msg.author.id;
        await msg.channel.send(question);
        try {
            const collected = await msg.channel.awaitMessages(filter, {
                max: 1,
                time: limit,
                errors: ['time']
            });
            return collected.first().content;
        } catch (e) {
            return false;
        }
    };


    /*
    MESSAGE CLEAN FUNCTION
    "Clean" removes @everyone pings, as well as tokens, and makes code blocks
    escaped so they're shown more easily. As a bonus it resolves promises
    and stringifies objects!
    This is mostly only used by the Eval and Exec commands.
    */
    client.clean = async (text) => {
        if (text && text.constructor.name == 'Promise') {
            text = await text;
        }
        if (typeof evaled !== 'string') {
            text = require('util').inspect(text, {
                depth: 1
            });
        }

        text = text
            .replace(/`/g, '`' + String.fromCharCode(8203))
            .replace(/@/g, '@' + String.fromCharCode(8203))
            .replace(client.token, 'mfa.VkO_2G4Qv3T--NO--lWetW_tjND--TOKEN--QFTm6YGtzq9PH--4U--tG0');

        return text;
    };

    client.loadCommand = (commandName) => {
        try {
            client.logger.log(`Loading Command: ${commandName}`);
            const props = require(`./../commands/${commandName}`);
            if (props.init) {
                props.init(client);
            }
            client.commands.set(props.help.name, props);
            props.conf.aliases.forEach(alias => {
                client.aliases.set(alias, props.help.name);
            });
            return false;
        } catch (e) {
            return `Unable to load command ${commandName}: ${e}`;
        }
    };

    client.unloadCommand = async (commandName) => {
        let command;
        if (client.commands.has(commandName)) {
            command = client.commands.get(commandName);
        } else if (client.aliases.has(commandName)) {
            command = client.commands.get(client.aliases.get(commandName));
        }
        if (!command) return `The command \`${commandName}\` doesn"t seem to exist, nor is it an alias. Try again!`;

        if (command.shutdown) {
            await command.shutdown(client);
        }
        const mod = require.cache[require.resolve(__dirname + `/src/commands/${commandName}`)];
        delete require.cache[require.resolve(__dirname + `/src/commands/${commandName}.js`)];
        for (let i = 0; i < mod.parent.children.length; i++) {
            if (mod.parent.children[i] === mod) {
                mod.parent.children.splice(i, 1);
                break;
            }
        }
        return false;
    };

    client.populateDB = (guild) => {
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
        const message = {
            type: 'fillDb',
            data: JSON.stringify(userDB)
        };
        client.database.send(message);

    };

    /* MISCELANEOUS NON-CRITICAL FUNCTIONS */

    // EXTENDING NATIVE TYPES IS BAD PRACTICE. Why? Because if JavaScript adds this
    // later, this conflicts with native code. Also, if some other lib you use does
    // this, a conflict also occurs. KNOWING THIS however, the following 2 methods
    // are, we feel, very useful in code.

    // <String>.toPropercase() returns a proper-cased string such as:
    // "Mary had a little lamb".toProperCase() returns "Mary Had A Little Lamb"
    Object.defineProperty(String.prototype, 'toProperCase', {
        value: function() {
            return this.replace(/([^\W_]+[^\s-]*) */g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
        }
    });

    // <Array>.random() returns a single random element from an array
    // [1, 2, 3, 4, 5].random() can return 1, 2, 3, 4 or 5.
    Object.defineProperty(Array.prototype, 'random', {
        value: function() {
            return this[Math.floor(Math.random() * this.length)];
        }
    });

    // `await client.wait(1000);` to "pause" for 1 second.
    client.wait = require('util').promisify(setTimeout);

    // These 2 process methods will catch exceptions and give *more details* about the error and stack trace.
    process.on('uncaughtException', (err) => {
        const errorMsg = err.stack.replace(new RegExp(`${__dirname}/`, 'g'), './');
        const errorArray = errorMsg.split('\n');
        errorArray[0] = `Uncaught Exception: ${errorArray[0]}`;
        for (let i = 0; i < errorArray.length; i++) {
            client.logger.error(errorArray[i].trim());
        }
        console.error(err);
        // Always best practice to let the code crash on uncaught exceptions.
        // Because you should be catching them anyway.
        process.exit(1);
    });

    process.on('unhandledRejection', err => {
        client.logger.error(`Unhandled rejection: ${err}`);
        console.error(err);
    });
};