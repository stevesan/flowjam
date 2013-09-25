#pragma strict

import System.Collections.Generic;

var cmuDatabase:TextAsset;
var wikipediaFreqDatabase:TextAsset;
var banList:TextAsset;

var debug = false;
var statusText:GUIText;

class DifficultyLevel
{
    public var minFrequency = 100000;
    public var maxSyllables = 2;
}
public var difficultyLevels = new List.<DifficultyLevel>();

class Syllable
{
    var nucleus:String; // the vowel part, such as the "om" in "homes". This can include syllabic-consonants
    var coda:String;    // the ending part, such as the "Z" in "homes"

    function Syllable()
    {
        this.nucleus = '';
        this.coda = '';
    }

    function ToString()
    {
        return this.nucleus + ","+this.coda;
    }
};

// Entry-to-syllables table. An entry is a word, but may be a variant, like close vs. close(1)
private var proDict = new Dictionary.<String, List.<Syllable> >();

// The wikipedia mining results
private var word2freq = new Dictionary.<String, int>();

// Words the player is allowed to enter
private var validAnswerWords = HashSet.<String>();
private var difficulty2words = new List.< List.<String> >();
private var bannedWords = new HashSet.<String>();

private var ready = false;

static public var main:RhymeScorer;

static private var VOWEL_PHONEMES = [
        "AA", "AE", "AH", "AO", "AW", "AY",
        "EH", "ER", "EY",
        "IH", "IY",
        "OW", "OY",
        "UH", "UW"];

// These consontants are merged with their preceding vowels, because they modify
// the sound of those vowels. Ex: the 'o' in 'sole' is different from 'son'
static private var SYLLABIC_CONSONANTS = [ "L", "M", "N", "NG", "R" ];

private var vowelSet = new HashSet.<String>();
private var sylConSet = new HashSet.<String>();

static function Get()
{
    return main;
}

function GetIsReady() { return ready; }

class ScoreInfo
{
    var bonus:int;
    var score:float;
    var raw:float;
};

//----------------------------------------
//  
//----------------------------------------
function ProToString( syls:List.<Syllable> )
{
    var s = "";
    for( var syl in syls )
        s += syl.ToString() + " ";
    return s;
}

function ParseBanList( lines:String[] )
{
    bannedWords.Clear();

    for( line in lines )
        bannedWords.Add(line.ToLower().Trim());

    Debug.Log('parsed '+bannedWords.Count+' banned words');
}

function ParseWordFrequencyCSV( lines:String[] )
{
    word2freq.Clear();

    var count = 0;
    for( line in lines )
    {
        count++;
        if( count % 5000 == 0 )
        {
            statusText.text = "Parsing Frequency database.."+ (1.0*count/lines.Length*100).ToString("0.00")+"%";
            yield;
        }

        var parts = line.Split(','[0]);

        if( parts.length >= 2 )
        {
            var word = parts[0].ToLower().Trim();
            var freq = parseInt(parts[1].Trim());
            word2freq.Add( word, parseInt(freq) );
        }
    }
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
    proDict.Clear();

    var count = 0;
    for( line in lines )
    {
        count++;
        if( count % 5000 == 0 )
        {
            statusText.text = "Parsing CMU database.."+ (1.0*count/lines.Length*100).ToString("0.00")+"%";
            yield;
        }

		var parts = line.Split('\t'[0]);
        if( parts.length < 2 )
        {
            Debug.Log("Skipping line: " + line);
            continue;
        }
        var key = parts[0].ToLower().Trim();
        var phos = parts[1].Trim();
        var syls = Phos2Syls( phos.Split([' '], System.StringSplitOptions.RemoveEmptyEntries) );
        Utils.Assert( syls.Count > 0, line );
        proDict.Add( key, syls );
    }

    Debug.Log("Parsed "+proDict.Count+" words from CMU DB");
}

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

function SyllableMatch( a:Syllable, b:Syllable )
{
    if( !NucleiiMatch(a, b) )
        return false;

    return a.coda == b.coda;
}

