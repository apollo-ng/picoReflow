#!/usr/bin/python
import logging

from Adafruit_MAX31855 import MAX31855

class MAX31855SPI(object):
    '''Python driver for [MAX38155 Cold-Junction Compensated Thermocouple-to-Digital Converter](http://www.maximintegrated.com/datasheet/index.mvp/id/7273)
     Requires:
     - adafruit's MAX31855 SPI-only device library

    '''
    def __init__(self, spi_dev):
        self.max31855 = MAX31855.MAX31855(spi=spi_dev)
        self.log = logging.getLogger(__name__)

    def get(self):
        '''Reads SPI bus and returns current value of thermocouple.'''
        state = self.max31855.readState()
        self.log.debug("status %s" % state)
        if state['openCircuit']:
            raise MAX31855Error('Not Connected')
        elif state['shortGND']:
            raise MAX31855Error('Short to Ground')
        elif state['shortVCC']:
            raise MAX31855Error('Short to VCC')
        elif state['fault']:
            raise MAX31855Error('Unknown Error')
        return self.max31855.readLinearizedTempC()


class MAX31855SPIError(Exception):
    def __init__(self, value):
        self.value = value

    def __str__(self):
        return repr(self.value)
