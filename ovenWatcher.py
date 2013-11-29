import threading,logging,json,time,datetime
from oven import Oven
log = logging.getLogger(__name__)

class OvenWatcher(threading.Thread):
    def __init__(self,oven):
        self.last_profile = None
        self.last_log = []
        self.started = None
        self.recording = False
        self.observers = []
        threading.Thread.__init__(self)
        self.daemon = True

        self.oven = oven
        self.start()

    def run(self):
        while True:
            oven_state = self.oven.get_state()
            
            if oven_state.get("state") == Oven.STATE_RUNNING:
                self.last_log.append(oven_state)
            else:
                self.recording = False
            self.notify_all(oven_state)
            time.sleep(0.5)
    
    def record(self, profile):
        self.last_profile = profile
        self.last_log = []
        self.started = datetime.datetime.now()
        self.recording = True

    def add_observer(self,observer):
        backlog = {
            'type': "backlog",
            'profile': self.last_profile,
            'log': self.last_log,
            #'started': self.started
        }
        print backlog
        backlog_json = json.dumps(backlog)
        try:
            print backlog_json
            observer.send(backlog_json)
        except:
            log.error("Could not send backlog to new observer")
        
        self.observers.append(observer)

    def notify_all(self,message):
        message_json = json.dumps(message)
        log.debug("sending to %d clients: %s"%(len(self.observers),message_json))
        for wsock in self.observers:
            if wsock:
                try:
                    wsock.send(message_json)
                except:
                    log.error("could not write to socket %s"%wsock)
                    self.observers.remove(wsock)
            else:
                self.observers.remove(wsock)
