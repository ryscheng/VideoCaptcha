(function(){

window.addEventListener("message", receiveMessage, false);
window.addEventListener('load', function() {
  var captcha_frame = document.getElementById("captcha_frame");
  captcha_frame.contentWindow.postMessage({
    command: "set_containing_page", 
    uri: window.location.href,
  }, captcha_frame.src);
});

function receiveMessage(evt) {
  if (evt.data.command == "set_response") {
    var respField = document.getElementById("videocaptcha_response_field");
    respField.value = evt.data.response;
  }
}

})();
