#pragma strict

var wordPrefab:GameObject;

var width = 20.0;
var height = 20.0;
var wordColor = Color.white;

class WordEntry
{
    var word:String;
    var pos:Vector3;
    var go:GameObject;
}

private var entries = new List.<WordEntry>();

private function GetRandomPosition()
{
    var d = Vector3(-width/2.0, 0.0);
    d.x += Random.value * width;
    d.y += Random.value * height;
    return ClimberGuy.main.transform.position + d;
}

function GetEntry(num:int)
{
    return entries[num];
}

function ReplaceEntry(num:int)
{
    // replace entry
    Destroy(entries[num].go);
    entries[num] = CreateEntry(num);
}

function OnGameOver()
{
}

private function CreateEntry(num:int)
{
    var entry = new WordEntry();
    entry.pos = GetRandomPosition();
    entry.word = RhymeScorer.main.GetRandomPromptWord();
    entry.go = Instantiate( wordPrefab, Utils.WorldToGUIPoint(entry.pos), wordPrefab.transform.rotation );
    entry.go.SetActive(true);
    wordPrefab.SetActive(false);

    var t = entry.go.GetComponent(GUIText);
    t.text = num + ". " + entry.word;
    t.material.color = wordColor;

    return entry;
}

function DestroyEntries()
{
    for( var i = 0; i < entries.Count; i++ )
    {
        Destroy(entries[i].go);
    }

    entries.Clear();
}

function OnGameStart()
{
    DestroyEntries();

    for( var i = 0; i < 10; i++ )
    {
        entries.Add( CreateEntry(i) );
    }
}

function Update ()
{
    // Make sure words move, to stay in the same world position
    for( var entry in entries )
    {
        if( entry != null )
            entry.go.transform.position = Utils.WorldToGUIPoint(entry.pos);
    }

}
