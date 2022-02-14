(function () {
  // console.log("injected getTranscript!");

  async function getTranscript() {
    // console.log("getTranscript ran!");

    // check if transcript available using cc button
    let ccbtn = document.getElementsByClassName(
      "ytp-subtitles-button ytp-button"
    )[0];
    if (ccbtn.title.includes("unavailable")) {
      // console.log("[getTranscript] CC is not available!");
      window.postMessage(
        { type: "CAPS", text: "No transcript available!", capsArr: [] },
        "*"
      );
      return;
    }

    // console.log("[getTranscript] CC is available!");

    let more = document.querySelector(
      "div.style-scope.ytd-video-primary-info-renderer [id='menu'] .dropdown-trigger.style-scope.ytd-menu-renderer .style-scope.yt-icon-button"
    );

    // open dropdown
    await more.click();

    // check if transcript present
    let popArr = await document.getElementsByClassName(
      "style-scope ytd-menu-service-item-renderer"
    );

    // console.log(`[getTranscript] - Checking if transcript available`);
    let pop;
    for (j = 0; j < popArr.length; ++j) {
      if (
        popArr[j] !== undefined &&
        popArr[j].innerText.includes("Open transcript")
      ) {
        pop = popArr[j];
        // console.log(`[getTranscript] - Transcript found!`);
        break;
      }
    }

    // close dropdown
    await more.click();

    // no transcript
    if (pop === undefined) {
      window.postMessage(
        { type: "CAPS", text: "No transcript available!", capsArr: [] },
        "*"
      );
      return;
    }

    await pop.click();

    // transcript close button
    let close = document.querySelector(
      '#button [aria-label="Close transcript"]'
    );

    let capsNode = [];
    let c = 0;
    while (1) {
      capsNode = await document.getElementsByClassName(
        "cue-group style-scope ytd-transcript-body-renderer"
      );

      // transcript loaded
      if (capsNode.length > 0) {
        capsNode = [...capsNode];
        break;
      }

      ++c;
      if (c > 10) {
        await close.click();
        window.postMessage(
          { type: "CAPS", text: "No transcript available!", capsArr: [] },
          "*"
        );
        return; // no transcript or very slow fetch
      }

      // sleep for 1 sec before trying again
      await new Promise((r) => setTimeout(r, 1000));
    }

    // close transcript
    await close.click();

    let capsArr = [];
    for (i = 0; i < capsNode.length; ++i) {
      let vals = capsNode[i].innerText
        .trim()
        .replace(/\s{2,}/g, "\n")
        .split("\n"); // trim whiteplace, divide by newline then split
      let t = vals[0].split(":")[0] * 60 + parseInt(vals[0].split(":")[1]); // 10:10 -> 10mins * 60 + 10secs -> 610secs
      vals[0] = t;
      capsArr.push(vals);
    }

    // console.log("capsArr", capsArr.length);

    // console.log('Retrieved capsArray!');
    window.postMessage(
      { type: "CAPS", text: "Transcript available!", capsArr: capsArr },
      "*"
    );
  }

  getTranscript();

  // document.addEventListener('readystatechange', event => {
  //   if (event.target.readyState === 'complete') {
  //     getTranscript();
  //   }
  // });
})();
