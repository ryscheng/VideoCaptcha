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
import random
import time
import tornado.escape
import tornado.ioloop
import tornado.options
import tornado.web
import tornado.websocket
import os.path
import urllib
import uuid

from tornado.options import define, options

default_port = 8081
if 'PORT' in os.environ:
  default_port = os.environ['PORT']
define("port", default=default_port, help="port", type=int)
define("words", default="/usr/share/dict/words", help="word list", type=str)


class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
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

class FrameHandler(tornado.web.RequestHandler):
    def get(self):
        self.render("captcha.html")

class Challenges:
  active = dict()
  words = None

  def getWord(self):
    if self.words == None:
      with open(options.words,'r') as f:
        self.words = f.readlines()
    return random.choice(self.words)    
  
  def makePair(self):
    id_a = base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes)
    id_b = base64.b64encode(uuid.uuid4().bytes + uuid.uuid4().bytes)
    word_a = self.getWord()
    word_b = self.getWord()
    self.active[id_a] = {"word":word_a, "time":time.time()}
    self.active[id_b] = {"word":word_b, "time":time.time()}
    return [[id_a, word_b], [id_b, word_a]]

  def have(self, challenge, word):
    if challenge in self.active and self.active[challenge]["word"] == word:
      return 1
    return 0

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
          tokens = MessageHandler.challenges.makePair()
          self.write_message({"event":"Connected","token":tokens[0]})
          self.partner.write_message({"event":"Receiving","token":tokens[1]})
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
    challenge = self.get_argument("challenge")
    response = self.get_argument("response")
    clientip = self.get_argument("remoteip")
    self.write(challenge+":"+response+":"+clientip)

def main():
    tornado.options.parse_command_line()
    MessageHandler.challenges = Challenges()
    app = Application()
    app.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()


if __name__ == "__main__":
    main()
