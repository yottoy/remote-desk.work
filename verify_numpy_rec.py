
import numpy
try:
    import numpy.rec
    print("SUCCESS: numpy.rec module is available in version", numpy.__version__)
    exit(0)
except ImportError:
    print("ERROR: numpy.rec module NOT available in version", numpy.__version__)
    exit(1)
