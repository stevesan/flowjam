#pragma strict

var cmuDatabase:TextAsset;
var mobyWordList:TextAsset;

private var proDict:Dictionary.<String, String[]> = null;
private var validPromptWords:List.<String> = null;
private var validAnswerWords:HashSet.<String> = null;

static private var sSingleton:RhymeScorer;

static private var VOWEL_PHONEMES = [
        "AA", "AE", "AH", "AO", "AW", "AY",
        "EH", "ER", "EY",
        "IH", "IY",
        "OW", "OY",
        "UH", "UW"];

static private var SYLLABIC_CONSONANTS = [ "L", "M", "N", "NG", "R" ];

private var mobyWordSet = new HashSet.<String>();
private var vowelSet = new HashSet.<String>();
private var sylConSet = new HashSet.<String>();

static function Get()
{
    return sSingleton;
}

//----------------------------------------
//  Just adds each word to the word hash set
//----------------------------------------
function ParseMobyWordList( lines:String[] )
{
    for( line in lines )
    {
        mobyWordSet.Add(line.Trim());
    }

    Debug.Log('parsed '+mobyWordSet.Count+' words from Moby list');
}

//----------------------------------------
//  Strips off the variant indicies, ie. close(2) -> close
//----------------------------------------
function CMUKey2Word(key:String)
{
    var i = key.IndexOf('(');
    if( i != -1 )
    {
        return key.Substring(0, i);
    }
    else
        return key;
}

function ParseCMUDatabase( lines:String[] )
{
    var db = new Dictionary.<String, String[]>();

    for( line in lines )
    {
		var parts = line.Split('\t'[0]);
        if( parts.length < 2 )
        {
            Debug.Log("Skipping line: " + line);
            continue;
        }
        var key = parts[0].ToLower().Trim();
        var phos = parts[1].Trim();
        db.Add( key, phos.Split([' '], System.StringSplitOptions.RemoveEmptyEntries) );
    }

    Debug.Log("added "+db.Count+" words to pronun db");

    return db;
}

class Syllable
{
    var nucleus:String;
    var coda:String;

    function Syllable()
    {
        this.nucleus = '';
        this.coda = '';
    }
};

function GetLast( list:List.<Syllable> ) { return list[list.Count-1]; }
function GetLast( s:String ) { return s[s.length-1]; }
function GetReverse( list:List.<Syllable>, i:int ) { return list[ list.Count-1-i ]; }

function Phos2Syls( phos:String[] ) : List.<Syllable>
{
    var syls = new List.<Syllable>();
    var state = 'consonant';

    for( var pho in phos )
    {
        if( state == 'vowel' )
        {
            Utils.Assert( syls.Count > 0 );

            if( vowelSet.Contains(pho) )
            {
                // We can have two vowels in a row, such as the end of "pectoral"
                syls.Add(new Syllable());
                GetLast(syls).nucleus = pho;
                state = 'vowel';
            }
            else if( sylConSet.Contains(pho) )
            {
                GetLast(syls).nucleus += '_' + pho;
                state = 'sylcon';
            }
            else
            {
                GetLast(syls).coda = pho;
                state = 'consonant';
            }
        }
        else if( state == 'consonant' )
        {
            if( vowelSet.Contains(pho) )
            {
                syls.Add(new Syllable());
                GetLast(syls).nucleus = pho;
                state = 'vowel';
            }
            else if( syls.Count > 0 )
            {
                // not a starting consonant, must be multiple consonants after a vowel
                GetLast(syls).coda += pho;
                state = 'consonant';
            }
        }
        else if( state == 'sylcon' )
        {
            if( vowelSet.Contains(pho) )
            {
                syls.Add(new Syllable());
                GetLast(syls).nucleus = pho;
                state = 'vowel';
            }
            else
            {
                Utils.Assert( syls.Count > 0 );
                GetLast(syls).coda = pho;
                state = 'consonant';
            }
        }
    }

    return syls;
}

function Syls2String( syls:List.<Syllable> )
{
    var s = '';
    for( var syl in syls )
    {
        s += syl.nucleus + ',' + syl.coda + ' ';
    }
    return s;
}

function IsSamePair(a1:String, b1:String, a2:String, b2:String)
{
    return (a1 == a2 && b1 == b2)
        || (a1 == b2 && b1 == a2);
}

