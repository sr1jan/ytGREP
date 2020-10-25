// init
console.log('ytGREP extension loaded!');

// receive from webpage via window
// transmit to extension via runtime
window.addEventListener("message", function(event) {
  // We only accept messages from ourselves
  if (event.source != window)
    return;

  if (event.data.type && (event.data.type === "CAPS")) {
    console.log("Message from webpage: " + event.data.text);
    if(typeof chrome.app.isInstalled!=='undefined'){
      chrome.runtime.sendMessage({type: "CAPS", status: event.data.text, capsArr: event.data.capsArr}, function(response) {
        console.log('Message from extension:', response.reply);
      });
    }
  }

  if (event.data.type && (event.data.type === "GREP")) {
    console.log("Message from webpage: " + event.data.text);
    if(typeof chrome.app.isInstalled!=='undefined'){
      chrome.runtime.sendMessage({type: "GREP", status: event.data.text}, function(response) {
        console.log('Message from extension:', response.reply);
      });
    }
  }
}, false);

chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse){
    if(request.type === "LOCAL_TRANS"){
      console.log(request.message, request.data);
    }
  }
)


// inject getTranscript script into webpage
// let script = document.createElement('script');
// script.src = chrome.runtime.getURL('getTranscript.js');
// script.onload = function() {
//     this.remove();
// };
// (document.head || document.documentElement).appendChild(script);

