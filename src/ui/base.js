console.log("[YTGREP] ytGrep base script init");

let form = document.getElementById("searchForm");
let fieldSet = document.getElementById("formFieldSet");
let status = document.getElementById("status");
let loader = document.getElementById("loader");
let loadTranscript = document.getElementById("load");
let capsArr = [];

// retreive transcript from local storage if available
new Promise(function (resolve, reject) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.get(tabs[0].id, function (tab) {
      chrome.storage.local.get(null, function (items) {
        console.log(items);
        let key = `${tab.title}`;
        try {
          let result = items[tab.id][key];
          if (result !== undefined) resolve(result);
          else reject(new Error("Transcript not available locally!"));
        } catch (e) {
          reject(new Error(e));
        }
      });
    });
  });
}).then(
  function (result) {
    capsArr = result;
    disableLoadTranscript();
    activateForm();
  },
  function (error) {
    console.log(error);
  }
);

// triggered on search
form.onsubmit = function () {
  let query = form["search"].value;
  if (query === "") {
    return false;
  } else {
    // search, setup controls
    ytGrep(query);
    return false;
  }
};

// triggered on load transcript
loadTranscript.onclick = async function () {
  status.style.display = "none";
  loader.style.display = "block";
  let script = chrome.runtime.getURL("inject/getTranscript.js");
  // function injectScript(src) {
  //   let script = document.createElement("script");
  //   script.src = src;
  //   script.id = "getTranscript";
  //   document.body.appendChild(script);
  // }
  const tab = await getCurrentTab();
  chrome.scripting.executeScript(
    {
      target: { tabId: tab.id },
      files: ["inject/getTranscript.js"],
    },
    () => {}
  );
};

// listening to content script
chrome.runtime.onMessage.addListener(async function (
  request,
  sender,
  sendResponse
) {
  if (request.status !== "") {
    loader.style.display = "none";
    status.style.display = "block";
    status.innerText = request.status;
  }

  if (request.type === "CAPS") {
    if (request.capsArr.length > 0) {
      disableLoadTranscript();
      activateForm();
      capsArr = request.capsArr;
      const tab = await getCurrentTab();
      chrome.tabs.get(tab.id, function (tab) {
        storeTranscriptLocal(capsArr, tab.id, tab.title);
      });
    } else {
      console.log("No video transcript found!");
    }
  }

  // reponse to content script
  sendResponse({ reply: "Thanks for the status update!" });
});

// *********************
//       HELPERS
// *********************

async function getCurrentTab() {
  let queryOptions = { active: true, currentWindow: true };
  let [tab] = await chrome.tabs.query(queryOptions);
  return tab;
}

function disableLoadTranscript() {
  loadTranscript.onclick = "";
  loadTranscript.style.opacity = 0.5;
  loadTranscript.style.cursor = "no-drop";
  loadTranscript.classList.remove("hover");
}

function activateForm() {
  let submit = document.getElementById("submit");
  let search = document.getElementById("search");
  fieldSet.disabled = "";
  search.style.cursor = "auto";
  submit.style.cursor = "pointer";
  submit.onmouseover = function () {
    submit.style.opacity = 0.8;
  };
  submit.onmouseout = function () {
    submit.style.opacity = 1;
  };
  status.innerText = "Transcript loaded!";
}

function storeTranscriptLocal(capsArr, tabID, tabTitle) {
  let key = `${tabTitle}`;
  chrome.storage.local.set({ [tabID]: { [key]: capsArr } }, function () {
    console.log("SAVED:", tabID, key);
  });
}

function sendTimeToPlayer(time) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, {
      type: "PLAYER",
      action: "SEEK",
      time: time,
    });
  });
}

function sendActionToPlayer(action) {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    chrome.tabs.sendMessage(tabs[0].id, { type: "PLAYER", action: action });
  });
}

function createControlsNode(data) {
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
  ctlbtns.id = "ctlbtns";
  ctlbtns.append(prev, media, next);

  ctltxt.id = "ctltxt";

  document.body.style.height = "265px";
  controls.append(ctltxt, ctlbtns, ctlnum);
}

function makeCtlFunctional(data) {
  let prev = document.getElementById("prev");
  let next = document.getElementById("next");
  let media = document.getElementById("media");
  let ctltxt = document.getElementById("ctltxt");
  let ctlnum = document.getElementById("ctlnum");

  let idx = 0;
  prev.addEventListener("click", function () {
    if (idx <= 0) return;
    --idx;
    ctltxt.innerHTML = data[idx][1];
    ctlnum.innerText = `${idx + 1}/${data.length}`;
    if (media.innerHTML === "play") {
      media.innerText = "pause";
    }
    sendTimeToPlayer(data[idx][0]);
  });
  next.addEventListener("click", function () {
    if (idx >= data.length - 1) return;
    ++idx;
    ctltxt.innerHTML = data[idx][1];
    ctlnum.innerText = `${idx + 1}/${data.length}`;
    if (media.innerText === "play") {
      media.innerText = "pause";
    }
    sendTimeToPlayer(data[idx][0]);
  });
  media.addEventListener("click", function () {
    if (media.innerText === "pause") {
      media.innerText = "play"; // set symbol to play
      sendActionToPlayer("PAUSE");
    } else {
      media.innerText = "pause"; // set symbol to pause
      sendActionToPlayer("PLAY");
    }
  });

  ctltxt.innerHTML = data[0][1];
  ctlnum.innerText = `${idx + 1}/${data.length}`;
  sendTimeToPlayer(data[idx][0]);
}

async function ytGrep(query) {
  let results = [];
  query = query.toLowerCase();
  let highlight = function (q) {
    return `<span style='color: #fff'>${q}</span>`;
  };
  for (i = 0; i < capsArr.length; ++i) {
    if (capsArr[i][1] === undefined) continue;
    if (new RegExp(`\\b${query}\\b`).test(capsArr[i][1].toLowerCase())) {
      let regEx = new RegExp(query, "ig"); //case insensitive
      capsArr[i][1] = capsArr[i][1].replace(regEx, highlight(query));
      results.push(capsArr[i]);
    }
  }

  if (results.length > 0) {
    status.innerText = "Match found!";
    createControlsNode(results);
    makeCtlFunctional(results);
  } else {
    status.innerText = "";
    await new Promise((r) => setTimeout(r, 200));
    status.innerText = "No match found!";
    document.getElementById("controls").innerHTML = "";
    document.body.style.height = "190px";
  }
}
