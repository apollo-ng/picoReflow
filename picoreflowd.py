import os,logging,json

import bottle
from gevent.pywsgi import WSGIServer
from geventwebsocket import WebSocketHandler, WebSocketError

log_format = '%(asctime)s %(levelname)s %(name)s: %(message)s'
logging.basicConfig(level = logging.INFO, format = log_format)
log = logging.getLogger("picoreflowd")
log.info("Starting picoreflowd")

from oven import Oven, Profile
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

def get_websocket_from_request():
    env = bottle.request.environ;
    wsock = env.get('wsgi.websocket')
    if not wsock:
        abort(400, 'Expected WebSocket request.')
    return wsock

@app.route('/control')
def handle_control():
    wsock = get_websocket_from_request()
    log.info("websocket (control) opened")
    while True:
        try:
            message = wsock.receive()
            wsock.send("Your message was: %r" % message)
            log.info("Received (control): %s"% message)
            msgdict = json.loads(message)
            if msgdict.get("cmd") == "RUN":
                log.info("RUN command received")
                profile_obj = msgdict.get('profile')
                if profile_obj:
                    profile_json = json.dumps(profile_obj)
                    profile = Profile(profile_json)
                oven.run_profile(profile)
            elif msgdict.get("cmd") == "STOP":
                log.info("Stop command received")
                oven.abort_run()
        except WebSocketError:
            break
    log.info("websocket (control) closed")

@app.route('/storage')
def handle_storage():
    wsock = get_websocket_from_request()
    log.info("websocket (storage) opened")
    while True:
        try:
            message = wsock.receive()
            if not message:
                break
            print message
            
            try:
                msgdict = json.loads(message)
            except:
                msgdict = {}
            
            if message == "GET":
                log.info("GET command recived")
                wsock.send(get_profiles())
            elif msgdict.get("cmd") == "PUT":
                log.info("PUT command received")
                profile_obj = msgdict.get('profile')
                force = msgdict.get('force',False)
                if profile_obj:
                    #del msgdict["cmd"]
                    if save_profile(profile_obj,force):
                        msgdict["resp"]="OK"
                    else:
                        msgdict["resp"]="FAIL"
                    print "sending:" +str(msgdict)
                    wsock.send(json.dumps(msgdict))
        except WebSocketError:
            break
    log.info("websocket (storage) closed")

@app.route('/status')
def handle_status():
    wsock = get_websocket_from_request()
    ovenWatcher.addObserver(wsock)
    log.info("websocket (status) opened")
    while True:
        try:
            message = wsock.receive()
            wsock.send("Your message was: %r" % message)
        except WebSocketError:
            break
    log.info("websocket (status) closed")

script_dir = os.path.dirname(os.path.realpath(__file__))
profile_path = os.path.join(script_dir,"storage","profiles")

def get_profiles():
    try :
        profile_files = os.listdir(profile_path)
    except : 
        profile_files = []
    profiles = []
    for filename in profile_files:
        with open(os.path.join(profile_path,filename), 'r') as f:
            profiles.append(json.load(f))
    return json.dumps(profiles)

def save_profile(profile, force=False):
    profile_json = json.dumps(profile)
    filename = profile['name']+".json"
    filepath = os.path.join(profile_path,filename)
    if not force and os.path.exists(filepath):
        print "Didnt write"
        return False
    with open(filepath, 'w+') as f:
        print filepath
        f.write(profile_json)
        f.close()
    print "Did write"
    return True

def main():
    ip = "0.0.0.0"
    port = 8080
    log.info("listening to %s:%d"%(ip,port))
    
    server = WSGIServer((ip,port), app,
                    handler_class=WebSocketHandler)
    server.serve_forever()

if __name__ == "__main__":
    main()
