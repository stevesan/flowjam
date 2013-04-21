
CMU_VOWEL_PHONEMES = set(
        [
        'AA',
        'AE',
        'AH',
        'AO',
        'AW',
        'AY',
        'EH',
        'ER',
        'EY',
        'IH',
        'IY',
        'OW',
        'OY',
        'UH',
        'UW'])

CMU_CONSONANT_PHONEMES = set([
        'B',
        'CH',
        'D',
        'DH',
        'F',
        'G',
        'HH',
        'JH',
        'K',
        'L',
        'M',
        'N',
        'NG',
        'P',
        'R',
        'S',
        'SH',
        'T',
        'TH',
        'V',
        'W',
        'Y',
        'Z',
        'ZH'])

CMU_VOWEL_CHANGERS = set([ 'L', 'M', 'N', 'NG', 'R' ])

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
def scoreEntries_PhoMatch(aPhos, bPhos):
    n = min(len(aPhos), len(bPhos))
    scoreRules = []
    score = 0
    for i in range(1,n+1):
        # score in reverse order
        pa = aPhos[-i]
        pb = bPhos[-i]
        (phoScore, rule) = scorePhonemes(pa, pb)
        if phoScore > 0:
            scoreRules.append(rule)
            score = score + phoScore
    scoreRules.reverse()
    return (score, scoreRules)

#----------------------------------------
#  scoring algorithm using syllables
#----------------------------------------
def phos2syls(phos):
    out = []
    for i in range(len(phos)):
        pho = phos[i]
        if pho in CMU_VOWEL_PHONEMES:
            syl = pho
            if i < len(phos)-1:
                cons = phos[i+1]
                assert( not cons in CMU_VOWEL_PHONEMES )
                if cons in CMU_VOWEL_CHANGERS:
                    syl = syl + "_" + cons
            out.append(syl)
    return out

def scoreEntries_SylMatch(aPhos, bPhos):
    aSyls = phos2syls(aPhos)
    bSyls = phos2syls(bPhos)
    n = min(len(aSyls), len(bSyls))
    score = 0
    syls = []
    for i in range(1,n+1):
        aSyl = aSyls[-i]
        bSyl = bSyls[-i]
        if aSyl == bSyl:
            score = score + 1
            syls.append(aSyl)
    syls.reverse()
    return (score, syls)

def getEntriesForWord(db, word):
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
    
def scoreWords(db, a, b, scoreEntriesFunc):
    # find all variants
    aEntries = getEntriesForWord(db, a)
    bEntries = getEntriesForWord(db, b)

    # get max score of all unique pairings
    maxScore = 0
    maxRules = []
    for aEntry in aEntries:
        for bEntry in bEntries:
            (score, rules) = scoreEntriesFunc( aEntry, bEntry )
            if score > maxScore:
                maxScore = score
                maxRules = rules
    return (maxScore, maxRules)

def phos2str(phos):
    return " ".join(phos)

def testScoreEntries(db, a, b, expected):
    (score, rules) = scoreEntries_PhoMatch(db[a], db[b])
    assert( expected == None or score == expected )
#print phos2str(db[a]), '...', phos2str(db[b])
    print 'pho_score(%s,%s) \t %0.2f \t (%s)' % (a,b,score, phos2str(rules))

    (score, syls) = scoreEntries_SylMatch( db[a], db[b] )
    print 'syl_score(%s,%s) \t %0.2f \t (%s)' % (a,b,score, phos2str(syls))

def testScoreWords(db, a, b, expected):
    (score, rules) = scoreWords(db, a, b, scoreEntries_PhoMatch)
    assert( expected == None or score == expected )
#print phos2str(db[a]), '...', phos2str(db[b])
    print 'word_pho_score(%s,%s) \t %0.2f \t (%s)' % (a,b,score, phos2str(rules))

    (score, syls) = scoreWords(db, a, b, scoreEntries_SylMatch)
    print 'word_syl_score(%s,%s) \t %0.2f \t (%s)' % (a,b,score, phos2str(syls))

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

    assert( len(getEntriesForWord(db, 'associate')) == 4 )
    assert( len(getEntriesForWord(db, 'close')) == 2 )

    testScoreWords(db, 'rose', 'close', 2.0)

    testScoreEntries(db, 'out', 'doubt', 2.0)

    testScoreWords(db, 'proceeding', 'leading', 4.0)

    testScoreWords(db, 'dry', 'why', 1.0)
    testScoreWords(db, 'try', 'why', 1.0)
    testScoreWords(db, 'throttle', 'bottle', 4.0)
    testScoreWords(db, 'broccoli', 'monopoly', 4.0)
    testScoreWords(db, 'rhyme', 'sublime', 2.0)
    testScoreWords(db, 'bending', 'ending', 5.0)
    testScoreWords(db, 'cacophony', 'monopoly', 3.0)

# TODO broccoli/monopoly should score higher than fashion/ration. And hollow/bottle should score low, but non-zero

    testScoreEntries(db, 'bastion', 'ration', None)
    testScoreEntries(db, 'motion', 'ration', None)
    testScoreEntries(db, 'bottle', 'ration', None)

# forced rhymes
    testScoreWords(db, 'green', 'fiend', None) # this should be a 1 syllable rhyme..but the D throws it off..humm
    testScoreWords(db, 'one', 'thumb', None)

# problems
    testScoreWords(db, 'love', 'move', None) # should be 0, but the V matches
    testScoreWords(db, 'real', 'still', None) # should be 0, but the L matches
    testScoreWords(db, 'compromise', 'promise', None) # should be 0...

# weird cases
    testScoreWords(db, 'hollow', 'bottle', 0.0) # later on, maybe allow these really-forced rhymes, but that takes more work

    print phos2syls( db['broccoli'] )
    print phos2syls( db['monopoly'] )
    print phos2syls( db['fashion'] )
    print phos2syls( db['ration'] )
    print phos2syls( db['bottle'] )
    print phos2syls( db['shake'] )
    print phos2syls( db['hate'] )

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
