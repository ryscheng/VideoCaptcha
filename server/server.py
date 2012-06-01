#!/usr/bin/env python
"""
 Websocket capable server for Video CAPTCHA system.
 Adapted from the tornado websocket chat demo.
"""

import os, sys, inspect, time, math
this_folder = os.path.abspath(os.path.split(inspect.getfile( inspect.currentframe() ))[0])
tornado_folder = os.path.join(this_folder, "tornado")
if tornado_folder not in sys.path:
  sys.path.insert(0, tornado_folder)

import base64
import logging
import tornado.escape
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket
import os.path
import urllib
import uuid

from tornado.options import define, options

default_port = 8080
if 'PORT' in os.environ:
  default_port = os.environ['PORT']
define("port", default=default_port, help="port", type=int)

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/captcha", FrameHandler),
            (r"/message", MessageHandler),
            (r"/verify", VerifyHandler),
        ]

        settings = dict(
            cookie_secret=base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes),
            template_path=os.path.join(os.path.dirname(__file__), ".."),
            static_path=os.path.join(os.path.dirname(__file__), ".."),
            xsrf_cookies=True,
            autoescape=None,
        )
        tornado.web.Application.__init__(self, handlers, **settings)

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("captcha.html")

class FrameHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("captcha.html")

class MessageHandler(tornado.websocket.WebSocketHandler):
    pairs = []
    singles = []
    
    def allow_draft76(self):
      # for iOS 5.0 Safari
      return True

    def open(self):
      self.partner = None
      MessageHandler.singles.append(self)
      self.find_partner()

    def find_partner(self):
      if self.partner != None:
        return
      for node in MessageHandler.singles:
        if node != self:
          self.partner = node
          node.partner = self
          MessageHandler.singles.remove(self)
          MessageHandler.singles.remove(node)
          MessageHandler.pairs.append(self)
          MessageHandler.pairs.append(node)
          self.write_message({"event":"Connected"})
          self.partner.write_message({"event":"Receiving"})
          break

    def on_close(self):
      if self.partner != None:
        MessageHandler.pairs.remove(self)
        MessageHandler.pairs.remove(self.partner)
        self.partner.partner = None
        MessageHandler.singles.append(self.partner)
        self.partner.write_message({"event":"Disconnected"})
      else:
        MessageHandler.singles.remove(self)

    def on_message(self, message):
      logging.info("got message %r", message)
      parsed = tornado.escape.json_decode(message)
      if "payload" in parsed and self.partner != None:
        #TODO(willscott): Check Message Safety.
        self.partner.write_message({"event":"msg", "payload":parsed["payload"]})

class VerifyHandler(tornado.web.RequestHandler):
  def get(self):
    self.render("captcha.html")

def main():
    tornado.options.parse_command_line()
    app = Application()
    app.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()
