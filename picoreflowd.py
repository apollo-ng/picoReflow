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
oven.start()
wsocks = []
wsocks_control = []

def notifyAll(message):
    message_json = json.dumps(message)
    log.debug("sending to %d clients: %s"%(len(wsocks),message_json))
    for wsock in wsocks:
        if wsock:
            try:
                wsock.send(message_json)
            except:
                log.error("could not write to socket %s"%wsock)
                wsocks.remove(wsock)
        else:
            wsocks.remove(wsock)

class OvenWatcher(threading.Thread):
    def __init__(self,oven):
        threading.Thread.__init__(self)
        self.daemon = True
        
        self.oven = oven

    def run(self):
        while True:
            oven_state = self.oven.get_state()
            notifyAll(oven_state)
            time.sleep(1)

ovenWatcher = OvenWatcher(oven)
ovenWatcher.start()

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

    wsocks.append(wsock)
    while True:
        try:
            message = wsock.receive()
            wsock.send("Your message was: %r" % message)
        except WebSocketError:
            break


def main():
    ip = "0.0.0.0"
    port = 8080
    log.info("Starting picoreflowd")
    log.info("listening to %s:%d"%(ip,port))
    server = WSGIServer((ip,port), app,
                    handler_class=WebSocketHandler)
    server.serve_forever()

if __name__ == "__main__":
    main()

