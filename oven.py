import threading,time,random,datetime,logging
from max31855 import MAX31855, MAX31855Error

log_format = '%(asctime)s %(levelname)s %(name)s: %(message)s'
logging.basicConfig(level = logging.INFO, format = log_format)
log = logging.getLogger(__name__)

class Oven (threading.Thread):
    STATE_IDLE      = "IDLE"
    STATE_RUNNING  = "RUNNING"
    STATE_ABORT    = "ABORT"
    STATE_ERROR    = "ERROR"

    def __init__(self):
        threading.Thread.__init__(self)
        self.profile = None
        self.start_time = 0
        self.power = 0.0
        self.state = Oven.STATE_IDLE
        self.temp_sensor = TempSensor(self)
        self.temp_sensor.start()

    def run_profile(self, profile):
        self.profile = profile
        self.state = Oven.STATE_RUNNING
        self.start_time = datetime.datetime.now()
        log.info("Starting")

    def abort_run(self):
        self.state = Oven.STATE_ABORT

    def run(self):
        while True:
            if self.state == Oven.STATE_RUNNING:
                log.info("running at %f deg C, power %f"%(self.temp_sensor.temperature,self.power))
                if self.temp_sensor.temperature < 250:
                    self.power = 1.0
                else:
                    self.power = 0.0
            elif self.state == Oven.STATE_ABORT:
                self.power = 0.0
                self.state = Oven.STATE_IDLE
            time.sleep(1)


    def get_state(self):
        if self.state == Oven.STATE_RUNNING:
            runtime = (datetime.datetime.now() - self.start_time).total_seconds()
        else:
            runtime = 0
        state = {
            'runtime': runtime,
            'temperature': self.temp_sensor.temperature,
            'state': self.state,
            'power': self.power,
            'totaltime': 300
        }
        return state

class TempSensor(threading.Thread):
    def __init__(self,oven):
        threading.Thread.__init__(self)
        self.temperature = 0
        self.oven = oven

        cs_pin = 27
        clock_pin = 22
        data_pin = 17
        units = "c"
        self.thermocouple = MAX31855(cs_pin, clock_pin, data_pin, units)


    def run(self):
        while True:
            time_delta = (20.0 - self.temperature)/40
            power_delta = 8.0*self.oven.power

            #self.temperature += (time_delta+power_delta)
            self.temperature = self.thermocouple.get()
            time.sleep(1)



if __name__ == "__main__":
    my_oven = Oven()
    my_oven.run_profile("abc")

