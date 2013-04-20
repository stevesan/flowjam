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

def isSamePair(a, b, c, d):
    """ Returns true if [a,b] is the same unordered pair as [c,d] """
    if a == c and b == d: return True
    if a == d and b == c: return True
    return False

def scorePhonemes(a,b):
    """ returns (score, rule). rule is the phoneme symbol that represents the rule which resulted in the score. """
    if a == b: return (1,'='+a)
# TODO score same vowels with 1, but don't give as much for same consonants? except at end?
    elif isSamePair(a,b, 'T', 'D'): return (0.5, '~TD')
    elif isSamePair(a,b, 'M', 'N'): return (0.5, '~MN')
    elif isSamePair(a,b, 'S', 'Z'): return (0.5, '~SZ')
    elif isSamePair(a,b, 'B', 'D'): return (0.25, '~BD')
    else:
        return (0, None)

# An "entry" is a pronunciation, ie. list of phonemes
def scoreEntries(a, b):
    n = min(len(a), len(b))
    scoreRules = []
    score = 0
    for i in range(1,n+1):
        # score in reverse order
        pa = a[-i]
        pb = b[-i]
        (phoScore, rule) = scorePhonemes(pa, pb)
        if phoScore > 0:
            scoreRules.append(rule)
            score = score + phoScore
    scoreRules.reverse()
    return (score, scoreRules)

def findEntries(db, word):
    if db[word] == None: return []
    out = [db[word]]
    i = 2
    while True:
        key = "%s(%d)" % (word, i)
        try:
            entry = db[key]
            out.append(entry)
            i = i+1
        except:
            break
    return out
    
def scoreWords(db, a, b):
    # find all variants
    aEntries = findEntries(db, a)
    bEntries = findEntries(db, b)

    # get max score of all unique pairings
    maxScore = 0
    maxRules = []
    for aEntry in aEntries:
        for bEntry in bEntries:
            (score, rules) = scoreEntries( aEntry, bEntry )
            if score > maxScore:
                maxScore = score
                maxRules = rules
    return (maxScore, maxRules)

def phos2str(phos):
    return " ".join(phos)

def testScoreEntries(db, a, b, expected):
    (score, rules) = scoreEntries(db[a], db[b])
    assert( expected == None or score == expected )
    print phos2str(db[a]), '...', phos2str(db[b])
    print 'entryscore(%s,%s) = %0.2f (%s)' % (a,b,score, phos2str(rules))

def testScoreWords(db, a, b, expected):
    (score, rules) = scoreWords(db, a, b)
    assert( expected == None or score == expected )
    print phos2str(db[a]), '...', phos2str(db[b])
    print 'wordscore(%s,%s) = %0.2f (%s)' % (a,b,score, phos2str(rules))

def test():
    db = readCMUDB('../cmudict_SPHINX_40.txt')

    # test cases
    testScoreEntries(db, 'book', 'look', 2.0)
    testScoreEntries(db, 'fashion', 'ration', 4.0)
    testScoreEntries(db, 'state', 'invade', 1.5)
    testScoreEntries(db, 'invade', 'blade', 2.0)
    testScoreEntries(db, 'then', 'them', 2.5)
    testScoreEntries(db, 'close', 'close', 4.0)
    testScoreEntries(db, 'close', 'close(2)', 3.5)
    testScoreEntries(db, 'rose', 'close', 1.5)
    testScoreEntries(db, 'rose', 'close(2)', 2.0)

    testScoreWords(db, 'rose', 'close', 2.0)

    assert( len(findEntries(db, 'associate')) == 4 )
    assert( len(findEntries(db, 'close')) == 2 )

def testLoop(db):
    prompt = 'Enter a word, or nothing to exit: '
    word = raw_input(prompt)
    prevWord = None
    while word != '':
        print db[word]
        if prevWord != None:
            testScoreEntries(prevWord, word)
        prevWord = word
        word = raw_input(prompt)

if __name__=='__main__':
    test()