function NucleiiMatch(a:Syllable, b:Syllable)
{
    if( a.nucleus == b.nucleus )
        return true;

    // hack for AH-S and IH-S, like friendliness/emptiness, abortionist/perfectionist
    if( a.coda.Length > 0
            && b.coda.Length > 0
            && a.coda[0] == 'S'
            && b.coda[0] == 'S'
            && IsSamePair( a.nucleus, b.nucleus, 'AH', 'IH' ) )
    {
        return true;
    }

    return false;
}

//----------------------------------------
//  All sorts of special-cases here..
//----------------------------------------
function ScorePronuns( aPhos:String[], bPhos:String[] )
{
    var aSyls = Phos2Syls(aPhos);
    var bSyls = Phos2Syls(bPhos);

    var score = 0.0;
    var n = Mathf.Min( aSyls.Count, bSyls.Count );
    for( var i = 0; i < n; i++ )
    {
        var a = GetReverse(aSyls, i);
        var b = GetReverse(bSyls, i);

        if( NucleiiMatch(a, b) )
        {
            var hackForMUsed = false;

            // slight hack here - if the syl-con is an M, give 0.5 to kind of count it as a matching coda..
            if( a.nucleus.length > 2 && GetLast(a.nucleus) == 'M' )
            {
                hackForMUsed = true;
                score += 1.5;
            }
            else
                score += 1.0;

            // Bonus 0.5 for coda
            if( a.coda.length > 0
                    && a.coda == b.coda
                    && !hackForMUsed )
            {
                score += 0.5;
            }
        }
        else
        {
            // if nucleii don't rhyme, we must break it here
            break;
        }
    }

    return score;
}

function GetPronunsForWord(word:String)
{
    word = word.ToLower();
    var pronuns = new List.<String[]>();
    pronuns.Add( proDict[word] );

    var i = 2;
    while( true )
    {
        var key = word+"("+i+")";
        if( proDict.ContainsKey(key) )
            pronuns.Add( proDict[key] );
        else
            break;
        i++;
    }

    return pronuns;
}

function IsTooSimilar( a:String, b:String )
{
    return a.IndexOf(b) != -1
        || b.IndexOf(a) != -1;
}

function ScoreWords(a:String, b:String)
{
    if( !GetIsWord(a) || !GetIsWord(b) )
        return 0.0;

    if( IsTooSimilar(a, b) )
        return 0.0;

    // find all variants
    var aPros = GetPronunsForWord(a);
    var bPros = GetPronunsForWord(b);

    // get max score of all unique pairings
    var maxScore = 0.0;
    for( var aPro in aPros )
    {
        for( var bPro in bPros )
        {
            var score = ScorePronuns(aPro, bPro);
            maxScore = Mathf.Max( score, maxScore );
        }
    }
    return maxScore;
}

function TestScoreWords(a:String, b:String, expectedScore:float)
{
    var score = ScoreWords(a, b);
    Utils.Assert(score == expectedScore);
}

