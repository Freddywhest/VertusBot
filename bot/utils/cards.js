const _ = require("lodash");
const settings = require("../config/config");
const logger = require("./logger");
const sleep = require("./sleep");
const divider = Number(1000000000000000000n);
let user_data;
// Function to create a lookup map of elements by their _id
function createElementMap(elements) {
  return elements.reduce((acc, el) => {
    acc[el._id] = el;
    return acc;
  }, {});
}

// Function to check and upgrade prerequisites for a given element
async function handlePrerequisites(element, elementMap, http_client) {
  for (let prerequisiteId of element.prerequisites) {
    const prerequisite = elementMap[prerequisiteId];
    if (prerequisite && prerequisite.currentLevel === 0) {
      // Recursively upgrade the prerequisite
      await upgradeElement(prerequisite, elementMap, http_client);
    }
  }
}

async function fetchUserDataWithRetry(
  http_client,
  api,
  bot_name,
  session_name,
  retries = 3,
  delay = 2
) {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const user_data = await api.user_data(http_client);
      if (user_data && user_data?.user?.balance !== undefined) {
        return user_data;
      } else {
        throw new Error("User data is missing or balance is undefined");
      }
    } catch (error) {
      logger.warning(
        `<ye>[${bot_name}]</ye> | ${session_name} | Attempt ${
          attempt + 1
        }: Failed to fetch user_data - ${
          error.message
        }. Retrying in ${delay} seconds...`
      );
      attempt++;
      if (attempt < retries) {
        await sleep(_.random(delay, delay + 10)); // Wait before retrying
      }
    }
  }
  throw new Error("Failed to fetch user_data after multiple attempts");
}

// Function to upgrade an element if possible
async function upgradeElement(
  element,
  elementMap,
  http_client,
  api,
  bot_name,
  session_name
) {
  let user_data;

  try {
    user_data = await fetchUserDataWithRetry(
      http_client,
      api,
      bot_name,
      session_name
    );
  } catch (error) {
    logger.error(
      `<ye>[${bot_name}]</ye> | ${session_name} | ❗️Unknown error while upgrading cards: ${error.message}`
    );
    return; // Exit early if user_data cannot be fetched after retries
  }

  if (element.prerequisites.length > 0) {
    await handlePrerequisites(element, elementMap, http_client);
  }

  const card = element?.levels[element?.currentLevel];

  if (
    _.gte(user_data?.user?.balance, card?.cost) &&
    _.lt(_.divide(user_data?.user?.balance, divider), settings.BALANCE_TO_SAVE)
  ) {
    const result = await api.upgrade_card(http_client, element._id);
    if (result?.isSuccess == true) {
      logger.info(
        `<ye>[${bot_name}]</ye> | ${session_name} | ⚡️ Card upgraded: <la>${element.cardName}</la>`
      );
    }
  }
}

// Main function to initiate upgrades for all elements
async function upgradeElements(
  elements,
  http_client,
  api,
  bot_name,
  session_name
) {
  const elementMap = createElementMap(elements);

  for (let element of elements) {
    await sleep(5);
    if (element.isUpgradable) {
      await upgradeElement(
        element,
        elementMap,
        http_client,
        api,
        bot_name,
        session_name
      );
    }
  }
}

module.exports = upgradeElements;
