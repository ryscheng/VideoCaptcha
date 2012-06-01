(function() {

var outerPage=undefined;

var showError = function(msg) {
  var el = document.createElement('pre');
  el.innerHTML = msg;
  document.getElementsByClassName('body')[0].innerHTML = el.outerHTML;
}

window.addEventListener("message", receiveMessage, false);
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
  //Set the response forwarder
  var respField = document.getElementById("videocaptcha_response_field");
  respField.addEventListener("keyup", forwardResponseEvt);
}, false);

function receiveMessage(evt) {
  if (evt.data.command == "set_containing_page") {
    outerPage = evt.data.uri;
    console.log("Setting outer page to "+outerPage);
  }
}

function forwardResponseEvt(evt) {
  var respField = document.getElementById("videocaptcha_response_field");
  if (outerPage) {
    top.postMessage({command: "set_response", response: respField.value}, outerPage);
  }
}

})();
