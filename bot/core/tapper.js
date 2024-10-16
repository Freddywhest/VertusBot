const { default: axios } = require("axios");
const logger = require("../utils/logger");
const headers = require("./header");
const { Api } = require("telegram");
const { HttpsProxyAgent } = require("https-proxy-agent");
const settings = require("../config/config");
const app = require("../config/app");
const user_agents = require("../config/userAgents");
const fs = require("fs");
const sleep = require("../utils/sleep");
const ApiRequest = require("./api");
var _ = require("lodash");
const parser = require("../utils/parser");
const path = require("path");
const moment = require("moment");
const _isArray = require("../utils/_isArray");
const FdyTmp = require("fdy-tmp");
const upgradeElements = require("../utils/cards");

class Tapper {
  constructor(tg_client) {
    this.bot_name = "vertus";
    this.session_name = tg_client.session_name;
    this.tg_client = tg_client.tg_client;
    this.session_user_agents = this.#load_session_data();
    this.headers = { ...headers, "user-agent": this.#get_user_agent() };
    this.api = new ApiRequest(this.session_name, this.bot_name);
    this.sleep_floodwait = 0;
    this.runOnce = false;
  }

  #load_session_data() {
    try {
      const filePath = path.join(process.cwd(), "session_user_agents.json");
      const data = fs.readFileSync(filePath, "utf8");
      return JSON.parse(data);
    } catch (error) {
      if (error.code === "ENOENT") {
        return {};
      } else {
        throw error;
      }
    }
  }

