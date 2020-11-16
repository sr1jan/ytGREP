'use strict';

// extension only active on youtube watch page
const default_rule = {
  id: "default_rule",
  conditions: [
    new chrome.declarativeContent.PageStateMatcher({
      pageUrl: {hostEquals: "www.youtube.com"},
      css: ["video"]
    })
  ],
  actions: [ new chrome.declarativeContent.ShowPageAction() ]
}

chrome.runtime.onInstalled.addListener(function(details) {
  console.log('ytGrep installed successfully!');

  chrome.declarativeContent.onPageChanged.removeRules(undefined, function() {
    chrome.declarativeContent.onPageChanged.addRules([default_rule]);
  });
});

// setIcon when on youtube.com
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse){
    if(message.type === "showPageAction"){
      chrome.pageAction.setIcon({
        tabId: sender.tab.id,
        path: {"16": "./assets/icons/ytGrep16.png", "24": "./assets/icons/ytGrep24.png"}
      });
    }
});

chrome.tabs.onRemoved.addListener(function(tabId) {
  try {
    chrome.storage.local.remove(tabId.toString(), function(){
      if(chrome.runtime.lastError === undefined){
        console.log("Removed:", tabId);
      }else{
        console.log(chrome.runtime.lastError);
      }
    });
  } catch (e){
    console.log(e);
  }
});

