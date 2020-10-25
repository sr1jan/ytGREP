let form = document.getElementById("searchForm");
let fieldSet = document.getElementById("formFieldSet");
let status = document.getElementById("status");
let loadTranscript = document.getElementById("load");
let capsArr = [];

chrome.storage.local.get(null, function(items){
  console.log(items);
})

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
    console.log(result.length);
    capsArr = result;
    disableLoadTranscript();
    activateForm();
    chrome.runtime.sendMessage({type: "LOCAL_TRANS", message: "Got transcript from local storage", data: capsArr});
  },
  function(error){
    console.log(error)
  }
);

// function ytGrep(query){
//   let ok = false;
//   let t = 0;
//   for(i=0; i<capsArr.length; ++i){
//     if(capsArr[i][1].includes(query.toLowerCase())) {
//        ok = true;
//        t=capsArr[i][0];
//        break;
//     }
//   }
//   if(ok){
//     player.seekTo(t);
//     player.playVideo();
//   }else{
//     window.postMessage({type: "GREP", text: "No match found!"}, "*");
//   }
//   return;
// }

function injectScript(params) {
  const code = '(' + function(query) {
    let player = document.getElementById('movie_player');
    let capsNode = document.getElementsByClassName('cue-group style-scope ytd-transcript-body-renderer')

    let capsArr = []
    for(i=0;i<capsNode.length; ++i){
       let vals = capsNode[i].innerText.trim().replace(/\s{2,}/g, '\n').split('\n')
       let t = vals[0].split(':')[0]*60 + parseInt(vals[0].split(':')[1])
       vals[0] = t; vals[1]=vals[1].toLowerCase();
       capsArr.push(vals)
    }

    if(!capsArr.length){
      window.postMessage({type: "FROM_PAGE", text: "No transcript available!"}, "*");
      return;
    }

    let ok = false;
    let t = 0;
    for(i=0; i<capsArr.length; ++i){
        if(capsArr[i][1].includes(query.toLowerCase())) {
           ok = true;
           t=capsArr[i][0];
           break;
        }
    }
    if(ok){
        player.seekTo(t);
        player.playVideo();
    }else{
        window.postMessage({type: "FROM_PAGE", text: "No match found!"}, "*");
    }
    return;
  } + ')(' + JSON.stringify(params.query) + ')';

  // inject script to shared DOM
  const script = document.createElement('script');
  script.textContent = code;
  (document.head || document.documentElement).appendChild(script);
  script.remove();
}

// triggered on search
form.onsubmit = function() {
  let query = form["search"].value;
  if(query === ""){
    return;
  }else{
    // chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    //   chrome.tabs.executeScript(
    //     tabs[0].id,
    //     {code: `(${injectScript})(${JSON.stringify({query: query}) })`},
    //     // function (result) {
    //     //   // console.log(result);
    //     // }
    //   );
    // });
  }
};

// triggered on load transcript
loadTranscript.onclick = function() {
  if(capsArr.length > 0) return;
  let script = chrome.runtime.getURL('getTranscript.js');
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
        console.log('Got video transcript!');
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

