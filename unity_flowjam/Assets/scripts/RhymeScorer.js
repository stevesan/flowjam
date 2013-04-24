#pragma strict

var cmuDatabase:TextAsset;

static private var sSingleton:RhymeScorer;

static private var sVowelPhonemes = [
        "AA", "AE", "AH", "AO", "AW", "AY",
        "EH", "ER", "EY",
        "IH", "IY",
        "OW", "OY",
        "UH", "UW"];

static private var sSyllabicConsonants = [ "L", "M", "N", "NG", "R" ];

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

function Awake()
{
    sSingleton = this;

    //----------------------------------------
    //  Parse database into dictionary
    //----------------------------------------
    var lines = cmuDatabase.text.Split('\n'[0]);
    ParseCMUDatabase(lines);

    for( var i = 0; i < sVowelPhonemes.length; i++ )
        vowelSet.Add(sVowelPhonemes[i]);

    for( i = 0; i < sSyllabicConsonants.length; i++ )
        sylConSet.Add(sSyllabicConsonants[i]);
}

function Start()
{

}

function Update()
{

}
