def test():
#db = readMobyPron('../mpron/mobypron.unc')
    db = readCMUDB('../cmudict_SPHINX_40.txt')
    testLoop(db)

def readMobyPron(path):
    with open(path) as f:
        l = f.readline()
        # for some reason the moby database delineates with just carriage-returns..
        entries = l.split('\r')
        # now split individual word entries
        print "Got %d word entries" % len(entries)
        out = dict()
        for entry in entries:
            if entry == '': continue
            parts = entry.split(' ')
            word = parts[0]
            phos = parts[1]
            out[word] = phos
    return out

def readCMUDB(path):
    """ http://www.speech.cs.cmu.edu/cgi-bin/cmudict?in=dance """
    out = dict()
    with open(path) as f:
        for entry in f:
            parts = entry.split('\t')
            if len(parts) < 2:
                print 'Skipping line: "%s"' % line
            word = parts[0].lower() # CMU is all caps
            phos = parts[1].strip()
            out[word] = phos.split(' ')
    print 'Read %d words from CMU database at %s' % (len(out.keys()), path)
    return out

def computeRhymeScore(db, a, b):
    pa = db[a]
    pb = db[b]
# TODO make sure to look up all variants by appending (2), (3), etc., for both words, and find the best ones for both
    return 10-(abs(len(pa)-len(pb)))

def testLoop(db):
    prompt = 'Enter a word, or nothing to exit: '
    word = raw_input(prompt)
    prevWord = None
    while word != '':
        print db[word]
        if prevWord != None:
            print "rhyme( %s, %s ) = %d" % (prevWord, word, computeRhymeScore(db, prevWord, word))
        prevWord = word
        word = raw_input(prompt)

if __name__=='__main__':
    test()
