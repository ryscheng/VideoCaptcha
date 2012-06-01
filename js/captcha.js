(function() {

var showError = function(msg) {
  var el = document.createElement('pre');
  el.innerHTML = msg;
  document.getElementsByClassName('body')[0].innerHTML = el.outerHTML;
}

window.addEventListener('load', function() {
  if (peer.start()) {
    peer.socket.onopen = function() {
      console.log("Connected to server.");
    };

    peer.subscribers.push(function(msg) {
      console.log("Server Message received: " + JSON.stringify(msg));
    });
  } else {
    showError("Your browser doesn't support WebSockets.");
  }
}, false);

})();