  #clean_tg_web_data(queryString) {
    let cleanedString = queryString.replace(/^tgWebAppData=/, "");
    cleanedString = cleanedString.replace(
      /&tgWebAppVersion=.*?&tgWebAppPlatform=.*?(?:&tgWebAppBotInline=.*?)?$/,
      ""
    );
    return cleanedString;
  }

  #get_random_user_agent() {
    const randomIndex = Math.floor(Math.random() * user_agents.length);
    return user_agents[randomIndex];
  }

  #get_user_agent() {
    if (this.session_user_agents[this.session_name]) {
      return this.session_user_agents[this.session_name];
    }

    logger.info(
      `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Generating new user agent...`
    );
    const newUserAgent = this.#get_random_user_agent();
    this.session_user_agents[this.session_name] = newUserAgent;
    this.#save_session_data(this.session_user_agents);
    return newUserAgent;
  }

  #save_session_data(session_user_agents) {
    const filePath = path.join(process.cwd(), "session_user_agents.json");
    fs.writeFileSync(filePath, JSON.stringify(session_user_agents, null, 2));
  }

  #get_platform(userAgent) {
    const platformPatterns = [
      { pattern: /iPhone/i, platform: "ios" },
      { pattern: /Android/i, platform: "android" },
      { pattern: /iPad/i, platform: "ios" },
    ];

    for (const { pattern, platform } of platformPatterns) {
      if (pattern.test(userAgent)) {
        return platform;
      }
    }

    return "Unknown";
  }

  #proxy_agent(proxy) {
    try {
      if (!proxy) return null;
      let proxy_url;
      if (!proxy.password && !proxy.username) {
        proxy_url = `${proxy.protocol}://${proxy.ip}:${proxy.port}`;
      } else {
        proxy_url = `${proxy.protocol}://${proxy.username}:${proxy.password}@${proxy.ip}:${proxy.port}`;
      }
      return new HttpsProxyAgent(proxy_url);
    } catch (e) {
      logger.error(
        `<ye>[${this.bot_name}]</ye> | ${
          this.session_name
        } | Proxy agent error: ${e}\nProxy: ${JSON.stringify(proxy, null, 2)}`
      );
      return null;
    }
  }

  async #get_tg_web_data() {
    try {
      const tmp = new FdyTmp({
        fileName: `${this.bot_name}.fdy.tmp`,
        tmpPath: path.join(process.cwd(), "cache/queries"),
      });
      if (tmp.hasJsonElement(this.session_name)) {
        const queryStringFromCache = tmp.getJson(this.session_name);
        if (!_.isEmpty(queryStringFromCache)) {
          const va_hc = axios.create({
            headers: this.headers,
            withCredentials: true,
          });

          va_hc.defaults.headers[
            "authorization"
          ] = `Bearer ${queryStringFromCache}`;

          const validate = await this.api.validate_query_id(
            va_hc,
            queryStringFromCache
          );

          if (validate) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 🔄 Getting data from cache...`
            );
            if (this.tg_client.connected) {
              await this.tg_client.disconnect();
              await this.tg_client.destroy();
            }
            await sleep(5);
            return queryStringFromCache;
          } else {
            tmp.deleteJsonElement(this.session_name);
          }
        }
      }
      await this.tg_client.connect();
      const platform = this.#get_platform(this.#get_user_agent());

      if (!this.bot) {
        this.bot = await this.tg_client.getInputEntity(app.bot);
      }

      await sleep(5);

      const result = await this.tg_client.invoke(
        new Api.messages.RequestWebView({
          peer: this.bot,
          bot: this.bot,
          platform,
          from_bot_menu: true,
          url: app.webviewUrl,
          startParam: "1167045062",
        })
      );

      const authUrl = result.url;
      const tgWebData = authUrl.split("#", 2)[1];
      logger.info(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | 💾 Storing data in cache...`
      );

      await sleep(5);

      tmp
        .addJson(
          this.session_name.replace(" ", "").trim(),
          decodeURIComponent(this.#clean_tg_web_data(tgWebData))
        )
        .save();

      return decodeURIComponent(this.#clean_tg_web_data(tgWebData));
    } catch (error) {
      if (error.message.includes("AUTH_KEY_DUPLICATED")) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | The same authorization key (session file) was used in more than one place simultaneously. You must delete your session file and create a new session`
        );
        return null;
      }
      const regex = /A wait of (\d+) seconds/;
      if (
        error.message.includes("FloodWaitError") ||
        error.message.match(regex)
      ) {
        const match = error.message.match(regex);

        if (match) {
          this.sleep_floodwait =
            new Date().getTime() / 1000 + parseInt(match[1], 10) + 10;
        } else {
          this.sleep_floodwait = new Date().getTime() / 1000 + 50;
        }
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${
            this.session_name
          } | Some flood error, waiting ${
            this.sleep_floodwait - new Date().getTime() / 1000
          } seconds to try again...`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error during Authorization: ${error}`
        );
      }
      return null;
    } finally {
      if (this.tg_client.connected) {
        await this.tg_client.disconnect();
        await this.tg_client.destroy();
      }
      this.runOnce = true;
      if (this.sleep_floodwait > new Date().getTime() / 1000) {
        await sleep(this.sleep_floodwait - new Date().getTime() / 1000);
        return await this.#get_tg_web_data();
      }
      await sleep(3);
    }
  }

  async #check_proxy(http_client, proxy) {
    try {
      const response = await http_client.get("https://httpbin.org/ip");
      const ip = response.data.origin;
      logger.info(
        `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Proxy IP: ${ip}`
      );
    } catch (error) {
      if (
        error.message.includes("ENOTFOUND") ||
        error.message.includes("getaddrinfo") ||
        error.message.includes("ECONNREFUSED")
      ) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error: Unable to resolve the proxy address. The proxy server at ${proxy.ip}:${proxy.port} could not be found. Please check the proxy address and your network connection.`
        );
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | No proxy will be used.`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Proxy: ${proxy.ip}:${proxy.port} | Error: ${error.message}`
        );
      }

      return false;
    }
  }

  async run(proxy) {
    let http_client;
    let access_token_created_time = 0;

    let user_data;
    let missions_data;
    const divider = Number(1000000000000000000n);

    if (settings.USE_PROXY_FROM_FILE && proxy) {
      http_client = axios.create({
        httpsAgent: this.#proxy_agent(proxy),
        headers: this.headers,
        withCredentials: true,
      });
      const proxy_result = await this.#check_proxy(http_client, proxy);
      if (!proxy_result) {
        http_client = axios.create({
          headers: this.headers,
          withCredentials: true,
        });
      }
    } else {
      http_client = axios.create({
        headers: this.headers,
        withCredentials: true,
      });
    }
    while (true) {
      try {
        const currentTime = _.floor(Date.now() / 1000);
        if (currentTime - access_token_created_time >= 3600) {
          const tg_web_data = await this.#get_tg_web_data();
          if (
            _.isNull(tg_web_data) ||
            _.isUndefined(tg_web_data) ||
            !tg_web_data ||
            _.isEmpty(tg_web_data)
          ) {
            continue;
          }

          http_client.defaults.headers[
            "authorization"
          ] = `Bearer ${tg_web_data}`;

          access_token_created_time = currentTime;
          await sleep(2);
        }

        user_data = await this.api.user_data(http_client);
        missions_data = await this.api.get_missions(http_client);

        if (
          _.isUndefined(user_data) ||
          _.isNull(user_data) ||
          _.isEmpty(user_data)
        ) {
          continue;
        }

        if (
          !user_data?.user?.walletAddress ||
          _.isNull(user_data?.user?.walletAddress) ||
          _.isUndefined(user_data?.user?.walletAddress)
        ) {
          // activate user here
          await this.api.create_wallet(http_client);
          await sleep(2);
          user_data = await this.api.user_data(http_client);
        }

        if (user_data?.user?.isIpSaved == false) {
          //save ip here
        }

        if (user_data?.user?.activated == false) {
          //create user wallet here
          await this.api.activate_account(http_client);
          await sleep(2);
          user_data = await this.api.user_data(http_client);
        }

        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${
            this.session_name
          } | Balance: <pi>${_.ceil(
            _.divide(user_data?.user?.balance, divider),
            4
          )}</pi>${
            user_data?.user?.earnedOffline > 0
              ? " | Offline Earnings: <la>" +
                _.ceil(_.divide(user_data?.user?.earnedOffline, divider), 4) +
                "</la>"
              : ""
          } | Earn Per Hour: <la>${_.ceil(
            _.divide(user_data?.user?.valuePerHour, divider),
            4
          )}</la>`
        );

        await sleep(2);

        if (!_.isEmpty(missions_data)) {
          const adsgrams = missions_data?.sponsors[0]?.find(
            (mission) => mission.resource?.toLowerCase() === "adsgram"
          );

          if (!_.isEmpty(adsgrams)) {
            if (
              moment(adsgrams?.nextTime).isSameOrBefore(moment()) ||
              _.isNull(adsgrams?.nextTime)
            ) {
              if (
                _.lt(adsgrams?.completion, adsgrams?.maxCompletion) ||
                _.isNull(adsgrams?.nextTime)
              ) {
                const check_adsgram = await this.api.check_adsgram(http_client);
                if (check_adsgram?.isSuccess == true) {
                  const sleep_adsgram = _.random(30, 60);
                  logger.info(
                    `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Watching ads for ${sleep_adsgram} seconds`
                  );
                  await sleep(sleep_adsgram);

                  const complete_adsgram = await this.api.complete_adsgram(
                    http_client
                  );

                  if (complete_adsgram?.isSuccess == true) {
                    logger.success(
                      `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Ads claimed successfully`
                    );
                  } else {
                    logger.warning(
                      `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Ads claim failed (${complete_adsgram?.msg})`
                    );
                  }
                }
              } else {
                logger.info(
                  `<ye>[${this.bot_name}]</ye> | ${this.session_name} | All Ads has been claimed`
                );
              }
            } else {
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${
                  this.session_name
                } | Next Ads will be available in ${moment(
                  adsgrams?.nextTime
                ).fromNow()}`
              );
            }
          }
        }

        await sleep(2);

        if (
          moment(user_data?.user?.dailyCode?.validDate).isBefore(
            moment(),
            "day"
          ) ||
          _.isNull(user_data?.user?.dailyCode?.validDate)
        ) {
          const get_codes = await this.api.get_codes(http_client);

          if (
            !_.isEmpty(get_codes) &&
            !_.isNull(get_codes?.vertusCodes) &&
            !_.isUndefined(get_codes?.vertusCodes) &&
            !_.isUndefined(get_codes?.vertusDate) &&
            moment(get_codes?.vertusDate).isSame(moment(), "day")
          ) {
            const claim_daily_code = await this.api.codes_validate(
              http_client,
              get_codes?.vertusCodes
            );

            if (
              !_.isEmpty(claim_daily_code) &&
              claim_daily_code?.message
                ?.toLowerCase()
                ?.includes("correct guess")
            ) {
              logger.info(
                `<ye>[${this.bot_name}]</ye> | ${
                  this.session_name
                } | Daily code claimed | Reward: <bl>${_.ceil(
                  _.divide(claim_daily_code?.added, divider),
                  5
                )}</bl> | Codes: <la>${
                  claim_daily_code?.code?.code
                }</la> | New balance: <pi>${_.ceil(
                  _.divide(claim_daily_code?.newBalance, divider),
                  5
                )}`
              );
            }
          }
        }

        await sleep(2);
        if (
          moment(user_data?.user?.dailyRewards?.lastRewardClaimed).isBefore(
            moment(),
            "day"
          ) ||
          _.isNull(user_data?.user?.dailyRewards?.lastRewardClaimed)
        ) {
          const claim_daily = await this.api.claim_daily_reward(http_client);

          if (!_.isEmpty(claim_daily) && claim_daily?.success == true) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${
                this.session_name
              } | Daily reward claimed | New balance: <pi>${_.ceil(
                _.divide(claim_daily?.balance, divider),
                5
              )}</pi> | Rewards: <la>${_.ceil(
                _.divide(claim_daily?.claimed, divider),
                5
              )}</la> | Consecutive Days: <bl>${
                claim_daily?.consecutiveDays
              }</bl>`
            );
          }
        }

        await sleep(2);
        const vertStorage = _.ceil(
          _.divide(user_data?.user?.vertStorage, divider),
          6
        );

        const storage = _.ceil(
          _.divide(user_data?.user?.abilities?.storage?.value, divider),
          4
        );

        if (_.gte(vertStorage, storage)) {
          const collect_coins = await this.api.collect_coins(http_client);
          if (
            !_.isEmpty(collect_coins) &&
            !_.isNull(collect_coins?.newBalance) &&
            !_.isUndefined(collect_coins?.newBalance)
          ) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${
                this.session_name
              } | Farming claimed | New balance: <pi>${_.ceil(
                _.divide(collect_coins?.newBalance, divider),
                5
              )}</pi>`
            );
          }
        }

        await sleep(2);
        //upgrades
        if (
          settings.AUTO_UPDATE_FARM &&
          !_.isNull(user_data?.user?.balance) &&
          !_.isUndefined(user_data?.user?.balance) &&
          !_.isUndefined(user_data?.user?.abilities?.farm?.priceToLevelUp) &&
          !_.isNull(user_data?.user?.abilities?.farm?.priceToLevelUp) &&
          _.gte(
            _.divide(user_data?.user?.balance, divider),
            user_data?.user?.abilities?.farm?.priceToLevelUp
          )
        ) {
          const result = await this.api.upgrades(http_client, "farm");

          if (!_.isEmpty(result) && result?.isSuccess == true) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚡️ Farm upgraded`
            );
          }
          user_data = await this.api.user_data(http_client);
        }

        await sleep(2);
        if (
          settings.AUTO_UPDATE_PIGGY_BANK &&
          !_.isNull(user_data?.user?.balance) &&
          !_.isUndefined(user_data?.user?.balance) &&
          !_.isNull(user_data?.user?.abilities?.storage?.priceToLevelUp) &&
          !_.isUndefined(user_data?.user?.abilities?.storage?.priceToLevelUp) &&
          _.gte(
            _.divide(user_data?.user?.balance, divider),
            user_data?.user?.abilities?.storage?.priceToLevelUp
          )
        ) {
          const result = await this.api.upgrades(http_client, "storage");
          if (!_.isEmpty(result) && result?.isSuccess == true) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚡️ Piggy bank upgraded`
            );
          }
          user_data = await this.api.user_data(http_client);
        }

        await sleep(2);
        if (
          settings.AUTO_UPDATE_SETTLEMENT &&
          !_.isNull(user_data?.user?.balance) &&
          !_.isEmpty(user_data?.user?.abilities?.population?.priceToLevelUp) &&
          _.gte(
            _.divide(user_data?.user?.balance, divider),
            user_data?.user?.abilities?.population?.priceToLevelUp
          )
        ) {
          const result = await this.api.upgrades(http_client, "population");
          if (!_.isEmpty(result) && result?.isSuccess == true) {
            logger.info(
              `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚡️ Settlement upgraded`
            );
          }
          user_data = await this.api.user_data(http_client);
        }
        //cards
        /* if (settings.AUTO_BUY_AND_UPDATE_CARDS) {
          const cards = await this.api.get_cards(http_client);

          if (!_.isEmpty(cards?.economyCards)) {
            await upgradeElements(
              cards?.economyCards,
              http_client,
              this.api,
              this.bot_name,
              this.session_name
            );
          }

          if (!_.isEmpty(cards?.scienceCards)) {
            await upgradeElements(
              cards?.scienceCards,
              http_client,
              this.api,
              this.bot_name,
              this.session_name
            );
          }

          if (!_.isEmpty(cards?.militaryCards)) {
            await upgradeElements(
              cards?.militaryCards,
              http_client,
              this.api,
              this.bot_name,
              this.session_name
            );
          }
        } */
      } catch (error) {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ❗️Unknown error: ${error}`
        );
      } finally {
        let ran_sleep;
        if (_isArray(settings.SLEEP_BETWEEN_REQUESTS)) {
          if (
            _.isInteger(settings.SLEEP_BETWEEN_REQUESTS[0]) &&
            _.isInteger(settings.SLEEP_BETWEEN_REQUESTS[1])
          ) {
            ran_sleep = _.random(
              settings.SLEEP_BETWEEN_REQUESTS[0],
              settings.SLEEP_BETWEEN_REQUESTS[1]
            );
          } else {
            ran_sleep = _.random(450, 800);
          }
        } else if (_.isInteger(settings.SLEEP_BETWEEN_REQUESTS)) {
          const ran_add = _.random(20, 50);
          ran_sleep = settings.SLEEP_BETWEEN_REQUESTS + ran_add;
        } else {
          ran_sleep = _.random(450, 800);
        }

        logger.info(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Sleeping for ${ran_sleep} seconds...`
        );
        await sleep(ran_sleep);
      }
    }
  }
}
module.exports = Tapper;
