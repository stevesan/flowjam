
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
    """ Not used any more. Not a very good way to score rhymes. """
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
    """ Essentially acts as a lexer from phonemes to syllables """
    sylVowels = []
    sylConsonants = []
    state = 'consonant'

    for pho in phos:
        if state == 'vowel':
            assert( not pho in CMU_VOWEL_PHONEMES )
            if pho in CMU_VOWEL_CHANGERS:
                sylVowels[-1] = sylVowels[-1] + "_" + pho
                state = 'vowelmod'
            else:
                sylConsonants.append(pho)
                state = 'consonant'
        elif state == 'consonant':
            if pho in CMU_VOWEL_PHONEMES:
                sylVowels.append(pho)
                state = 'vowel'
        elif state == 'vowelmod':
            if pho in CMU_VOWEL_PHONEMES:
                sylVowels.append(pho)
                sylConsonants.append('') # such as, tenant
                state = 'vowel'
            else:
                # do not worry about vowelmods here - two vowelmods in a row, just count the next as a consonant
                sylConsonants.append(pho)
                state = 'consonant'
    if state != 'consonant':
        sylConsonants.append('')
    return (sylVowels, sylConsonants)

def matchReverse(a,b):
    """ Does not count empty entries """
    n = min(len(a), len(b))
    count = 0
    matches = []
    for i in range(1,n+1):
        if a[-i] != '' and a[-i] == b[-i]:
            count = count + 1
            matches.append(a[-i])
    matches.reverse()
    return (count, matches)

def scoreEntries_SylMatch(aPhos, bPhos):
    (aVowels, aConss) = phos2syls(aPhos)
    (bVowels, bConss) = phos2syls(bPhos)
    assert( len(aVowels) == len(aConss) )
    assert( len(bVowels) == len(bConss) )

    score = 0
    vMatches = []
    cMatches = []
    n = min(len(aVowels), len(bVowels))
    for i in range(1,n+1):
        av = aVowels[-i]
        ac = aConss[-i]
        bv = bVowels[-i]
        bc = bConss[-i]
        if av == bv:
            if len(av) > 2:
                # modified vowel match
                score = score+1.5
            else:
                score = score+1
            if ac != '' and ac == bc:
                score = score+0.5
                cMatches.append(ac)
            vMatches.append(av)

    vMatches.reverse()
    cMatches.reverse()

    return (score, vMatches+cMatches)

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
    (score, matches) = scoreEntries_SylMatch( db[a], db[b] )
    print 'syl_score(%s,%s) \t %0.2f \t %0.2f \t %s' \
         % (a,b,score, expected, phos2str(matches))
    assert( expected == None or score == expected )

def testScoreWords(db, a, b, expected):
    (score, matches) = scoreWords(db, a, b, scoreEntries_SylMatch)
    print 'word_syl_score(%s,%s) \t %0.2f \t %0.2f \t %s' \
         % (a,b,score, expected, phos2str(matches))
    assert( expected == None or score == expected )

def test():
    db = readCMUDB('../cmudict_SPHINX_40.txt')

    # test cases
    testScoreEntries(db , 'book'    , 'look'     , 1.5)
    testScoreEntries(db , 'fashion' , 'ration'   , 3.0)
    testScoreEntries(db , 'state'   , 'invade'   , 1.0)
    testScoreEntries(db , 'invade'  , 'blade'    , 1.5)
    testScoreEntries(db , 'then'    , 'them'     , 0.0)
    testScoreEntries(db , 'close'   , 'close'    , 1.5)
    testScoreEntries(db , 'close'   , 'close(2)' , 1.0)
    testScoreEntries(db , 'rose'    , 'close'    , 1.0)
    testScoreEntries(db , 'rose'    , 'close(2)' , 1.5)

    assert( len(getEntriesForWord(db, 'associate')) == 4 )
    assert( len(getEntriesForWord(db, 'close')) == 2 )

    testScoreWords(db, 'rose', 'close', 1.5)

    testScoreEntries(db, 'out', 'doubt', 1.5)

    testScoreWords(db, 'proceeding', 'leading', 3.0)

    testScoreWords(db, 'dry', 'why', 1.0)
    testScoreWords(db, 'try', 'why', 1.0)
    testScoreWords(db, 'throttle', 'bottle', 3.0)
    testScoreWords(db, 'rhyme', 'sublime', 1.5)
    testScoreWords(db, 'bending', 'ending', 3.5)
    testScoreWords(db, 'venting', 'ending', 3.0)
    testScoreWords(db, 'cacophony', 'monopoly', 2.0)
    testScoreWords(db, 'broccoli', 'monopoly', 3.5)

    testScoreEntries(db, 'bastion', 'ration', 2.5)
    testScoreEntries(db, 'motion', 'ration', 1.5)
    testScoreEntries(db, 'bottle', 'ration', 0.0)

    testScoreWords(db, 'green', 'fiend', 1.5)
    testScoreWords(db, 'one', 'thumb', 0.0)

# testScoreWords(db, 'love', 'move', 0.0) # TODO make sure the consonant doesn't get counted again here..
    testScoreWords(db, 'real', 'still', 0.0)
    testScoreWords(db, 'compromise', 'promise', 0.0)

# weird cases
    testScoreWords(db, 'hollow', 'bottle', 0.0) # later on, maybe allow these really-forced rhymes, but that takes more work

    testScoreEntries(db , 'rose'    , 'close(2)' , 1.5)
    testScoreEntries(db , 'monk'    , 'flunk' , 2.0)

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
