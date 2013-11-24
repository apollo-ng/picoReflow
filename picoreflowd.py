import threading,time,logging,json

import bottle
from gevent.pywsgi import WSGIServer
from geventwebsocket import WebSocketHandler, WebSocketError

from oven import Oven

log_format = '%(asctime)s %(levelname)s %(name)s: %(message)s'
logging.basicConfig(level = logging.DEBUG, format = log_format)
log = logging.getLogger("picoreflowd")

app = bottle.Bottle()
oven = Oven()
wsocks_control = []

class OvenWatcher(threading.Thread):
    def __init__(self,oven):
        self.watchers = []
        threading.Thread.__init__(self)
        self.daemon = True
        
        self.oven = oven
        self.start()

    def run(self):
        while True:
            oven_state = self.oven.get_state()
            self.notifyAll(oven_state)
            time.sleep(1)
    
    def notifyAll(self,message):
        message_json = json.dumps(message)
        log.debug("sending to %d clients: %s"%(len(self.watchers),message_json))
        for wsock in self.watchers:
            if wsock:
                try:
                    wsock.send(message_json)
                except:
                    log.error("could not write to socket %s"%wsock)
                    wsocks.remove(wsock)
            else:
                wsocks.remove(wsock)

ovenWatcher = OvenWatcher(oven)

@app.route('/')
def index():
    return bottle.redirect('/picoreflow/index.html')

@app.route('/picoreflow/:filename#.*#')
def send_static(filename):
    log.debug("serving %s"%filename)
    return bottle.static_file(filename, root='./public/')

@app.route('/run')
def start_oven():
    oven.run_profile("abc")

    return "Starting"

@app.route('/control')
def handle_control():
    env = bottle.request.environ;
    print env
    wsock = env.get('wsgi.websocket')
    if not wsock:
        abort(400, 'Expected WebSocket request.')

    wsocks_control.append(wsock)
    while True:
        try:
            message = wsock.receive()
            wsock.send("Your message was: %r" % message)
            if message == "start":
                log.info("Start command received")
                oven.run_profile("abc")
            elif message == "stop":
                log.info("Stop command received")
                oven.abort_run()
        except WebSocketError:
            break

@app.route('/status')
def handle_websocket():
    env = bottle.request.environ;
    print env
    wsock = env.get('wsgi.websocket')
    if not wsock:
        abort(400, 'Expected WebSocket request.')

    ovenWatcher.watchers.append(wsock)
    while True:
        try:
            message = wsock.receive()
            wsock.send("Your message was: %r" % message)
        except WebSocketError:
            break

def main():
    log.info("Starting picoreflowd")
    ip = "0.0.0.0"
    port = 8080
    log.info("listening to %s:%d"%(ip,port))
    
    server = WSGIServer((ip,port), app,
                    handler_class=WebSocketHandler)
    server.serve_forever()

if __name__ == "__main__":
    main()

