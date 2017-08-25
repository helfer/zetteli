import sys, os
from enum import Enum
from email.utils import parsedate_tz

class Zetteli:
  def __init__(self, timestamp = None, tags = None, body = None):
    self.timestamp = timestamp
    self.tags = tags
    self.body = body

  def __repr__(self):
      return 'Zetteli({},{})'.format(self.timestamp.isoformat(), self.tags)

  def save(self):
      # check to make sure body exists.
      # set defaults for tags and timestamp if necessary
      pass

class Error(Exception):
    """Base class for exceptions in this module."""
    pass

class ParserState(Enum):
    INIT = 1
    HEADER = 2
    BODY = 3

SEP = '---'

# File format:
# each zetteli must start with a ---
# after the --- comes the header. The header contains the date and tags.
# date is optional, tags are also optional.
# date line starts with a >, eg "> Tue, Aug 15 2017 10:00:00 -0700"
# tags are enclosed by [] and separated by spaces, eg "[note personal]
# if no date is provided, the current datetime is used.
# if no tags are provided, the 'misc' tag is implicitly assumed.
# after the header there must be an empty newline that separates it from the body.
# body continues until there's a line which contains nothing but --- when trimmed, or until the document ends.

def parseDate(date):
    # TODO this doesn't return a datetime yet, just a tuple.
    return parsedate_tz(date)

if __name__ == '__main__':
    zettelis = []
    filename = sys.argv[1]
    with open(filename, 'r') as f:
        state = ParserState.INIT
        nextState = None
        zli = Zetteli()
        body = ''
        for line in f.readlines():
            if state == ParserState.INIT:
                # find the first ---
                if line.rstrip() == SEP:
                    nextState = ParserState.HEADER
                else:
                    print 'Ignoring leading line', line

            elif state == ParserState.HEADER:
                if line.startswith('>'):
                    if zli.timestamp is not None:
                        raise Error('Duplicate timestamp for zetteli at {}'.format(zli.timestamp))
                    zli.timestamp = parseDate(line[1:])
                elif line.startswith('['):
                    if zli.tags is not None:
                        raise Error('Duplicate tag definition for zetteli at {}'.format(zli.timestamp))
                    end = line.rfind(']')
                    tags = line[1:end].split(' ')
                    zli.tags = tags
                elif len(line.strip()) == 0:
                    nextState = ParserState.BODY
                else:
                    raise Error('Illegal line in header: {}'.format(line))

            elif state == ParserState.BODY:
                # parse body until --- or EOF
                # trim trailing newlines.
                if line.rstrip() == SEP:
                    zli.body = body.rstrip('\n')
                    zettelis.append(zli)
                    body = ''
                    zli = Zetteli()
                    nextState = ParserState.HEADER
                else:
                    body += line

            else:
                raise Error('Unknown parser state')

            state = nextState
        if body:
            zli.body = body.rstrip('\n')
            zettelis.append(zli)

    print zettelis
