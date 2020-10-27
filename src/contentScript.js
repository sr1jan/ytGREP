// init
console.log('ytGREP extension loaded!');

// receive from webpage via window
// transmit to extension via runtime
window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.type && (event.data.type === "CAPS")) {
    // console.log("Message from webpage: " + event.data.text);
    if(typeof chrome.app.isInstalled!=='undefined'){
      chrome.runtime.sendMessage({type: "CAPS", status: event.data.text, capsArr: event.data.capsArr}, function(response) {
        // console.log('Message from extension:', response.reply);
      });
    }
  }
}, false);

// listening to extension
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse){
    if(request.type === "PLAYER" && request.action === "SEEK"){
      window.postMessage({type: "PLAYER", action: "SEEK",time: request.time}, "*");
    }

    if(request.type === "PLAYER" && request.action === "PLAY"){
      window.postMessage({type: "PLAYER", action: "PLAY"}, "*");
    }

    if(request.type === "PLAYER" && request.action === "PAUSE"){
      window.postMessage({type: "PLAYER", action: "PAUSE"}, "*");
    }
  }
)


// inject ytPlayer into the webpage
let script = document.createElement('script');
script.src = chrome.runtime.getURL('inject/ytPlayer.js');
script.onload = function() {
    this.remove();
};
(document.head || document.documentElement).appendChild(script);

