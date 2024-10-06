const app = require("../config/app");
const logger = require("../utils/logger");
var _ = require("lodash");

class ApiRequest {
  constructor(session_name, bot_name) {
    this.session_name = session_name;
    this.bot_name = bot_name;
  }

  async user_data(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/users/get-data`,
        JSON.stringify({})
      );
      return response?.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status < 600) {
        return null;
      }

      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while getting user data: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while getting user data: ${error.message}`
        );
      }

      return null;
    }
  }

  async validate_query_id(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/users/get-data`,
        JSON.stringify({})
      );

      if (response?.data?.isValid == false) {
        return false;
      }
      return true;
    } catch (error) {
      if (_.isEmpty(error?.response?.data) || error?.response?.status == 500) {
        return false;
      }

      throw error;
    }
  }

  async create_wallet(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/users/create-wallet`,
        JSON.stringify({})
      );
      return response.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status < 600) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>creating wallet:</b>: ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>creating wallet:</b>: ${error.message}`
        );
      }

      return null;
    }
  }

  async activate_account(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/game-service/collect-first`,
        JSON.stringify({})
      );
      return response.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status < 600) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>activating account:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>activating account:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async collect_coins(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/game-service/collect`,
        JSON.stringify({})
      );
      return response.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status < 600) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>collecting coins:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>collecting coins:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async claim_daily_reward(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/users/claim-daily`,
        JSON.stringify({})
      );
      return response.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status < 600) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>claiming daily reward:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>claiming daily reward:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async get_cards(http_client) {
    try {
      const response = await http_client.get(`${app.apiUrl}/upgrade-cards`);
      return response.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status < 600) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>getting cards:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting cards:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async get_missions(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/missions/get`,
        JSON.stringify({ isPremium: false, languageCode: "en" })
      );
      return response.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status < 600) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>getting missions:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting missions:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async check_adsgram(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/missions/check-adsgram`,
        JSON.stringify({})
      );
      return response.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status < 600) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>checking adsgram:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>checking adsgram:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async complete_adsgram(http_client) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/missions/complete-adsgram`,
        JSON.stringify({})
      );
      return response.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status < 600) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>complete adsgram:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>complete adsgram:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async get_codes(http_client) {
    try {
      const response = await http_client.get(app.comboUrl);
      return response.data;
    } catch (error) {
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>getting codes:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>getting codes:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async upgrade_card(http_client, cardId) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/upgrade-cards/upgrade`,
        JSON.stringify({ cardId })
      );
      return response.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status < 600) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>upgrading card:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>upgrading card:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async upgrades(http_client, upgrade) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/users/upgrade`,
        JSON.stringify({ upgrade })
      );
      return response.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status < 600) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>upgrading:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>upgrading:</b> ${error.message}`
        );
      }

      return null;
    }
  }

  async codes_validate(http_client, code) {
    try {
      const response = await http_client.post(
        `${app.apiUrl}/codes/validate`,
        JSON.stringify({ code })
      );
      return response.data;
    } catch (error) {
      if (error?.response?.status >= 500 && error?.response?.status < 600) {
        return null;
      }
      if (error?.response?.data?.message) {
        logger.warning(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | ⚠️ Error while <b>validating codes:</b> ${error?.response?.data?.message}`
        );
      } else {
        logger.error(
          `<ye>[${this.bot_name}]</ye> | ${this.session_name} | Error while <b>validating codes:</b> ${error.message}`
        );
      }

      return null;
    }
  }
}

module.exports = ApiRequest;
