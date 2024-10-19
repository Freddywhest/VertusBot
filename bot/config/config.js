const _isArray = require("../utils/_isArray");

require("dotenv").config();
const settings = {
  API_ID:
    process.env.API_ID && /^\d+$/.test(process.env.API_ID)
      ? parseInt(process.env.API_ID)
      : process.env.API_ID && !/^\d+$/.test(process.env.API_ID)
      ? "N/A"
      : undefined,
  API_HASH: process.env.API_HASH || "",

  BALANCE_TO_SAVE:
    process.env.BALANCE_TO_SAVE && /^\d+$/.test(process.env.BALANCE_TO_SAVE)
      ? parseInt(process.env.BALANCE_TO_SAVE)
      : 100000000000,

  SLEEP_BETWEEN_REQUESTS:
    process.env.SLEEP_BETWEEN_REQUESTS &&
    _isArray(process.env.SLEEP_BETWEEN_REQUESTS)
      ? JSON.parse(process.env.SLEEP_BETWEEN_REQUESTS)
      : process.env.SLEEP_BETWEEN_REQUESTS &&
        /^\d+$/.test(process.env.SLEEP_BETWEEN_REQUESTS)
      ? parseInt(process.env.SLEEP_BETWEEN_REQUESTS)
      : 150,

  AUTO_UPDATE_FARM: process.env.AUTO_UPDATE_FARM
    ? process.env.AUTO_UPDATE_FARM.toLowerCase() === "true"
    : true,

  AUTO_UPDATE_PIGGY_BANK: process.env.AUTO_UPDATE_PIGGY_BANK
    ? process.env.AUTO_UPDATE_PIGGY_BANK.toLowerCase() === "true"
    : true,

  AUTO_UPDATE_SETTLEMENT: process.env.AUTO_UPDATE_SETTLEMENT
    ? process.env.AUTO_UPDATE_SETTLEMENT.toLowerCase() === "true"
    : true,

  AUTO_BUY_AND_UPDATE_CARDS: process.env.AUTO_BUY_AND_UPDATE_CARDS
    ? process.env.AUTO_BUY_AND_UPDATE_CARDS.toLowerCase() === "true"
    : true,

  USE_PROXY_FROM_FILE: process.env.USE_PROXY_FROM_FILE
    ? process.env.USE_PROXY_FROM_FILE.toLowerCase() === "true"
    : false,

  USE_QUERY_ID: process.env.USE_QUERY_ID
    ? process.env.USE_QUERY_ID.toLowerCase() === "true"
    : false,

  CAN_CREATE_SESSION: false,
};

module.exports = settings;
