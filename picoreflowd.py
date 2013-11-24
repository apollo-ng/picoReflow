import os,logging,json

import bottle
from gevent.pywsgi import WSGIServer
from geventwebsocket import WebSocketHandler, WebSocketError

log_format = '%(asctime)s %(levelname)s %(name)s: %(message)s'
logging.basicConfig(level = logging.DEBUG, format = log_format)
log = logging.getLogger("picoreflowd")
log.info("Starting picoreflowd")

from oven import Oven
from ovenWatcher import OvenWatcher

app = bottle.Bottle()
oven = Oven()
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

def get_websocket_from_request():
    env = bottle.request.environ;
    wsock = env.get('wsgi.websocket')
    if not wsock:
        abort(400, 'Expected WebSocket request.')
    return wsock

@app.route('/control')
def handle_control():
    wsock = get_websocket_from_request()
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

@app.route('/storage')
def handle_storage():
    wsock = get_websocket_from_request()

    while True:
        try:
            message = wsock.receive()
            if message == "GET":
                log.info("GET command recived")
                wsock.send(get_profiles())
            elif message == "PUT":
                log.info("PUT command received")
        except WebSocketError:
            break

@app.route('/status')
def handle_status():
    wsock = get_websocket_from_request()
    ovenWatcher.addObserver(wsock)
    while True:
        try:
            message = wsock.receive()
            wsock.send("Your message was: %r" % message)
        except WebSocketError:
            break

def get_profiles():
    script_dir = os.path.dirname(os.path.realpath(__file__))
    path = os.path.join(script_dir,"storage","profiles")
    print path
    try :
        profile_files = os.listdir(path)
    except : 
        profile_files = []
    profiles = []
    for filename in profile_files:
        with open(os.path.join(path,filename), 'r') as f:
            profiles.append(json.load(f))
    return json.dumps(profiles)

def main():
    ip = "0.0.0.0"
    port = 8080
    log.info("listening to %s:%d"%(ip,port))
    
    server = WSGIServer((ip,port), app,
                    handler_class=WebSocketHandler)
    server.serve_forever()

if __name__ == "__main__":
    main()
