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
    this.socket = new WebSocket(url);
    var that = this;
    this.socket.onmessage = function(event) {
      var msg = JSON.parse(event.data);
        for (var i = 0; i < that.subscribers.length; i++) {
          that.subscribers[i](msg);
        }
    }
	return true;
  }
};
