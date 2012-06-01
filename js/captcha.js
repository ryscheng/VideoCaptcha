(function() {

var outerPage=undefined;

var showError = function(msg) {
  var el = document.createElement('pre');
  el.innerHTML = msg;
  document.getElementsByClassName('body')[0].innerHTML = el.outerHTML;
};

var getFailure = function(stream) {
  console.log("No stream for you!");
  showError("Did not get stream");
}

var getUserMedia = function(success) {
  try {
    // Old style
    navigator.webkitGetUserMedia("video,audio", success, getFailure);
    console.log("Requested access to local media.");
  } catch (e) {
    try {
      navigator.webkitGetUserMedia({video:true, audio:true},
                                   success, getFailure);
    } catch (e) {
      console.log("getUserMedia error: " + e);
    }
  }
}

var channel = null;
var haveOffer = 0;

var onMessage = function(msg) {
  if (msg.event == "Connected" || msg.event == "Receiving") {
    var token = msg.token;
    channel = new webkitPeerConnection00(
      'STUN stun.l.google.com:19302',
      function(candidate, more) {
        if (more==false) {
          if (haveOffer == 1) {
            haveOffer = 2;
            console.log('finished ice - sending answer.');
            peer.write({messageType:'ANSWER', sdp:channel.localDescription.toSdp()});                        
          } else if (haveOffer == 0) {
            haveOffer = 2;
            console.log('finished ice - sending offer.');
            peer.write({messageType:'OFFER', sdp:channel.localDescription.toSdp()});
          }
        }
      });
    channel.onaddstream = CaptchaVideo.init;
    channel.onremovestream = CaptchaVideo.destroy;
    
    var cb;
    if ( msg.event == "Receiving") {
      cb = function(stream) {
        channel.addStream(stream);
      };
    } else {
      cb = function(stream) {
        channel.addStream(stream);
        var newOffer;
        try {
          newOffer = channel.createOffer('audio,video');
        } catch (e) {
          newOffer = channel.createOffer({audio:true, video:true});
        }
        channel.setLocalDescription(channel.SDP_OFFER, newOffer);
        channel.startIce();
      };
    }
    getUserMedia(cb);
  } else if (msg.event == "Disconnected") {
    channel = null;
    CaptchaVideo.destroy(null);
  } else if (msg.event == "msg") {
    var payload = msg.payload;
    if (payload.messageType === 'OFFER') {
      console.log('got offer');
      var sdp = new SessionDescription(payload.sdp);
      channel.setRemoteDescription(channel.SDP_OFFER, sdp);
      haveOffer = true;
      var newAnswer;
      try {
        newAnswer = channel.createAnswer(payload.sdp, 'audio,video');
      } catch (e) {
        newAnswer = channel.createAnswer(payload.sdp, {audio:true, video:true});
      }
      channel.setLocalDescription(channel.SDP_ANSWER, newAnswer);
      channel.startIce();
    } else if (payload.messageType === 'ANSWER') {
      console.log('got answer');
      var sdp = new SessionDescription(payload.sdp);
      channel.setRemoteDescription(channel.SDP_ANSWER, sdp);
    }
  }
  var el = document.getElementById('captcha');
};

window.addEventListener("message", receiveMessage, false);
window.addEventListener('load', function() {
  if(peer.start()) {
    peer.subscribers.push(function(msg) {
      console.log("Server Message received: " + JSON.stringify(msg));
    });
    peer.subscribers.push(onMessage);
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
