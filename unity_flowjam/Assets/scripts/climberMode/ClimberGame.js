#pragma strict
import SteveSharp;

static var main:ClimberGame;

var lava:Lava;
var climber:ClimberGuy;
var stateOut:GUIText;
var centerText:GUIText;
var words:WordSpawner;
var inputMgr:TextInput;

var answerDisplayPrefab:GameObject;
var answerDisplayColor = Color.red;
var gsAnswerDisplayOffset:Vector3 = Vector3(0, -1.0, 0);

private var answerDisplay:GUIText;
private var state = "startscreen";
private var activeEntry:WordEntry;
private var activeNbor:Int2;
private var activeScore = 0.0;
private var feedbackMsg = "";

function Awake()
{
    main = this;
}

function Start()
{
    var inputEvents = inputMgr.GetComponent(Connectable);
    inputEvents.AddListener(this.gameObject, "OnInputEnter");
    inputEvents.AddListener(this.gameObject, "OnInputCharacter");
    inputEvents.AddListener(this.gameObject, "OnBackspace", "OnInputCharacter");

    centerText.material.color = Color(1,1,0);
    stateOut.material.color = Color(1,1,1);

    var answerDisplayObject = Utils.SpawnFromPrefab( answerDisplayPrefab );
    answerDisplayObject.SetActive(true);
    answerDisplayPrefab.SetActive(false);

    answerDisplay = answerDisplayObject.GetComponent(GUIText);
    answerDisplay.material.color = answerDisplayColor;
}

function GetIsPlaying()
{
    return state == "started";
}

function SetActiveEntry(entry:WordEntry)
{
    if( activeEntry != entry )
    {
        if( activeEntry != null )
            activeEntry.object.GetComponent(GUIText).material.color = Color.yellow;

        activeEntry = entry;

        inputMgr.ClearInput();
        OnInputCharacter();

        if( activeEntry != null )
            activeEntry.object.GetComponent(GUIText).material.color = Color.white;
    }
}

function MovePlayer( i:int, j:int, gripBonus:float )
{
    var climber = ClimberGuy.main;

    // spawn a new word where we used to be
    words.ReplaceEntry( climber.GetRow(), climber.GetCol() );

    // Destroy word at move target
    words.DestroyEntry( i, j );

    // Move the climber!
    climber.MoveTo( i, j, gripBonus, false );

    // Reset input
    SetActiveEntry(null);
}

function OnInputEnter()
{
    if( activeEntry == null )
        return;

    if( activeScore > 0.0 )
    {
        MovePlayer( activeNbor.i, activeNbor.j, activeScore-1 );
    }
    else
    {
        // play error sound, flash feedback msg
    }
}

function OnInputCharacter()
{
    if( activeEntry == null )
        return;

    var input = inputMgr.GetInput();
    var word = activeEntry.word;

    activeScore = 0;

    if( input == "" )
    {
        feedbackMsg = "TYPE!";
    }
    else if( !RhymeScorer.main.GetIsWord(input) )
    {
        feedbackMsg = "Not a word";
    }
    else if( RhymeScorer.main.IsTooSimilar( input, word ) )
    {
        feedbackMsg = "Too similar";
    }
    else
    {
        activeScore = RhymeScorer.main.ScoreWords( input, word );

        if( activeScore == 0 )
            feedbackMsg = "Doesn't rhyme";
        else if( activeScore <= 1 )
            feedbackMsg = "OK";
        else if( activeScore <= 2 )
            feedbackMsg = "GOOD +" + (activeScore-1);
        else if( activeScore <= 3 )
            feedbackMsg = "GREAT +" + (activeScore-1);
        else if( activeScore <= 4 )
            feedbackMsg = "AMAZING +" + (activeScore-1);
        else
            feedbackMsg = "IMPOSSIBLE +" + (activeScore-1);
    }
}

function OnHitKillZone()
{
    TriggerGameOver();
}

function TriggerGameOver()
{
    if( state == "started" )
    {
        GetComponent(Connectable).TriggerEvent("OnPlayerDie");

        words.OnGameOver();
        lava.OnGameOver();
        ClimberGuy.main.OnGameOver();
        state = "gameover";
    }
}

function TriggerGameStart()
{
    if( state == "gameover" || state == "startscreen" )
    {
        SetActiveEntry(null);
        words.OnGameStart();
        lava.OnGameStart();
        ClimberGuy.main.OnGameStart();
        state = "started";
        words.DestroyEntry( ClimberGuy.main.GetRow(), ClimberGuy.main.GetCol() );
    }
}

function UpdateHeightText()
{
    stateOut.text = "HEIGHT: " + climber.transform.position.y.ToString("0.0") + " M";
}

function GetPlayer()
{
    return ClimberGuy.main;
}

function Update ()
{
    if( state == "startscreen" )
    {
        centerText.text = "LAVA IS RISING!\nTo climb, press a number and type a rhyming word.\nMOVE FAST! You can't hold on forever.\nSPACE BAR TO START";
        stateOut.text = "";
        answerDisplay.text = "";

        if( Input.GetKeyDown("space") )
            TriggerGameStart();
    }
    else if( state == "started" )
    {
        UpdateHeightText();
        centerText.text = "";

        if( lava.transform.position.y >= climber.transform.position.y )
        {
            TriggerGameOver();
        }
        else
        {
            //----------------------------------------
            //  
            //----------------------------------------
            for( var nborNum = 0; nborNum < 6; nborNum++ )
            {
                if( Input.GetKeyDown((nborNum+1)+"") )
                {
                    activeNbor = HexTiler.GetNbor( GetPlayer().GetRow(), GetPlayer().GetCol(), nborNum );
                    SetActiveEntry( words.GetEntry( activeNbor.i, activeNbor.j ) );
                }
            }

            if( activeEntry != null )
            {
                answerDisplay.text = inputMgr.GetInput()+"_\n" + feedbackMsg;
                answerDisplay.transform.position = Utils.WorldToGUIPoint(activeEntry.pos) + gsAnswerDisplayOffset;
            }
            else
                answerDisplay.text = "";

            //----------------------------------------
            //  Check for drop
            //----------------------------------------
            if( climber.GetGripSecs() < 0 )
            {
                MovePlayer( climber.GetRow()-2, climber.GetCol(), 0 );
                GetComponent(Connectable).TriggerEvent("OnPlayerDrop");
            }
        }
    }
    else if( state == "gameover" )
    {
        UpdateHeightText();
        centerText.text = "GAME OVER! Reached " + climber.transform.position.y.ToString("0.0") + " meters!";
        centerText.text += "\nSpace bar to try again";
        answerDisplay.text = "";

        if( Input.GetKeyDown("space") )
            TriggerGameStart();
    }

}
