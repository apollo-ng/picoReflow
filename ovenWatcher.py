import threading,logging,json,time

log = logging.getLogger(__name__)

class OvenWatcher(threading.Thread):
    def __init__(self,oven):
        self.observers = []
        threading.Thread.__init__(self)
        self.daemon = True
        
        self.oven = oven
        self.start()

    def run(self):
        while True:
            oven_state = self.oven.get_state()
            self.notifyAll(oven_state)
            time.sleep(1)
    
    def addObserver(self,observer):
        self.observers.append(observer)
    
    def notifyAll(self,message):
        message_json = json.dumps(message)
        log.debug("sending to %d clients: %s"%(len(self.observers),message_json))
        for wsock in self.observers:
            if wsock:
                try:
                    wsock.send(message_json)
                except:
                    log.error("could not write to socket %s"%wsock)
                    wsocks.remove(wsock)
            else:
                wsocks.remove(wsock)
