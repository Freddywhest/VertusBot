const register = require("../core/register");
const logger = require("./logger");
const { select } = require("@inquirer/prompts");
const fs = require("fs");
const path = require("path");
const settings = require("../config/config");
const proxies = require("../config/proxies");
const { program, Option } = require("commander");
const { TelegramClient } = require("telegram");
const Tapper = require("../core/tapper");
const { StringSession } = require("telegram/sessions");
const logger2 = require("./TldLogger");
const os = require("os");

class Luncher {
  #start_text;
  constructor() {
    this.#start_text = `
╔╗  ╔╗        ╔╗         ╔══╗      ╔╗ 
║╚╗╔╝║       ╔╝╚╗        ║╔╗║     ╔╝╚╗
╚╗║║╔╝╔══╗╔═╗╚╗╔╝╔╗╔╗╔══╗║╚╝╚╗╔══╗╚╗╔╝
 ║╚╝║ ║╔╗║║╔╝ ║║ ║║║║║══╣║╔═╗║║╔╗║ ║║ 
 ╚╗╔╝ ║║═╣║║  ║╚╗║╚╝║╠══║║╚═╝║║╚╝║ ║╚╗
  ╚╝  ╚══╝╚╝  ╚═╝╚══╝╚══╝╚═══╝╚══╝ ╚═╝
© Freddy Bots   


`;
  }

  #printStartText() {
    logger.info(
      `Detected <lb>${this.#get_sessions().length}</lb> sessions | <pi>${
        this.#get_proxies() && Array.isArray(this.#get_proxies())
          ? this.#get_proxies().length
          : 0
      }</pi> proxies`
    );
    logger.paragraph(
      `<ye><u><b>WARNING</b></u></ye> <br />
<b><bl>en:</bl></b> NOT FOR SALE
<b><bl>ru:</bl></b> НЕ ДЛЯ ПРОДАЖИ
<b><bl>es:</bl></b> NO VENTA
<b><bl>fr:</bl></b> PAS À VENDRE
<b><bl>it:</bl></b> NON PER VENDITA
<b><bl>gh:</bl></b> YƐN TƆN

<b>For updates and more bots join us:</b> 
<la>https://t.me/freddy_bots</la>
`
    );
    console.log(this.#start_text);
  }
  async process() {
    let action;
    program
      .addOption(
        new Option("--action <action>", "Action type").choices(["1", "2"])
      )
      .showHelpAfterError(true);

    program.parse();
    const options = program.opts();
    action = options ? parseInt(options.action) : null;
    if (!action) {
      this.#printStartText(); // print start text
      let userInput = "";

      while (true) {
        userInput = await select({
          message: "What would you like to do:\n",
          choices: [
            {
              name: "Create session",
              value: "1",
              description: "\nCreate a new session for the bot",
            },
            {
              name: "Run bot",
              value: "2",
              description: "\nStart the bot",
            },
          ],
        });

        if (!userInput.trim().match(/^[1-2]$/)) {
          logger.warning("Action must be 1 or 2");
        } else {
          break;
        }
      }

      action = parseInt(userInput.trim());
    }

    if (action === 1) {
      register.start();
    } else if (action === 2) {
      const tgClients = await this.#get_tg_clients();
      await this.#run_tasks(tgClients);
    }
  }

  async #get_tg_clients() {
    const sessions = this.#get_sessions();
    const tgClients = sessions.map((session) => {
      try {
        const sessionContent = fs.readFileSync(
          path.join(process.cwd(), "sessions", session + ".session"),
          "utf8"
        );
        if (!sessionContent) {
          logger.error(
            `<la><b>${session}</b></la> | Session is empty or expired. Create a new one.`
          );
          return;
        }

        const sessionData = JSON.parse(sessionContent);

        if (!settings.API_ID || !settings.API_HASH) {
          logger.error("API_ID and API_HASH must be provided.");
          process.exit(1);
        }

        if (
          !sessionData.sessionString ||
          !sessionData.apiId ||
          !sessionData.apiHash
        ) {
          logger.error(
            `<la><b>${session}</b></la> | Invalid session data. Create a new one.`
          );
          process.exit(1);
        }

        if (!/^\d+$/.test(sessionData.apiId)) {
          logger.error(
            `<la><b>${session}</b></la> | Invalid session data. Create a new one.`
          );
          process.exit(1);
        }
        const sessionString = new StringSession(sessionData.sessionString);
        const tg_client = new TelegramClient(
          sessionString,
          sessionData.apiId,
          sessionData.apiHash,
          {
            connectionRetries: 5,
            deviceModel: "Freddy Bots [VertusBot] - " + os.type(),
            appVersion: "1.0.0",
            systemVersion: "1.0.0",
            langCode: "en",
            baseLogger: logger2,
          }
        );
        return {
          tg_client,
          session_name: session,
        };
      } catch (error) {
        logger.error(`<la><b>${session}</b></la> | Error: ${error.message}`);
      }
    });
    return tgClients;
  }

  #get_sessions() {
    const filePath = path.join(process.cwd(), "sessions");
    if (!fs.existsSync(filePath)) {
      return [];
    }
    //open the sessions folder and the total number files in it
    const sessions = fs.readdirSync(filePath).map((file) => {
      const sessionsName = file.endsWith(".session")
        ? file.split(".")[0]
        : null;
      return sessionsName;
    });
    return sessions;
  }

  #get_proxies() {
    if (!settings.USE_PROXY_FROM_FILE) return null;
    return proxies;
  }

  async #run_tasks(tgClients) {
    const proxies = this.#get_proxies();
    let proxiesCycle = proxies ? proxies[Symbol.iterator]() : null;
    const tasks = tgClients.map(async (tgClient) => {
      const proxy = proxiesCycle ? proxiesCycle.next().value : null;

      try {
        await new Tapper(tgClient).run(proxy);
      } catch (error) {
        logger.error(`Error in task for tg_client: ${error.message}`);
      }
    });

    // Wait for all tasks to complete
    await Promise.all(tasks);
  }
}
const luncher = new Luncher();
module.exports = luncher;
