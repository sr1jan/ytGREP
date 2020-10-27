(function(){
  // let player = document.getElementById('movie_player');

  window.addEventListener("message", function(event){
    if(event.source != window) return;

    if (event.data.type && (event.data.type === "PLAYER") && (event.data.action === "PAUSE")) {
      // player.pauseVideo();
      document.getElementById('movie_player').pauseVideo();
    }

    if (event.data.type && (event.data.type === "PLAYER") && (event.data.action === "PLAY")) {
      // player.playVideo();
      document.getElementById('movie_player').playVideo();
    }

    if (event.data.type && (event.data.type === "PLAYER") && (event.data.action === "SEEK")) {
      // player.seekTo(event.data.time);
      // player.playVideo();
      document.getElementById('movie_player').seekTo(event.data.time);
      document.getElementById('movie_player').playVideo();
    }
  })
})();
