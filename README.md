> [<img src="https://img.shields.io/badge/Telegram-%40Me-orange">](https://t.me/roddyfred)

# Use Node.Js 18 or later

## Functionality

| Functional                            | Supported |
| ------------------------------------- | :-------: |
| Claiming mining reward                |    ✅     |
| Upgrades                              |    ✅     |
| Multithreading                        |    ✅     |
| Data caching                          |    ✅     |
| Creating sessions with qrcode         |    ✅     |
| Using a session/query_id              |    ✅     |
| Binding a proxy to a session/query_id |    ✅     |
| Random sleep time between clicks      |    ✅     |

### [How to add query id](https://github.com/Freddywhest/RockyRabbitBot/blob/main/AddQueryId.md)

## [Settings](https://github.com/FreddyWhest/VertusBot/blob/main/.env-example)

| Settings                      | Description                                                               |
| ----------------------------- | ------------------------------------------------------------------------- |
| **API_ID / API_HASH**         | Platform data from which to launch a Telegram session (stock - Android)   |
| **AUTO_UPDATE_FARM**          | Whether the bot should upgrade farm (True / False)                        |
| **AUTO_UPDATE_PIGGY_BANK**    | Whether the bot should upgrade piggy farm (True / False)                  |
| **AUTO_UPDATE_SETTLEMENT**    | Whether the bot should upgrade settlement (True / False)                  |
| **AUTO_BUY_AND_UPDATE_CARDS** | Whether the bot should upgrade cards (True / False)                       |
| **BALANCE_TO_SAVE**           | The minimum balance the bot should stop upgrades                          |
| **SLEEP_BETWEEN_REQUESTS**    | Delay between taps in seconds (eg. 70)                                    |
| **USE_PROXY_FROM_FILE**       | Whether to use proxy from the `bot/config/proxies.js` file (True / False) |
| **USE_QUERY_ID**              | Whether to query_id instead of sessions (True / False)                    |

## Installation

You can download [**Repository**](https://github.com/FreddyWhest/VertusBot) by cloning it to your system and installing the necessary dependencies:

```shell
~ >>> git clone https://github.com/FreddyWhest/VertusBot.git
~ >>> cd VertusBot

#Linux and MocOS
~/VertusBot >>> chmod +x check_node.sh
~/VertusBot >>> ./check_node.sh

OR

~/VertusBot >>> npm install
~/VertusBot >>> cp .env-example .env
~/VertusBot >>> nano .env # Here you must specify your API_ID and API_HASH , the rest is taken by default
~/VertusBot >>> node index.js

#Windows
1. Double click on INSTALL.bat in VertusBot directory to install the dependencies
2. Double click on START.bat in VertusBot directory to start the bot

OR

~/VertusBot >>> npm install
~/VertusBot >>> cp .env-example .env
~/VertusBot >>> # Specify your API_ID and API_HASH, the rest is taken by default
~/VertusBot >>> node index.js
```

Also for quick launch you can use arguments, for example:

```shell
~/VertusBot >>> node index.js --action=1

OR

~/VertusBot >>> node index.js --action=2

#1 - Create session
#2 - Run clicker
```
