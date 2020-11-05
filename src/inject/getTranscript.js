(function(){
  // console.log('injected getTranscript!');

  async function getTranscript() {
    // console.log('getTranscript ran!');

    // check if transcript available using cc button
    let ccbtn = document.getElementsByClassName('ytp-subtitles-button ytp-button')[0]
    if(ccbtn.style.display === "none"){
      window.postMessage({type: "CAPS", text: "No transcript available!", capsArr: []}, "*");
      return;
    }

    let dropDownArr = await document.getElementsByClassName('dropdown-trigger style-scope ytd-menu-renderer');
    let more, pop;
    for(i=0; i<dropDownArr.length; ++i){
      let menu = await dropDownArr[i].getElementsByClassName('style-scope ytd-menu-renderer')[0];
      if(menu !== undefined && menu.iconName_ === "more"){
        more = menu;

        // open dropdown
        await more.click();

        // console.log(i, more)

        // check if transcript present
        let popArr = await document.getElementsByClassName('style-scope ytd-menu-service-item-renderer')
        for(j=0; j<popArr.length; ++j){
          if(popArr[j]!== undefined && popArr[j].innerText === "Open transcript"){
            pop = popArr[j];
            break;
          }
        }

        // close dropdown
        await more.click();

        // transcript available
        if(pop !== undefined){
          break;
        }

      }
    }

    // no transcript
    if(pop === undefined){
      window.postMessage({type: "CAPS", text: "No transcript available!", capsArr: []}, "*");
      return;
    };

    await pop.click();

    let close = document.getElementsByClassName('style-scope ytd-engagement-panel-title-header-renderer')[11].getElementsByClassName('style-scope yt-icon-button')[0]
    let capsNode = [];
    let c = 0;

    while(1){
      capsNode = await document.getElementsByClassName('cue-group style-scope ytd-transcript-body-renderer')
      if(capsNode.length > 0){
        capsNode = [...capsNode];
        break;
      }
      ++c;
      if(c > 10){
        await close.click();
        window.postMessage({type: "CAPS", text: "No transcript available!", capsArr: []}, "*");
        return; // no transcript or very slow fetch
      }
      // sleep for 1 sec before trying again
      await new Promise(r => setTimeout(r, 1000));
    }
    await close.click();

    let capsArr = []
    for(i=0;i<capsNode.length; ++i){
     let vals = capsNode[i].innerText.trim().replace(/\s{2,}/g, '\n').split('\n') // trim whiteplace, divide by newline then split
     let t = vals[0].split(':')[0]*60 + parseInt(vals[0].split(':')[1]) // 10:10 -> 10mins * 60 + 10secs -> 610secs
     vals[0] = t;
     capsArr.push(vals)
    }

    // console.log('capsArr', capsArr.length);

    // console.log('Retrieved capsArray!');
    window.postMessage({type: "CAPS", text: "Transcript available!", capsArr: capsArr}, "*");
  }

  getTranscript();

  // document.addEventListener('readystatechange', event => {
  //   if (event.target.readyState === 'complete') {
  //     getTranscript();
  //   }
  // });

})();

