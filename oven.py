import threading,time,random,datetime,logging,json

log = logging.getLogger(__name__)

try:
    from max31855 import MAX31855, MAX31855Error
    sensor_dummy = False
except ImportError:
    log.warning("Could not initialize temperature sensor, using dummy values!")
    sensor_dummy = True

class Oven (threading.Thread):
    STATE_IDLE     = "IDLE"
    STATE_RUNNING  = "RUNNING"

    def __init__(self):
        threading.Thread.__init__(self)
        self.daemon = True
        self.reset()
        self.temp_sensor = TempSensor(self)
        self.temp_sensor.start()
        self.start()
    
    def reset(self):
        self.profile = None
        self.start_time = 0
        self.runtime = 0
        self.totaltime = 0
        self.target = 0
        self.power = 0.0
        self.state = Oven.STATE_IDLE
    
    def run_profile(self, profile):
        log.info("Running profile %s"%profile.name)
        self.profile = profile
        self.totaltime = profile.get_duration()
        self.state = Oven.STATE_RUNNING
        self.start_time = datetime.datetime.now()
        log.info("Starting")

    def abort_run(self):
        self.reset()

    def run(self):
        while True:
            if self.state == Oven.STATE_RUNNING:
                self.runtime = (datetime.datetime.now() - self.start_time).total_seconds()
                log.info("running at %.1f deg C (Target: %.1f) , power %.2f (%.1fs/%.0f)"%(self.temp_sensor.temperature,self.target,self.power,self.runtime,self.totaltime))
                self.target = self.profile.get_target_temperature(self.runtime)
                
                if self.temp_sensor.temperature < self.target:
                    self.power = 1.0
                else:
                    self.power = 0.0
                if self.runtime >= self.totaltime:
                    self.reset()
            time.sleep(1)

    def get_state(self):
        state = {
            'runtime': self.runtime,
            'temperature': self.temp_sensor.temperature,
            'target': self.target,
            'state': self.state,
            'power': self.power,
            'totaltime': self.totaltime
        }
        return state

class TempSensor(threading.Thread):
    def __init__(self,oven):
        threading.Thread.__init__(self)
        self.daemon = True
        
        self.temperature = 0
        self.oven = oven
        
        if not sensor_dummy:
            cs_pin = 27
            clock_pin = 22
            data_pin = 17
            units = "c"
            self.thermocouple = MAX31855(cs_pin, clock_pin, data_pin, units)

    def run(self):
        while True:
            if not sensor_dummy:
                self.temperature = self.thermocouple.get()
            else:
                time_delta = (20.0 - self.temperature)/40
                power_delta = 8.0*self.oven.power
                self.temperature += (time_delta+power_delta)
            
            time.sleep(1)

class Profile():
    def __init__(self,json_data):
        obj = json.loads(json_data)
        self.name = obj["name"]
        self.data = sorted(obj["data"])
    
    def get_duration(self):
        return max([t for (t,x) in self.data])
    
    def get_target_temperature(self,time):
        if time > self.get_duration():
            return 0
        
        prev_point = None
        next_point = None
        
        for i in range(len(self.data)):
            if time < self.data[i][0]:
                prev_point = self.data[i-1]
                next_point = self.data[i]
                break
        
        incl = float(next_point[1] - prev_point[1]) / float(next_point[0] - prev_point[0])
        temp = prev_point[1] + (time - prev_point[0]) * incl
        return temp
