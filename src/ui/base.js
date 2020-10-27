let form = document.getElementById("searchForm");
let fieldSet = document.getElementById("formFieldSet");
let status = document.getElementById("status");
let loadTranscript = document.getElementById("load");
let capsArr = [];


// retreive transcript from local storage if available
new Promise(function(resolve, reject){
  chrome.tabs.query({active:true, currentWindow: true},
    function(tabs){
      chrome.tabs.get(tabs[0].id, function(tab){
        chrome.storage.local.get(null, function(items){
          let key = `${tab.title}`;
          try{
            let result = items[tab.id][key];
            if(result !== undefined)
              resolve(result);
            else
              reject(new Error("Transcript not available locally!"));
          }catch (e) {
            reject(new Error(e));
          }
        })
      })
  })
}).then(
  function(result){
    capsArr = result;
    disableLoadTranscript();
    activateForm();
  },
  function(error){
    console.log(error)
  }
);

// triggered on search
form.onsubmit = function() {
  let query = form["search"].value;
  if(query === ""){
    return false;
  }else{
    // search, setup controls
    ytGrep(query);
    return false;
  }
};

// triggered on load transcript
loadTranscript.onclick = function() {
  if(capsArr.length > 0) return;
  let script = chrome.runtime.getURL('inject/getTranscript.js');
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs){
    chrome.tabs.executeScript(tabs[0].id, {
      code: "document.body.appendChild(document.createElement('script')).src = " + `'${script}'`
    });
  });
}

// listening to content script
chrome.runtime.onMessage.addListener(
  function(request, sender, sendResponse) {
    if (request.status !== "")
      status.innerText = request.status;

    if (request.type === "CAPS"){
      if(request.capsArr.length > 0){
        disableLoadTranscript();
        activateForm();
        capsArr = request.capsArr;
        chrome.tabs.query({active:true, currentWindow: true}, function(tabs){
          chrome.tabs.get(tabs[0].id, function(tab){
            storeTranscriptLocal(capsArr, tab.id, tab.title);
          })
        })
      }else{
        console.log('No video transcript found!');
      }
    }

    // reponse to content script
    sendResponse({reply: "Thanks for the status update!"});
  });


// *********************
//       HELPERS
// *********************

function disableLoadTranscript() {
  loadTranscript.onclick = '';
  loadTranscript.style.opacity = 0.5;
  loadTranscript.style.cursor = "no-drop";
  loadTranscript.classList.remove("hover");
}

function activateForm(){
  let submit = document.getElementById("submit");
  let search = document.getElementById("search");
  fieldSet.disabled = "";
  search.style.cursor = "auto";
  submit.style.cursor = "pointer";
  submit.onmouseover = function(){
    submit.style.opacity = 0.8;
  }
  submit.onmouseout = function(){
    submit.style.opacity = 1;
  }
  status.innerText = "Transcript loaded!";
}

function storeTranscriptLocal(capsArr, tabID, tabTitle){
  let key = `${tabTitle}`;
  chrome.storage.local.set({[tabID]: {[key]: capsArr} }, function() {
    console.log('SAVED:', tabID, key);
  });
}

function sendTimeToPlayer(time){
  chrome.tabs.query({active:true, currentWindow: true}, function(tabs){
    chrome.tabs.sendMessage(tabs[0].id, {type: "PLAYER", action:"SEEK", time: time});
  })
}

function sendActionToPlayer(action){
  chrome.tabs.query({active:true, currentWindow: true}, function(tabs){
    chrome.tabs.sendMessage(tabs[0].id, {type: "PLAYER", action:action});
  })
}

function createControlsNode(data){
  let controls = document.getElementById("controls");
  controls.innerHTML = ""; // clear prev search

  let ctlbtns = document.createElement("div");
  let ctltxt = document.createElement("p");
  let prev = document.createElement("p");
  let next = document.createElement("p");
  let media = document.createElement("p");
  let ctlnum = document.createElement("p");

  ctlnum.id = "ctlnum";

  prev.id = "prev";
  prev.innerText = "prev";
  next.id = "next";
  next.innerText = "next";
  media.id = "media";
  media.innerText = "pause";
  ctlbtns.id = "ctlbtns"
  ctlbtns.append(prev, media, next);

  ctltxt.id = "ctltxt"

  document.body.style.height = "250px";
  controls.append(ctltxt, ctlbtns, ctlnum);
}

function makeCtlFunctional(data){
  let prev = document.getElementById("prev");
  let next = document.getElementById("next");
  let media = document.getElementById("media");
  let ctltxt = document.getElementById("ctltxt");
  let ctlnum = document.getElementById("ctlnum");

  let idx = 0;
  prev.addEventListener("click", function(){
    if(idx <= 0) return;
    --idx;
    ctltxt.innerText = data[idx][1];
    ctlnum.innerText = `${idx+1}/${data.length}`
    if(media.innerText === "play"){
      media.innerText = "pause";
    }
    sendTimeToPlayer(data[idx][0]);
  });
  next.addEventListener("click", function(){
    if(idx >= data.length - 1) return;
    ++idx;
    ctltxt.innerText = data[idx][1];
    ctlnum.innerText = `${idx+1}/${data.length}`
    if(media.innerText === "play"){
      media.innerText = "pause";
    }
    sendTimeToPlayer(data[idx][0]);
  });
  media.addEventListener("click", function(){
    if(media.innerText === "pause"){
      media.innerText = "play"; // set symbol to play
      sendActionToPlayer("PAUSE");
    }else{
      media.innerText = "pause"; // set symbol to pause
      sendActionToPlayer("PLAY");
    }
  });

  ctltxt.innerText = data[0][1];
  ctlnum.innerText = `${idx+1}/${data.length}`
  sendTimeToPlayer(data[idx][0]);
}

function ytGrep(query){
  let results = []
  query = query.toLowerCase();
  for(i=0; i<capsArr.length; ++i){
    if(new RegExp(`\\b${query}\\b`).test(capsArr[i][1].toLowerCase())) {
      results.push(capsArr[i]);
    }
  }

  if(results.length > 0){
    status.innerText = "Match found!";
    createControlsNode(results);
    makeCtlFunctional(results);
  }else{
    status.innerText = "No match found!"
    document.getElementById("controls").innerHTML = "";
    document.body.style.height = "190px";
  }
}