//----------------------------------------
//  The 'nucleus' is the vowel of the syllable. This is the most important for rhyming.
//  We have this function here to allow for some hacks.
//----------------------------------------
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
    // TODO consider just always matching AH and IH... opposites vs. exists

    // hack for OW N and OW M, such as wishBONE vs. synDROME
    if( IsSamePair( a.nucleus, b.nucleus, 'OW_N', 'OW_M' ) )
        return true;

    // "beer" "here". IY_R is pretty uncommon relative to IH_R
    if( IsSamePair( a.nucleus, b.nucleus, 'IY_R', 'IH_R' ) )
        return true;

    // "hen" "been"
    if( IsSamePair( a.nucleus, b.nucleus, 'EH_N', 'AH_N' ) )
        return true;

    return false;
}

//----------------------------------------
//  All sorts of special-cases here..
//----------------------------------------
function ScorePronuns( aSyls:List.<Syllable>, bSyls:List.<Syllable> )
{
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

function GetPronuns(word:String) : List.< List.<Syllable> >
{
    word = word.ToLower();
    var pronuns = new List.< List.<Syllable> >();
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
    // Don't allow the same word
    // Don't allow plural variants
    // Don't allow past tense variants
    // But allow things like amp vs. camp
    return( (a.IndexOf(b) == 0 || b.IndexOf(a) == 0 )
            && Mathf.Abs(a.Length - b.Length) <= 1 );
}

function GetPhrasePronuns( words:String[] ) : List.< List.<Syllable> >
{
    var i = 0;

    var wordProNums = new List.<int>();
    var wordPros = new List.< List.<List.<Syllable> > >();

    for( i = 0; i < words.length; i++ )
    {
        wordProNums.Add(0);
        wordPros.Add( GetPronuns(words[i]) );
    }

    //----------------------------------------
    //  Now enumerate through all possible combinations
    //----------------------------------------
    var pros = new List.< List.<Syllable> >();

    while(true)
    {
        // build the currently indexed pronunciation
        var pro = new List.<Syllable>();
        for( i = 0; i < words.length; i++ )
            pro.AddRange( wordPros[i][ wordProNums[i] ] );
        pros.Add(pro);

        // Increment the indices
        i = words.length-1;
        while( i >= 0 )
        {
            wordProNums[i] = wordProNums[i] + 1;

            if( wordProNums[i] >= wordPros[i].Count )
            {
                wordProNums[i] = 0;
                i--;
            }
            else
                break;
        }
        if( i < 0 )
            // we've gone through all of them
            break;

    }

    return pros;
}

function AllNuceliiMatch( a:List.<Syllable>, b:List.<Syllable> )
{
    if( a.Count != b.Count )
        return false;

    for( var i = 0; i < a.Count; i++ )
    {
        if( !NucleiiMatch( a[i], b[i] ) )
            return false;
    }

    return true;
}

function AllNucleiiMatchExists( aString:String, bString:String ) : boolean
{
    var aa = aString.Split(' '[0]);
    var bb = bString.Split(' '[0]);

    //----------------------------------------
    //  
    //----------------------------------------

    for( var a in aa )
        if( !IsValidAnswer(a) )
            return false;

    for( var b in bb )
        if( !IsValidAnswer(b) )
            return false;

    if( aa.length == bb.length )
    {
        for( var i = 0; i < aa.length; i++ )
            if( IsTooSimilar(aa[i], bb[i]) )
                return false;
    }

    //----------------------------------------
    //  
    //----------------------------------------
    var aPros = GetPhrasePronuns(aa);
    var bPros = GetPhrasePronuns(bb);

    for( var aSyls in aPros )
    {
        for( var bSyls in bPros )
        {
            if( AllNuceliiMatch( aSyls, bSyls ) )
                return true;
        }
    }
    return false;
}

function ScoreStrings(aString:String, bString:String)
{
    var aa = aString.Split(' '[0]);
    var bb = bString.Split(' '[0]);

    //----------------------------------------
    //  
    //----------------------------------------

    for( var a in aa )
        if( !IsValidAnswer(a) )
            return 0.0;

    for( var b in bb )
        if( !IsValidAnswer(b) )
            return 0.0;

    if( aa.length == bb.length )
    {
        for( var i = 0; i < aa.length; i++ )
            if( IsTooSimilar(aa[i], bb[i]) )
                return 0.0;
    }

    //----------------------------------------
    //  
    //----------------------------------------

    var aPros = GetPhrasePronuns(aa);
    var bPros = GetPhrasePronuns(bb);

    // get max score of all unique pairings
    var maxScore = 0.0;
    for( var aSyls in aPros )
    {
        for( var bSyls in bPros )
        {
            var score = ScorePronuns(aSyls, bSyls);
            maxScore = Mathf.Max( score, maxScore );

            if( debug )
                Debug.Log(aString+" ("+ProToString(aSyls)+") "+bString+" ("+ProToString(bSyls)+") = "+score);
        }
    }
    return maxScore;
}

function ScoreWordsWithBonus(a:String, b:String)
{
    var raw = ScoreStrings(a,b);

    // We adjust the score to reflect the fact that rhyming syllables gets much harder they more you already have
    // so, map the score to an x^2 curve, sort of..
    var info = new ScoreInfo();
    info.bonus = Mathf.Max(0, Mathf.Floor(raw)-1);
    info.score = raw + info.bonus;
    info.raw = raw;
    return info;
}

function TestScoreStrings(a:String, b:String, expectedScore:float)
{
    var score = ScoreStrings(a, b);
    Utils.Assert(score == expectedScore, "actual = "+score+" expected = "+expectedScore);
}

function RunTestCases()
{
    TestScoreStrings('book'    , 'look'     , 1.5);
    TestScoreStrings('fashion' , 'ration'   , 2.5);
    TestScoreStrings('state'   , 'invade'   , 1.0);
    TestScoreStrings('invade'  , 'blade'    , 1.5);
    TestScoreStrings('then'    , 'them'     , 0.0);
    TestScoreStrings('close'   , 'close'    , 0.0);
    TestScoreStrings('rose'    , 'close'    , 1.5);

    TestScoreStrings('rose', 'close', 1.5);

    TestScoreStrings('out', 'doubt', 1.5);

    TestScoreStrings('proceeding', 'leading', 2.5);

    TestScoreStrings('dry', 'why', 1.0);
    TestScoreStrings('try', 'why', 1.0);
    TestScoreStrings('throttle', 'bottle', 2.5);
    TestScoreStrings('rhyme', 'sublime', 1.5);
    TestScoreStrings('climb', 'sublime', 1.5);
    TestScoreStrings('bending', 'spending', 2.5);
    TestScoreStrings('venting', 'ending', 2.0);
    TestScoreStrings('cacophony', 'monopoly', 1.0);
    TestScoreStrings('broccoli', 'monopoly', 3.0);

    TestScoreStrings('bastion', 'ration', 2.0);
    TestScoreStrings('motion', 'ration', 1.0);
    TestScoreStrings('bottle', 'ration', 0.0);

    TestScoreStrings('green', 'fiend', 1.0);
    TestScoreStrings('friend', 'mend', 1.5);
    TestScoreStrings('one', 'thumb', 0.0);

    TestScoreStrings('love', 'move', 0.0);
    TestScoreStrings('real', 'still', 0.0);
    TestScoreStrings('compromise', 'promise', 0.0);

    TestScoreStrings('hollow', 'bottle', 0.0);

    TestScoreStrings('monk'    , 'flunk' , 1.5);
    TestScoreStrings('mend'    , 'bend' , 1.5);
    TestScoreStrings('med'    , 'bed' , 1.5);
    TestScoreStrings('met'    , 'bed' , 1.0);
    TestScoreStrings('well'    , 'hell' , 1.0);
    TestScoreStrings('tank'    , 'bang' , 1.0);

    TestScoreStrings('skull'    , 'skulk' , 1.0);
    TestScoreStrings('bulk'    , 'skulk' , 1.5);
    TestScoreStrings('fang'    , 'bank' , 1.0);
    TestScoreStrings('rank'    , 'bank' , 1.5);
    TestScoreStrings('scrunch'    , 'lunch' , 1.5);

    // check multi-consonant codas
    TestScoreStrings('grasp'    , 'clasped' , 1.0);
    TestScoreStrings('clasp'    , 'grasp' , 1.5);
    TestScoreStrings('broccoli', 'properly', 1.0);
    TestScoreStrings('broccoli', 'locally', 2.0);
    TestScoreStrings('hands', 'dance', 1.0);

    // AH/IH-S special cases
    TestScoreStrings('emptiness', 'friendliness', 2.5);
    TestScoreStrings('abortionist', 'pessimist', 1.5);
    
    TestScoreStrings('obsessions', 'recession', 2.5);
    TestScoreStrings('obsessions', 'recessions', 3.0);
    
    TestScoreStrings('wishbone', 'syndrome', 1.0);
    TestScoreStrings('poor', 'floor', 1.0);
    TestScoreStrings('list', 'jist', 1.5);
    TestScoreStrings('here', 'beer', 1.0);
    TestScoreStrings('hen', 'been', 1.0);
    TestScoreStrings('cat', 'frat', 1.5);

    Utils.Assert( GetPhrasePronuns( ["separate","close"] ).Count == 6 );
    Utils.Assert( GetPhrasePronuns( ["rose","close"] ).Count == 2 );
    TestScoreStrings('hardware', 'car share', 2.0);
    TestScoreStrings('wishbone', 'fish phone', 2.0);
    TestScoreStrings('bone', 'phone', 1.0);

    Debug.Log('-- Tests done --');
}

function GetRandomPromptWord(difficulty:int)
{
    var list = difficulty2words[difficulty];
    var i = Random.Range(0, list.Count);
    return list[i];
}

function IsValidAnswer(phrase:String)
{
    var words = phrase.Split(' '[0]);

    for( var word in words )
        if( !validAnswerWords.Contains(word) )
            return false;

    return true;
}

function Awake()
{
    Utils.Assert( main == null );
    main = this;

    // Static data that we use
    for( var i = 0; i < VOWEL_PHONEMES.length; i++ )
        vowelSet.Add(VOWEL_PHONEMES[i]);

    for( i = 0; i < SYLLABIC_CONSONANTS.length; i++ )
        sylConSet.Add(SYLLABIC_CONSONANTS[i]);
}

function Start()
{
    //----------------------------------------
    //  Parse database into dictionary
    //----------------------------------------

    var lines = cmuDatabase.text.Split('\n'[0]);
    yield ParseCMUDatabase(lines);

    lines = wikipediaFreqDatabase.text.Split('\n'[0]);
    yield ParseWordFrequencyCSV(lines);

    lines = banList.text.Split('\n'[0]);
    ParseBanList(lines);

    //----------------------------------------
    //  Extract disjunct subsets of the CMU database entries to use as prompt words.
    //----------------------------------------
    validAnswerWords.Clear();

    var diff = 0;

    difficulty2words.Clear();
    for( diff = 0; diff < difficultyLevels.Count; diff++ )
        difficulty2words.Add( new List.<String>() );

    var count = 0;
    for( var key in proDict.Keys )
    {
        count++;
        if( count % 10000 == 0 )
        {
            statusText.text = "Classifying words.."+ (1.0*count/proDict.Keys.Count*100).ToString("0.00")+"%";
            yield;
        }

        // Ignore variants and words with non-alphabetic characters
        if( key.length > 1
                && key.IndexOf("(") == -1
                && key.IndexOf("'") == -1
                && key.IndexOf("-") == -1
                && key.IndexOf(".") == -1
          )
        {
            // But allow the user to answer with a word despite commonness
            validAnswerWords.Add(key);

            if( key.length > 2  // we tend to get a lot of these...like chemistry elements, heh. discount them completely.
                    && word2freq.ContainsKey(key)
                    && !bannedWords.Contains(key) )
            {
                var freq = word2freq[key];
                var syls = proDict[key];

                for( diff = 0; diff < difficultyLevels.Count; diff++ )
                {
                    if( freq >= difficultyLevels[diff].minFrequency
                            && syls.Count <= difficultyLevels[diff].maxSyllables )
                    {
                        difficulty2words[diff].Add(key);
                    }
                }
            }
        }
    }

    for( diff = 0; diff < difficultyLevels.Count; diff++ )
        Debug.Log("diff level "+diff+ " has "+difficulty2words[diff].Count+" words");

    RunTestCases();
    ready = true;
    statusText.text = "";
}


