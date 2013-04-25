#pragma strict

var cmuDatabase:TextAsset;
private var proDict:Dictionary.<String, String[]> = null;

static private var sSingleton:RhymeScorer;

static private var VOWEL_PHONEMES = [
        "AA", "AE", "AH", "AO", "AW", "AY",
        "EH", "ER", "EY",
        "IH", "IY",
        "OW", "OY",
        "UH", "UW"];

static private var SYLLABIC_CONSONANTS = [ "L", "M", "N", "NG", "R" ];

private var vowelSet = new HashSet.<String>();
private var sylConSet = new HashSet.<String>();

static function Get()
{
    return sSingleton;
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
        var word = parts[0].ToLower();
        var phos = parts[1];
        db.Add( word, phos.Split([' '], System.StringSplitOptions.RemoveEmptyEntries) );
    }

    Debug.Log("parsed "+db.Count+" words");

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
            Utils.Assert( !vowelSet.Contains(pho) );
            Utils.Assert( syls.Count > 0 );

            if( sylConSet.Contains(pho) )
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
                Utils.Assert( !sylConSet.Contains(pho) );
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

        if( a.nucleus == b.nucleus )
        {
            // slight hack here - if the syl-con is an M, give 0.5 to kind of count it as a matching coda..
            if( a.nucleus.length > 2 && GetLast(a.nucleus) == 'M' )
                score += 1.5;
            else
                score += 1.0;

            // Bonus 0.5 for coda
            if( a.coda.length > 0 && a.coda == b.coda )
                score += 0.5;
        }
    }

    return score;
}

function TestScoreWords(a:String, b:String, expectedScore:float)
{
    var score = ScorePronuns(proDict[a], proDict[b]);
    Utils.Assert(score == expectedScore);
}

function Awake()
{
    sSingleton = this;

    //----------------------------------------
    //  Parse database into dictionary
    //----------------------------------------
    var lines = cmuDatabase.text.Split('\n'[0]);
    proDict = ParseCMUDatabase(lines);

    for( var i = 0; i < VOWEL_PHONEMES.length; i++ )
        vowelSet.Add(VOWEL_PHONEMES[i]);

    for( i = 0; i < SYLLABIC_CONSONANTS.length; i++ )
        sylConSet.Add(SYLLABIC_CONSONANTS[i]);

    var syls = Phos2Syls( proDict['monopoly'] );
    Debug.Log(Syls2String(syls));

    TestScoreWords( 'fashion', 'ration', 2.5 );
    TestScoreWords( 'broccoli', 'monopoly', 3.0 );
    TestScoreWords( 'cacophony', 'monopoly', 2.0 );
}

function Start()
{

}

function Update()
{

}
