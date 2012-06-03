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
  var portal = document.createElement('iframe');
  portal.src = url + "captcha";
  portal.frameBorder = 0;
  portal.style.width = "300px";
  portal.style.position = "absolute";
  portal.addEventListener('load', function() {
    portal.contentWindow.postMessage({
      command: "set_containing_page", 
      uri: window.location.href,
    }, portal.src);
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
    } else if (evt.data.command == "set_height") {
      portal.style.height = evt.data.height; 
    } else {
      challenge.value = evt.data.challenge;
    }
  }
  window.addEventListener("message", onReceive, false);
  captcha_frame.appendChild(portal);
  captcha_frame.appendChild(challenge);
  captcha_frame.appendChild(response);
});

document.write('<div id="' + instanceId + '" style="display:inline-block;width:300px; height:150px;"></div>');
})();
