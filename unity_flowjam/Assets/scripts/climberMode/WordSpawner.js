#pragma strict

var wordPrefab:GameObject;

var width = 20.0;
var height = 20.0;
var wordColor = Color.white;

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

function ClearEntries()
{
    for( var i = 0; i < entries.GetCount(); i++ )
    {
        if( entries[i] != null )
            Destroy(entries[i].object);
    }

    entries.Clear();
}

function ReplaceEntry( i:int, j:int )
{
    DestroyEntry( i, j );
    var wsPos = ClimberGrid.mainTiler.GetGlobalPosition( i, j );
    entries[i,j] = CreateEntry(wsPos);
}

private function CreateEntry(wsPos:Vector3)
{
    var entry = new WordEntry();
    entry.pos = wsPos;
    entry.word = RhymeScorer.main.GetRandomPromptWord();
    entry.object = Instantiate( wordPrefab, Utils.WorldToGUIPoint(entry.pos), wordPrefab.transform.rotation );
    entry.object.SetActive(true);
    wordPrefab.SetActive(false);

    var t = entry.object.GetComponent(GUIText);
    t.text = entry.word;
    t.material.color = wordColor;

    return entry;
}

function OnGameStart()
{
    ClearEntries();

    var grid = ClimberGrid.mainTiler;
    entries.Resize( grid.numRows, grid.numCols, null );

    for( var i = 0; i < grid.numRows; i++ )
        for( var j = 0; j < grid.numCols; j++ )
            ReplaceEntry( i, j );
}

function OnGameOver()
{
    ClearEntries();
}

function Update ()
{
    // Make sure words move, to stay in the same world position
    for( var i = 0; i < entries.GetCount(); i++ )
    {
        var entry = entries[i];

        if( entry != null )
            entry.object.transform.position = Utils.WorldToGUIPoint(entry.pos);
    }

}
