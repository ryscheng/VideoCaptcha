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
        self.render("demo.html")

class FrameHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("captcha.html")

class MessageHandler(tornado.websocket.WebSocketHandler):
    waiters = dict()
    hashes = dict()

    
    def allow_draft76(self):
        # for iOS 5.0 Safari
        return True

    def open(self):
      self.id = 0
      self.hashes = []

    def on_close(self):
        if self.id:
          del MessageHandler.waiters[self.id]
          MessageHandler.send_updates({"from": 0, "id": self.id, "event": "disconnect"});
          for key in self.hashes:
            MessageHandler.hashes[key].remove(self.id)


    @classmethod
    def send_updates(cls, chat):
        logging.info("sending message to %d waiters", len(cls.waiters))
        for waiter in cls.waiters.values():
            try:
                waiter.write_message(chat)
            except:
                logging.error("Error sending message", exc_info=True)

    def on_message(self, message):
        logging.info("got message %r", message)
        parsed = tornado.escape.json_decode(message)
        if "payload" in parsed:
          if "event" in parsed["payload"] and parsed["payload"]["event"]=="register":
            # registration.
            if self.id == 0:
              self.id = str(uuid.uuid4())
              MessageHandler.waiters[self.id] = self
              self.write_message({"id":self.id, "from":0, "event": "register"})
            else:
              self.write_message({"id":self.id, "from":0, "event": "register"})
          elif "event" in parsed["payload"] and parsed["payload"]["event"] == "announce":
            # handle announces.
            # todo: rate limiting.
            if self.id != 0:
              parsed["payload"]["from"] = self.id
              MessageHandler.send_updates(parsed["payload"])
          elif "event" in parsed["payload"] and parsed["payload"]["event"] == "get":
            if self.id != 0 and "key" in parsed["payload"]:
              key = parsed["payload"]["key"]
              if key in MessageHandler.hashes:
                self.write_message({"from":0, "event":"list", "key":key, "ids":MessageHandler.hashes[key]})
              else:
                self.write_message({"from":0, "event":"list", "key":key, "ids":[]})
          elif "event" in parsed["payload"] and parsed["payload"]["event"] == "set":
            if self.id != 0 and "key" in parsed["payload"]:
              key = parsed["payload"]["key"]
              self.hashes.append(key)
              if key in MessageHandler.hashes:
                MessageHandler.hashes[key].append(self.id)
              else:
                MessageHandler.hashes[key] = [self.id]
          else:
            # direct message.
            recip_id = parsed["payload"]["to"]
            if recip_id in MessageHandler.waiters and self.id != 0:
              parsed["payload"]["from"] = self.id
              MessageHandler.waiters[recip_id].write_message(parsed["payload"])


def main():
    tornado.options.parse_command_line()
    app = Application()
    app.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()
