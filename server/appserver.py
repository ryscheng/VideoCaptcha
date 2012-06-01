#!/usr/bin/env python
"""
  Serves a demo app that uses the VideoCaptcha system
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
import tornado.httpclient
import os.path
import urllib
import uuid

from tornado.options import define, options

default_port = 8080
verify_url = "http://localhost:8081/verify"
if 'PORT' in os.environ:
  default_port = os.environ['PORT']
define("port", default=default_port, help="port", type=int)

class Application(tornado.web.Application):
    def __init__(self):
        handlers = [
            (r"/", MainHandler),
            (r"/form", FormHandler),
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

class FormHandler(tornado.web.RequestHandler):
  def get(self):
    self.write('<html><body>What do you want?</body></html>')

  def post(self):
    logging.info(self.request.arguments)
    challenge = self.get_argument("videocaptcha_challenge", None)
    response = self.get_argument("videocaptcha_response", None)
    clientip = self.request.remote_ip
    if (challenge and response):
      http_client = tornado.httpclient.HTTPClient()
      try:
        response = http_client.fetch(verify_url+"?challenge="+challenge+"&response="+response+"&remoteip="+clientip)
        self.write('<html><body>'+str(response.body)+'</body></html>')
      except tornado.httpclient.HTTPError, e:
        logging.error("Error: "+str(e))
        self.write("Error verifying")
    else:
      self.write('Missing either challenge or response')

def main():
    tornado.options.parse_command_line()
    app = Application()
    app.listen(options.port)
    tornado.ioloop.IOLoop.instance().start()

if __name__ == "__main__":
    main()
