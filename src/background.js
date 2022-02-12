"use strict";

console.log("[YTGREP] BackgroundJS init");

// extension only active on youtube watch page
const default_rule = {
  id: "enable_action",
  conditions: [
    new chrome.declarativeContent.PageStateMatcher({
      pageUrl: {
        hostEquals: "www.youtube.com",
        schemes: ["https"],
        pathContains: "watch",
      },
    }),
  ],
  actions: [new chrome.declarativeContent.ShowAction()],
};

chrome.runtime.onInstalled.addListener(function () {
  console.log("ytGrep installed successfully!");
  chrome.action.disable();

  chrome.declarativeContent.onPageChanged.removeRules(undefined, function () {
    chrome.declarativeContent.onPageChanged.addRules([default_rule]);
  });
});

// setIcon when on youtube.com
chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
  if (message.type === "showPageAction") {
    console.log("[YTGREP::showPageAction] init");
    chrome.declarativeContent.onPageChanged.getRules(
      ["enable_action"],
      (rules) => {
        if (!rules[0]) {
          console.log("enable_action rule was not set, adding now.");
          chrome.declarativeContent.onPageChanged.removeRules(
            undefined,
            function () {
              chrome.declarativeContent.onPageChanged.addRules([default_rule]);
            }
          );
        }
      }
    );
    chrome.action.setIcon({
      tabId: sender.tab.id,
      path: {
        16: "./assets/icons/ytGrep16.png",
        24: "./assets/icons/ytGrep24.png",
      },
    });
  }
});

chrome.tabs.onRemoved.addListener(function (tabId) {
  try {
    chrome.storage.local.remove(tabId.toString(), function () {
      if (chrome.runtime.lastError === undefined) {
        console.log("Removed:", tabId);
      } else {
        console.log(chrome.runtime.lastError);
      }
    });
  } catch (e) {
    console.log(e);
  }
});
