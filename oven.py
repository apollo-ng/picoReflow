import threading,time,random,datetime,logging,json
import config

log = logging.getLogger(__name__)

try:
    from max31855 import MAX31855, MAX31855Error
    sensor_available = True
except ImportError:
    log.warning("Could not initialize temperature sensor, using dummy values!")
    sensor_available = False

try:
    import RPi.GPIO as GPIO
    GPIO.setmode(GPIO.BCM)
    GPIO.setwarnings(False)
    GPIO.setup(config.gpio_heat, GPIO.OUT)
    GPIO.setup(config.gpio_cool, GPIO.OUT)
    GPIO.setup(config.gpio_air, GPIO.OUT)
    GPIO.setup(config.gpio_door, GPIO.IN)

    gpio_available = True
except ImportError:
    log.warning("Could not initialize GPIOs, oven operation will only be simulated!")
    gpio_available = False

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
        self.door = self.get_door_state()
        self.state = Oven.STATE_IDLE
        self.set_heat(False)
        self.set_cool(False)
        self.set_air(False)

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
            self.door = self.get_door_state()
            
            if self.state == Oven.STATE_RUNNING:
                self.runtime = (datetime.datetime.now() - self.start_time).total_seconds()
                log.info("running at %.1f deg C (Target: %.1f) , heat %.2f, cool %.2f, air %.2f, door %s (%.1fs/%.0f)"%(self.temp_sensor.temperature,self.target,self.heat,self.cool,self.air,self.door,self.runtime,self.totaltime))
                self.target = self.profile.get_target_temperature(self.runtime)

                if self.profile.is_rising(self.runtime):
                    self.set_cool(False)
                    self.set_heat(self.temp_sensor.temperature < self.target)
                else:
                    self.set_heat(False)
                    self.set_cool(self.temp_sensor.temperature > self.target)
                
                self.set_air(self.temp_sensor.temperature<180)
                
                if self.runtime >= self.totaltime:
                    self.reset()
            time.sleep(0.5)
    
    def set_heat(self,value):
        if value:
            self.heat = 1.0
            if gpio_available:
                GPIO.output(config.gpio_heat, GPIO.LOW)
        else:
            self.heat = 0.0
            if gpio_available:
                GPIO.output(config.gpio_heat, GPIO.HIGH)
    
    def set_cool(self,value):
        if value:
            self.cool = 1.0
            if gpio_available:
                GPIO.output(config.gpio_cool, GPIO.LOW)
        else:
            self.cool = 0.0
            if gpio_available:
                GPIO.output(config.gpio_cool, GPIO.HIGH)
    
    def set_air(self,value):
        if value:
            self.air = 1.0
            if gpio_available:
                GPIO.output(config.gpio_air, GPIO.LOW)
        else:
            self.air = 0.0
            if gpio_available:
                GPIO.output(config.gpio_air, GPIO.HIGH)
                
    def get_state(self):
        state = {
            'runtime': self.runtime,
            'temperature': self.temp_sensor.temperature,
            'target': self.target,
            'state': self.state,
            'heat': self.heat,
            'cool': self.cool,
            'air' : self.air,
            'totaltime': self.totaltime,
            'door': self.door
        }
        return state
        
    def get_door_state(self):
        if gpio_available:
            return "OPEN" if GPIO.input(config.gpio_door) else "CLOSED"
        else:
            return "UNKNOWN"
            

class TempSensor(threading.Thread):
    def __init__(self,oven):
        threading.Thread.__init__(self)
        self.daemon = True

        self.temperature = 0
        self.oven = oven

        if sensor_available:
            self.thermocouple = MAX31855(config.gpio_sensor_cs, 
                                         config.gpio_sensor_clock, 
                                         config.gpio_sensor_data, 
                                         "c"
                                        )

    def run(self):
        while True:
            if sensor_available:
                self.temperature = self.thermocouple.get()
            else:
                time_delta = (20.0 - self.temperature)/40
                power_delta = 8.0*self.oven.heat
                self.temperature += (time_delta+power_delta)

            time.sleep(0.5)

class Profile():
    def __init__(self,json_data):
        obj = json.loads(json_data)
        self.name = obj["name"]
        self.data = sorted(obj["data"])

    def get_duration(self):
        return max([t for (t,x) in self.data])
    
    def get_surrounding_points(self,time):
        if time > self.get_duration():
            return (None,None)
        
        prev_point = None
        next_point = None

        for i in range(len(self.data)):
            if time < self.data[i][0]:
                prev_point = self.data[i-1]
                next_point = self.data[i]
                break
        
        return (prev_point,next_point)
    
    def is_rising(self,time):
        (prev_point,next_point) = self.get_surrounding_points(time)
        if prev_point and next_point:
            return prev_point[1] < next_point[1]
        else:
            return False
        
    def get_target_temperature(self,time):
        if time > self.get_duration():
            return 0

        (prev_point,next_point) = self.get_surrounding_points(time)
        
        incl = float(next_point[1] - prev_point[1]) / float(next_point[0] - prev_point[0])
        temp = prev_point[1] + (time - prev_point[0]) * incl
        return temp
