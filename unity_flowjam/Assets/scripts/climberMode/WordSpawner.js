#pragma strict

var wordPrefab:GameObject;

var width = 20.0;
var height = 20.0;
var numWords = 5;
var climber:ClimberGuy;

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
    return climber.transform.position + d;
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
    for( var i = 0; i < numWords; i++ )
    {
        Destroy(entries[i].go);
        entries[i] = null;
    }
}

private function CreateEntry(num:int)
{
    var entry = new WordEntry();
    entry.pos = GetRandomPosition();
    entry.word = RhymeScorer.main.GetRandomPromptWord();
    entry.go = Instantiate( wordPrefab, entry.pos, wordPrefab.transform.rotation );
    entry.go.SetActive(true);
    var t = entry.go.GetComponent(TextMesh);
    t.text = num + ". " + entry.word;

    return entry;
}

function Start()
{
    for( var i = 0; i < numWords; i++ )
    {
        entries.Add( CreateEntry(i) );
    }
    wordPrefab.SetActive(false);
}

function Update () {

}
