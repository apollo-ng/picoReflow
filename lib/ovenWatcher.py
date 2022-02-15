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
        self.log_skip_counter = 0

        self.oven = oven
        self.start()

    def run(self):
        while True:
            oven_state = self.oven.get_state()
            
            if oven_state.get("state") == Oven.STATE_RUNNING:
                if self.log_skip_counter==0:
                    self.last_log.append(oven_state)
            else:
                self.recording = False
            self.notify_all(oven_state)
            self.log_skip_counter = (self.log_skip_counter +1)%20
            time.sleep(self.oven.time_step)
    
    def record(self, profile):
        self.last_profile = profile
        self.last_log = []
        self.started = datetime.datetime.now()
        self.recording = True
        #we just turned on, add first state for nice graph
        self.last_log.append(self.oven.get_state())

    def add_observer(self,observer):
        if self.last_profile:
            p = {
                "name": self.last_profile.name,
                "data": self.last_profile.data, 
                "type" : "profile"
            }
        else:
            p = None
        
        backlog = {
            'type': "backlog",
            'profile': p,
            'log': self.last_log,
            #'started': self.started
        }
        print(backlog)
        backlog_json = json.dumps(backlog)
        try:
            print(backlog_json)
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
