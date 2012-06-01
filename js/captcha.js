(function() {

var showError = function(msg) {
  var el = document.createElement('pre');
  el.innerHTML = msg;
  document.getElementsByClassName('body')[0].innerHTML = el.outerHTML;
};

var channel = null;

var onMessage = function(msg) {
  if (!channel) {
    channel = new webkitPeerConnection00(
      'STUN stun.l.google.com:19302',
      function(candidate, more) {
        if (more==false) {
          console.log('no more candidates - sending offer.');
          peer.write({messageType:'OFFER', sdp:channel.localDescription.toSdp()});
        }
      });
    channel.onopen = function() {
      var newOffer;
      try {
        newOffer = channel.createOffer('audio,video');
      } catch (e) {
        newOffer = channel.createOffer({audio:true, video:true});
      }
      channel.setLocalDescription(channel.SDP_OFFER, newOffer);
      channel.startIce();
    };
    channel.onaddstream = function(stream) {
      console.log('p on stream');
    };
    channel.onremovestream = function(stream) {
      console.log('p on remove stream');
    };
  }
  if (msg.messageType === 'OFFER') {
    var sdp = new SessionDescription(msg.sdp);
    channel.setRemoteDescription(channel.SDP_OFFER, sdp);
  } else if (msg.messageType === 'ANSWER') {
    var sdp = new SessionDescription(msg.sdp);
    channel.setRemoteDescripiton(channel.SDP_ANSWER, sdp);
  }
  var el = document.getElementById('captcha');
};

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
}, false);

})();