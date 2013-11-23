picoReflow
==========

Turns a Raspberry Pi into a universal, web enabled Reflow Oven Controller.

Based on MAX 31855 Cold-Junction K-Type Thermocouple and Raspberry Pi GPIO driven Solid State Relays.


Python Requirements:

Gentoo:

  - dev-python/bottle
  - dev-python/gevent
  - dev-python/gevent-websocket


Raspbian:

sudo apt-get install python-dev libevent-dev
sudo pip install bottle gevent gevent-websocket
