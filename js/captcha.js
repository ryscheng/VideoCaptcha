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
  } else {
    var challField = document.getElementById("videocaptcha_challenge_field");
    challField.value = evt.data.challenge;
  }
}

document.write('<iframe id="captcha_frame" src="http://localhost:8081/captcha" height="300" width="500" frameborder="0"></iframe><br>');
document.write('<input type="hidden" name="videocaptcha_challenge" id="videocaptcha_challenge_field" />');
document.write('<input type="hidden" name="videocaptcha_response" id="videocaptcha_response_field"/>');
})();
