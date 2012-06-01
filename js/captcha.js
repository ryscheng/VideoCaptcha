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

var onMessage = function(msg) {
  if (msg.event == "Connected") {
    channel = new webkitPeerConnection00(
      'STUN stun.l.google.com:19302',
      function(candidate, more) {
        if (more==false) {
          console.log('no more candidates - sending offer.');
          peer.write({messageType:'OFFER', sdp:channel.localDescription.toSdp()});
        }
      });
    channel.onopen = function() {
      console.log('p on open');
    };
    channel.onaddstream = function(stream) {
      console.log('p on stream');
    };
    channel.onremovestream = function(stream) {
      console.log('p on remove stream');
    };
    
    getUserMedia(function(stream) {
      channel.addStream(stream);
      var newOffer;
      try {
        newOffer = channel.createOffer('audio,video');
      } catch (e) {
        newOffer = channel.createOffer({audio:true, video:true});
      }
      channel.setLocalDescription(channel.SDP_OFFER, newOffer);
      channel.startIce();
    });
  } else if (msg.event == "Disconnected") {
    channel = null;
  } else if (msg.event == "msg") {
    var payload = msg.payload;
    if (payload.messageType === 'OFFER') {
      console.log('got offer');
      var sdp = new SessionDescription(payload.sdp);
      channel.setRemoteDescription(channel.SDP_OFFER, sdp);
    } else if (payload.messageType === 'ANSWER') {
      console.log('got answer');
      var sdp = new SessionDescription(payload.sdp);
      channel.setRemoteDescripiton(channel.SDP_ANSWER, sdp);
    }
  }
  var el = document.getElementById('captcha');
};

window.addEventListener("message", receiveMessage, false);
window.addEventListener('load', function() {
  if (peer.start()) {
    peer.socket.onopen = function() {
      console.log("Connected to server.");
    };
    peer.socket.onerror = function() {
      showError("Failed to connect to server.");
    };

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
