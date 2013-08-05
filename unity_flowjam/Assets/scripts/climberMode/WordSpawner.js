#pragma strict

public static var main:WordSpawner = null;

var wordPrefab:GameObject;

var width = 20.0;
var height = 20.0;
var wordColor = Color.white;

var nearFontSize = 32;
var farFontSize = 16;

function Awake()
{
    Utils.Assert( main == null );
    main = this;
}

class WordEntry
{
    var word:String;
    var pos:Vector3;
    var object:GameObject;
}

private var entries = new Grid.<WordEntry>();

function DestroyEntry( i:int, j:int )
{
    if( entries[i,j] != null )
    {
        Destroy( entries[i,j].object );
        entries[i,j] = null;
    }
}

function Clear()
{
    for( var i = 0; i < entries.GetCount(); i++ )
        if( entries[i] != null )
            Destroy(entries[i].object);

    entries.Clear();
}

function ReplaceEntry( i:int, j:int )
{
    DestroyEntry( i, j );
    var wsPos = ClimberGrid.mainTiler.GetGlobalPosition( i, j );
    entries[i,j] = CreateEntry(wsPos);
}

function GetEntry( i:int, j:int )
{
    return entries[i,j];
}

private function CreateEntry(wsPos:Vector3)
{
    wordPrefab.SetActive(false);

    var entry = new WordEntry();
    entry.pos = wsPos;
    entry.word = RhymeScorer.main.GetRandomPromptWord();
    entry.object = Instantiate( wordPrefab, Utils.WorldToGUIPoint(entry.pos), wordPrefab.transform.rotation );
    entry.object.SetActive(true);
    entry.object.name = "word:"+entry.word;

    var t = entry.object.GetComponent(GUIText);
    t.text = entry.word;
    t.material.color = wordColor;

    return entry;
}

function Reset(rowRadius:int, colRadius:int)
{
    Clear();

    var tiler = ClimberGrid.mainTiler;
    var tiles = tiler.GetTiles();
    entries.Resize( tiles.numRows, tiles.numCols, null );

    var guy = ClimberGuy.main;
    var row0 = Mathf.Max( 0, guy.initRow - rowRadius );
    var row1 = Mathf.Min( tiles.numRows, guy.initRow + rowRadius );
    var col0 = Mathf.Max( 0, guy.initCol - colRadius );
    var col1 = Mathf.Min( tiles.numCols, guy.initCol + colRadius );

    for( var i = row0; i <= row1; i++ )
        for( var j = col0; j <= col1; j++ )
            ReplaceEntry( i, j );
}

function OnGameOver()
{
    Clear();
}

function LateUpdate()
{
    // Make sure words move, to stay in the same world position
    for( var i = 0; i < entries.GetCount(); i++ )
    {
        var entry = entries[i];

        if( entry != null )
        {
            entry.object.transform.position = Utils.WorldToGUIPoint(entry.pos);
            entry.object.guiText.fontSize = farFontSize;
        }
    }

    //----------------------------------------
    //  Make words near player larger
    //----------------------------------------
    if( ClimberGame.main.GetIsPlaying() )
    {
        i = ClimberGuy.main.GetRow();
        var j = ClimberGuy.main.GetCol();

        for( var k = 0; k < 6; k++ )
        {
            var nbor = HexTiler.GetNbor( i, j, k );
            entry = GetEntry( nbor.i, nbor.j );
            if( entry != null )
                entry.object.guiText.fontSize = nearFontSize;
        }
    }

}
