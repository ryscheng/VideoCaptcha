var CaptchaVideo = {
  video: null,
  el: null,
  init: function(stream) {
    if (!CaptchaVideo.video) {
      CaptchaVideo.video = stream;
    }
    if (!stream || !stream.stream) {
      return;
    }
    if (!CaptchaVideo.el || CaptchaVideo.el.tagName!="video") {
      CaptchaVideo.el = document.createElement("video");
      CaptchaVideo.el.autoplay = true;
      CaptchaVideo.el.src = webkitURL.createObjectURL(stream.stream);
      document.getElementById("captcha").innerHTML = "";
      document.getElementById("captcha").appendChild(CaptchaVideo.el);
    }
  },
  destroy: function(stream) {
    CaptchaVideo.video = null;
    if (CaptchaVideo.el) {
      document.getElementById("captcha").innerHTML = "Waiting for Peer";
    }
  }
};
