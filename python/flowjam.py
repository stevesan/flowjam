
VOWEL_PHONEMES = set([
        'AA', 'AE', 'AH', 'AO', 'AW', 'AY',
        'EH', 'ER', 'EY',
        'IH', 'IY',
        'OW', 'OY',
        'UH', 'UW'])

# Not really used - just the complement of the vowels.
CONSONANT_PHONEMES = set([
        'B', 'CH', 'D', 'DH',
        'F', 'G', 'HH', 'JH', 'K',
        'L', 'M', 'N', 'NG',
        'P', 'R', 'S', 'SH', 'T', 'TH',
        'V', 'W', 'Y', 'Z', 'ZH'])

SYLLABIC_CONSONANTS = set([
        'L', 'M', 'N', 'NG', 'R' ])

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

def phos2syls(phos):
    """ Essentially acts as a lexer from phonemes to syllables. Currently ignores the onset, since the 'rhyme' only consists of nucleus and coda.
        https://en.wikipedia.org/wiki/Syllable """
    sylNuclei = []
    sylCodas = []
    state = 'consonant'

    for pho in phos:
        if state == 'vowel':
            assert( not pho in VOWEL_PHONEMES )
            if pho in SYLLABIC_CONSONANTS:
                sylNuclei[-1] = sylNuclei[-1] + "_" + pho
                state = 'sylconsonant'
            else:
                sylCodas.append(pho)
                state = 'consonant'
        elif state == 'consonant':
            if pho in VOWEL_PHONEMES:
                sylNuclei.append(pho)
                state = 'vowel'
            elif len(sylCodas) > 0:
                # add more coda consonants, like for 'clasped'
                sylCodas[-1] = sylCodas[-1] + "_" + pho
        elif state == 'sylconsonant':
            if pho in VOWEL_PHONEMES:
                sylNuclei.append(pho)
                sylCodas.append('') # such as, tenant
                state = 'vowel'
            else:
                assert( not pho in SYLLABIC_CONSONANTS )
                sylCodas.append(pho)
                state = 'consonant'
    # just to keep the lengths the same, for open syllables
    if state != 'consonant':
        sylCodas.append('')

    assert( len(sylNuclei) == len(sylCodas) )
    return (sylNuclei, sylCodas)

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
    (aNukes, aCodas) = phos2syls(aPhos)
    (bNukes, bCodas) = phos2syls(bPhos)
    assert( len(aNukes) == len(aCodas) )
    assert( len(bNukes) == len(bCodas) )

    score = 0
    vMatches = []
    cMatches = []
    n = min(len(aNukes), len(bNukes))
    for i in range(1,n+1):
        av = aNukes[-i]
        ac = aCodas[-i]
        bv = bNukes[-i]
        bc = bCodas[-i]
        if av == bv:
            # slight hack here - if the syl-con is an M, give 0.5 to kind of count it as a matching coda..
            if len(av) > 2 and av[-1] == 'M':
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
    testScoreEntries(db , 'fashion' , 'ration'   , 2.5)
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

    testScoreWords(db, 'proceeding', 'leading', 2.5)

    testScoreWords(db, 'dry', 'why', 1.0)
    testScoreWords(db, 'try', 'why', 1.0)
    testScoreWords(db, 'throttle', 'bottle', 2.5)
    testScoreWords(db, 'rhyme', 'sublime', 1.5)
    testScoreWords(db, 'climb', 'sublime', 1.5)
    testScoreWords(db, 'bending', 'ending', 2.5)
    testScoreWords(db, 'venting', 'ending', 2.0)
    testScoreWords(db, 'cacophony', 'monopoly', 2.0)
    testScoreWords(db, 'broccoli', 'monopoly', 3.0)

    testScoreEntries(db, 'bastion', 'ration', 2.0)
    testScoreEntries(db, 'motion', 'ration', 1.0)
    testScoreEntries(db, 'bottle', 'ration', 0.0)

    testScoreWords(db, 'green', 'fiend', 1.0)
    testScoreWords(db, 'friend', 'end', 1.5)
    testScoreWords(db, 'one', 'thumb', 0.0)

# testScoreWords(db, 'love', 'move', 0.0) # TODO make sure the consonant doesn't get counted again here..
    testScoreWords(db, 'real', 'still', 0.0)
    testScoreWords(db, 'compromise', 'promise', 0.0)

# weird cases
    testScoreWords(db, 'hollow', 'bottle', 0.0) # later on, maybe allow these really-forced rhymes, but that takes more work

    testScoreEntries(db , 'rose'    , 'close(2)' , 1.5)
    testScoreEntries(db , 'monk'    , 'flunk' , 1.5)
    testScoreEntries(db , 'mend'    , 'bend' , 1.5)
    testScoreEntries(db , 'med'    , 'bed' , 1.5)
    testScoreEntries(db , 'met'    , 'bed' , 1.0)
    testScoreEntries(db , 'well'    , 'hell' , 1.0)
    testScoreEntries(db , 'tank'    , 'bang' , 1.0)

    testScoreEntries(db , 'skull'    , 'skulk' , 1.0)
    testScoreEntries(db , 'bulk'    , 'skulk' , 1.5)
    testScoreEntries(db , 'fang'    , 'bank' , 1.0)
    testScoreEntries(db , 'rank'    , 'bank' , 1.5)
    testScoreEntries(db , 'scrunch'    , 'lunch' , 1.5)

    # check multi-consonant codas
    testScoreEntries(db , 'clasp'    , 'clasped' , 1.0)
    testScoreEntries(db , 'clasp'    , 'rasp' , 1.5)

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
