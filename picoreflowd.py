import threading,time
import json
from oven import Oven

import bottle
from gevent.pywsgi import WSGIServer
from geventwebsocket import WebSocketHandler, WebSocketError

app = bottle.Bottle()
oven = Oven()
oven.start()
wsocks = []
wsocks_control = []

class OvenWatcher(threading.Thread):
    def __init__(self,oven):
        threading.Thread.__init__(self)
        self.oven = oven
    
    def run(self):
        while True:
            oven_state = self.oven.get_state()
            notifyAll(oven_state)
            time.sleep(1)
        
ovenWatcher = OvenWatcher(oven)
ovenWatcher.start()

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
            print message
            if message == "start":
                print "START"
                oven.run_profile("abc")
            elif message == "stop":
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

def notifyAll(message):
    message_json = json.dumps(message)
    print "sending to %d clients: %s"%(len(wsocks),message_json) 
    for wsock in wsocks:
        if wsock:
            try:
                wsock.send(message_json)
            except:
                print "Could not write to socket!"
                wsocks.remove(wsock)
        else:
            wsocks.remove(wsock)
def main():
    server = WSGIServer(("0.0.0.0", 8080), app,
                    handler_class=WebSocketHandler)
    server.serve_forever()

if __name__ == "__main__":
    main()

