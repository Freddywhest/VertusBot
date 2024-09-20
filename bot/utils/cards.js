const _ = require("lodash");
const settings = require("../config/config");
const logger = require("./logger");
const sleep = require("./sleep");
const divider = Number(1000000000000000000n);
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

// Function to upgrade an element if possible
async function upgradeElement(
  element,
  elementMap,
  http_client,
  api,
  bot_name,
  session_name
) {
  const user_data = await api.user_data(http_client);

  if (!_.isEmpty(user_data) && !_.isNull(user_data?.user?.balance)) {
    if (element.prerequisites.length > 0) {
      // Handle prerequisites first
      await handlePrerequisites(element, elementMap, http_client);
    }
    const card = element?.levels[element?.currentLevel];
    // Upgrade the current element if its currentLevel is 0 and isUpgradable
    if (
      _.gte(user_data?.user?.balance, card?.cost) &&
      _.lt(
        _.divide(user_data?.user?.balance, divider),
        settings.BALANCE_TO_SAVE
      )
    ) {
      // Make the API request to upgrade the card
      const result = await api.upgrade_card(http_client, element._id);
      // If the API call is successful, update the element locally
      if (result?.isSuccess == true) {
        logger.info(
          `<ye>[${bot_name}]</ye> | ${session_name} | ⚡️ Card upgraded: <la>${element.cardName}</la>`
        );
      }
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
