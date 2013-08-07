
import sys
import page_parser as parser

maxPages = 1000
numPages = 0
minFreq = 1000  # minimum frequency for printing a word
word2freq = dict()

def dumpWordFreqs():
    f = open('wordFreq.csv', 'w')
    for word, freq in word2freq.iteritems():
        if freq > minFreq:
            f.write('%s, %d\n' % (word, freq))
    f.close()

def printPage(page):
    global numPages

    numPages += 1
    if numPages % 100 == 0:
        print "parsed %d" % numPages
        dumpWordFreqs()
    #TEMP
    if maxPages > 0 and numPages >= maxPages:
        raise Exception("done")
    text = page.text.encode('utf_8')
    words = ''.join( (c.lower() if c.isalpha() else ' ') for c in text ).split()

    for word in words:
        if not word in word2freq:
            word2freq[word] = 0
        word2freq[word] += 1

if __name__ == '__main__':
    if len(sys.argv) > 2:
        maxPages = int(sys.argv[2])
    if len(sys.argv) > 3:
        minFreq = int(sys.argv[3])
    parser.parseWithCallback(sys.argv[1], printPage)

