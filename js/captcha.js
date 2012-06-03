(function(){

var instanceId = "captcha" + Math.random();

window.addEventListener('load', function() {
  var captcha_frame = document.getElementById(instanceId);
  var script = captcha_frame.previousSibling;
  var settings = {
    challenge: "challenge",
    response: "response"
  };
  var url;
  try {
    url = script.src.substr(0, script.src.indexOf("captcha.js"));
    var settings = JSON.parse(script.innerText);
  } catch(e) {
    console.warn("Could not load settings");
  }
  captcha_frame.src = url + "captcha";
  captcha_frame.addEventListener('load', function() {
    captcha_frame.contentWindow.postMessage({
      command: "set_containing_page", 
      uri: window.location.href,
    }, captcha_frame.src);
  }, false);

  var challenge = document.createElement("input");
  challenge.type = "hidden";
  challenge.name = settings.challenge;
  var response = document.createElement("input");
  response.type = "hidden";
  response.name = settings.response;
  var onReceive = function(evt) {
    if (evt.data.command == "set_response") {
      response.value = evt.data.response;
    } else {
      challenge.value = evt.data.challenge;
    }
  }
  window.addEventListener("message", onReceive, false);
  captcha_frame.parentNode.appendChild(challenge);
  captcha_frame.parentNode.appendChild(response);
});


document.write('<iframe id="' + instanceId + '" height="300" width="500" frameborder="0"></iframe>');
})();
