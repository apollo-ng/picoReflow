#!/usr/bin/python
import RPi.GPIO as GPIO
import time

class MAX6675(object):
    '''Python driver for [MAX6675 Cold-Junction Compensated Thermocouple-to-Digital Converter](http://www.adafruit.com/datasheets/MAX6675.pdf)
     Requires:
     - The [GPIO Library](https://code.google.com/p/raspberry-gpio-python/) (Already on most Raspberry Pi OS builds)
     - A [Raspberry Pi](http://www.raspberrypi.org/)

    '''
    def __init__(self, cs_pin, clock_pin, data_pin, units = "c", board = GPIO.BCM):
        '''Initialize Soft (Bitbang) SPI bus

        Parameters:
        - cs_pin:    Chip Select (CS) / Slave Select (SS) pin (Any GPIO)  
        - clock_pin: Clock (SCLK / SCK) pin (Any GPIO)
        - data_pin:  Data input (SO / MOSI) pin (Any GPIO)
        - units:     (optional) unit of measurement to return. ("c" (default) | "k" | "f")
        - board:     (optional) pin numbering method as per RPi.GPIO library (GPIO.BCM (default) | GPIO.BOARD)

        '''
        self.cs_pin = cs_pin
        self.clock_pin = clock_pin
        self.data_pin = data_pin
        self.units = units
        self.data = None
        self.board = board

        # Initialize needed GPIO
        GPIO.setmode(self.board)
        GPIO.setup(self.cs_pin, GPIO.OUT)
        GPIO.setup(self.clock_pin, GPIO.OUT)
        GPIO.setup(self.data_pin, GPIO.IN)

        # Pull chip select high to make chip inactive
        GPIO.output(self.cs_pin, GPIO.HIGH)

    def get(self):
        '''Reads SPI bus and returns current value of thermocouple.'''
        self.read()
        self.checkErrors()
        return getattr(self, "to_" + self.units)(self.data_to_tc_temperature())

    def read(self):
        '''Reads 16 bits of the SPI bus & stores as an integer in self.data.'''
        bytesin = 0
        # Select the chip
        GPIO.output(self.cs_pin, GPIO.LOW)
        # Read in 16 bits
        for i in range(16):
            GPIO.output(self.clock_pin, GPIO.LOW)
            time.sleep(0.001)
            bytesin = bytesin << 1
            if (GPIO.input(self.data_pin)):
                bytesin = bytesin | 1
            GPIO.output(self.clock_pin, GPIO.HIGH)
        time.sleep(0.001)
        # Unselect the chip
        GPIO.output(self.cs_pin, GPIO.HIGH)
        # Save data
        self.data = bytesin

    def checkErrors(self, data_16 = None):
        '''Checks errors on bit D2'''
        if data_16 is None:
            data_16 = self.data
        noConnection = (data_16 & 0x4) != 0       # tc input bit, D2

        if noConnection:
            raise MAX6675Error("No Connection") # open thermocouple

    def data_to_tc_temperature(self, data_16 = None):
        '''Takes an integer and returns a thermocouple temperature in celsius.'''
        if data_16 is None:
            data_16 = self.data
        # Remove bits D0-3
        tc_data = ((data_16 >> 3) & 0xFFF)
        # 12-bit resolution
        return (tc_data * 0.25)

    def to_c(self, celsius):
        '''Celsius passthrough for generic to_* method.'''
        return celsius

    def to_k(self, celsius):
        '''Convert celsius to kelvin.'''
        return celsius + 273.15

    def to_f(self, celsius):
        '''Convert celsius to fahrenheit.'''
        return celsius * 9.0/5.0 + 32

    def cleanup(self):
        '''Selective GPIO cleanup'''
        GPIO.setup(self.cs_pin, GPIO.IN)
        GPIO.setup(self.clock_pin, GPIO.IN)

class MAX6675Error(Exception):
     def __init__(self, value):
         self.value = value
     def __str__(self):
         return repr(self.value)

if __name__ == "__main__":

    # default example
    cs_pin = 24
    clock_pin = 23
    data_pin = 22
    units = "c"
    thermocouple = MAX6675(cs_pin, clock_pin, data_pin, units)
    running = True
    while(running):
        try:            
            try:
                tc = thermocouple.get()        
            except MAX6675Error as e:
                tc = "Error: "+ e.value
                running = False
                print("tc: {}".format(tc))
            time.sleep(1)
        except KeyboardInterrupt:
            running = False
    thermocouple.cleanup()
