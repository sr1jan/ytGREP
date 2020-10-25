(function(){
  console.log('injected getTranscript!');

  async function getTranscript() {
    console.log('getTranscript ran!');

    let more = await document.getElementsByClassName('dropdown-trigger style-scope ytd-menu-renderer')[0].getElementsByClassName('style-scope ytd-menu-renderer')[0]
    await more.click();

    let pop = await document.getElementsByClassName('style-scope ytd-menu-service-item-renderer')[5]
    // no transcript
    if(pop === undefined){
        console.log('No transcript! [1]');
        window.postMessage({type: "CAPS", text: "No transcript available!", capsArr: []}, "*");
        return;
    };

    await pop.click();

    let close = document.getElementsByClassName('style-scope ytd-engagement-panel-title-header-renderer')[11].getElementsByClassName('style-scope yt-icon-button')[0]
    let capsNode = [];
    let c = 0;

    while(1){
      capsNode = await
      document.getElementsByClassName('cue-group style-scope ytd-transcript-body-renderer')
      if(capsNode.length > 0){
        capsNode = [...capsNode];
        break;
      }
      ++c;
      if(c > 10){
          await close.click();
          console.log('No transcript! [2]');
          window.postMessage({type: "CAPS", text: "No transcript available!", capsArr: []}, "*");
          return; // no transcript or very slow fetch
      }
      // sleep for 1 sec before trying again
      await new Promise(r => setTimeout(r, 1000));
    }
    await close.click();

    let capsArr = []
    for(i=0;i<capsNode.length; ++i){
       let vals = capsNode[i].innerText.trim().replace(/\s{2,}/g, '\n').split('\n')
       let t = vals[0].split(':')[0]*60 + parseInt(vals[0].split(':')[1])
       vals[0] = t; vals[1]=vals[1].toLowerCase();
       capsArr.push(vals)
    }

    console.log('Retrieved capsArray!');
    window.postMessage({type: "CAPS", text: "Transcript available!", capsArr: capsArr}, "*");
  }

  getTranscript();

  // document.addEventListener('readystatechange', event => {
  //   if (event.target.readyState === 'complete') {
  //     getTranscript();
  //   }
  // });

})();

