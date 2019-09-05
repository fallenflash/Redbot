# RedBot

   `--==UNFINISHED==--`

RedBot is used for synchronizing Discord roles with a subscription system.
Through commands or automatically with WooComerce roles can be applied, and RedBot will automatically remove them upon subscription expiration.

## Requirements

- **MySQL**
- **Node.js**
- **Node-gyp** - ( `npm install -g node-gyp`)
- **Discord Bot Credentials**
< For Webhooks to be sent from woocomerce for automated synchronization >
- **Port Forwarding** set up to your router

## Instalation

 1. Create a MySQL database
 2. Copy `config/config.example.ini` to `config/config.ini` and fill out
 3. Run `npm install`

## Run

 Run `node app.js`
