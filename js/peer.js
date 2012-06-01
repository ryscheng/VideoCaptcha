var peer = {
  socket: null,
  subscribers: [],

  write: function(obj) {
    if (!this.socket || this.socket.readyState != 1) {
      return false;
    }
    return this.socket.send(JSON.stringify({"payload": obj}));
  },
  
  start: function() {
    var url = "ws://" + location.host + "/message";
    if (!window.WebSocket) {
      return false;
    }
    peer.socket = new WebSocket(url);
    var that = this;
    peer.socket.onmessage = function(event) {
      var msg = JSON.parse(event.data);
        for (var i = 0; i < that.subscribers.length; i++) {
          that.subscribers[i](msg);
        }
    }
    peer.socket.onopen = function() {
      peer.timer && window.clearInterval(peer.timer);
      console.log('connected to server');
      peer.socket.onclose = function() {
        console.log('disconnected from server');
        peer.timer = window.setInterval(peer.start, 1000);
      }
    }
	return true;
  }
};
