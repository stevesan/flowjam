
import sys
import page_parser as parser

numPages = 0

def countPage(page):
    global numPages

    numPages += 1
    if numPages % 1000 == 0:
        print "counted %d" % numPages

if __name__ == '__main__':
    parser.parseWithCallback(sys.argv[1], countPage)
    print "numPages = %d" % numPages