function RunTestCases()
{
    TestScoreWords('book'    , 'look'     , 1.5);
    TestScoreWords('fashion' , 'ration'   , 2.5);
    TestScoreWords('state'   , 'invade'   , 1.0);
    TestScoreWords('invade'  , 'blade'    , 1.5);
    TestScoreWords('then'    , 'them'     , 0.0);
    TestScoreWords('close'   , 'close'    , 0.0);
    TestScoreWords('rose'    , 'close'    , 1.5);

    TestScoreWords('rose', 'close', 1.5);

    TestScoreWords('out', 'doubt', 1.5);

    TestScoreWords('proceeding', 'leading', 2.5);

    TestScoreWords('dry', 'why', 1.0);
    TestScoreWords('try', 'why', 1.0);
    TestScoreWords('throttle', 'bottle', 2.5);
    TestScoreWords('rhyme', 'sublime', 1.5);
    TestScoreWords('climb', 'sublime', 1.5);
    TestScoreWords('bending', 'spending', 2.5);
    TestScoreWords('venting', 'ending', 2.0);
    TestScoreWords('cacophony', 'monopoly', 1.0);
    TestScoreWords('broccoli', 'monopoly', 3.0);

    TestScoreWords('bastion', 'ration', 2.0);
    TestScoreWords('motion', 'ration', 1.0);
    TestScoreWords('bottle', 'ration', 0.0);

    TestScoreWords('green', 'fiend', 1.0);
    TestScoreWords('friend', 'mend', 1.5);
    TestScoreWords('one', 'thumb', 0.0);

    TestScoreWords('love', 'move', 0.0);
    TestScoreWords('real', 'still', 0.0);
    TestScoreWords('compromise', 'promise', 0.0);

    TestScoreWords('hollow', 'bottle', 0.0);

    TestScoreWords('monk'    , 'flunk' , 1.5);
    TestScoreWords('mend'    , 'bend' , 1.5);
    TestScoreWords('med'    , 'bed' , 1.5);
    TestScoreWords('met'    , 'bed' , 1.0);
    TestScoreWords('well'    , 'hell' , 1.0);
    TestScoreWords('tank'    , 'bang' , 1.0);

    TestScoreWords('skull'    , 'skulk' , 1.0);
    TestScoreWords('bulk'    , 'skulk' , 1.5);
    TestScoreWords('fang'    , 'bank' , 1.0);
    TestScoreWords('rank'    , 'bank' , 1.5);
    TestScoreWords('scrunch'    , 'lunch' , 1.5);

    // check multi-consonant codas
    TestScoreWords('grasp'    , 'clasped' , 1.0);
    TestScoreWords('clasp'    , 'grasp' , 1.5);
    TestScoreWords('broccoli', 'properly', 1.0);
    TestScoreWords('broccoli', 'locally', 2.0);
    TestScoreWords('hands', 'dance', 1.0);

    // AH/IH-S special cases
    TestScoreWords('emptiness', 'friendliness', 2.5);
    TestScoreWords('abortionist', 'pessimist', 1.5);

    Debug.Log('-- Tests done --');
}

function GetRandomPromptWord()
{
    var i = Random.Range(0, validPromptWords.Count);
    return validPromptWords[i];
}

function GetIsWord(word:String)
{
    return validAnswerWords.Contains(word);
}

function ComputePromptEasiness(prompt:String)
{
    Utils.Assert( validPromptWords.Contains(prompt) );

    // go through all valid answers and compute total rhyme score
    var score = 0.0;
    var highestScore = 0.0;
    var bestWord = '';
    for( var other in validPromptWords )
    {
        if( other != prompt )
        {
            var s = ScoreWords(prompt, other);
            score += s;
            if( s > highestScore )
            {
                highestScore = s;
                bestWord = other;
            }
        }
    }
    Debug.Log("final total score for "+prompt+" = "+score+" best = "+bestWord);
}

function Awake()
{
    sSingleton = this;

    //----------------------------------------
    //  Parse database into dictionary
    //----------------------------------------
    var lines = cmuDatabase.text.Split('\n'[0]);
    proDict = ParseCMUDatabase(lines);

    // Parse in moby word list
    ParseMobyWordList( mobyWordList.text.Split('\n'[0]) );
    Utils.Assert( mobyWordSet.Contains('close') );

    //----------------------------------------
    //  Decide which words are allowed as prompts and answers
    //----------------------------------------
    validPromptWords = new List.<String>();
    validAnswerWords = new HashSet.<String>();
    for( var key in proDict.Keys )
    {
        // Ignore variants and words with apostrophes
        if( key.length > 1
                && key.IndexOf("(") == -1
                && key.IndexOf("'") == -1
                && key.IndexOf("-") == -1
                && key.IndexOf(".") == -1
          )
        {
            // do not give proper nouns as prompts
            if( mobyWordSet.Contains(key) )
                validPromptWords.Add(key);

            // But allow answers to be proper nouns
            validAnswerWords.Add(key);
        }
    }

    Debug.Log('prompt list has '+validPromptWords.Count+ ' words');

    for( var i = 0; i < VOWEL_PHONEMES.length; i++ )
        vowelSet.Add(VOWEL_PHONEMES[i]);

    for( i = 0; i < SYLLABIC_CONSONANTS.length; i++ )
        sylConSet.Add(SYLLABIC_CONSONANTS[i]);


    RunTestCases();

    //ComputePromptEasiness('apostrophe');
    //ComputePromptEasiness('asparagus');
    //ComputePromptEasiness('hedgehog');
}

function Start()
{

}

function Update()
{

}
