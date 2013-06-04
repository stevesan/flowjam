#pragma strict

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

var distancePerScore = 1.0;

private var answerDisplay:GUIText;
private var state = "startscreen";
private var activeEntry:WordEntry;
private var previewScore = 0.0;
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

    centerText.material.color = Color(1,0.5f,0);
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

function OnInputEnter()
{
    /*
    if( activeEntry == null )
        return;

    var input = inputMgr.GetInput();
    var word = activeEntry.word;

    if( input == "" )
    var score = RhymeScorer.main.ScoreWords( input, word );

    if( score > 0.0 )
    {
        // move the guy!
        climber.DoMove( GetMoveDirection(activeEntry), GetMoveDistance(score.score) );
        activeEntry = null;
        inputMgr.ClearInput();
        words.ReplaceEntry(activeNumber);
    }
    */
}

function OnInputCharacter()
{
    if( activeEntry == null )
        return;

    var input = inputMgr.GetInput();
    var word = activeEntry.word;

    /*
    var score = RhymeScorer.main.ScoreWords( input, word );
    previewScore = score.score;
    */
}

function OnHitKillZone()
{
    TriggerGameOver();
}

function OnActiveEntryChanged()
{
    if( activeEntry == null )
        return;

    inputMgr.ClearInput();
    OnInputCharacter();
}

function TriggerGameOver()
{
    if( state == "started" )
    {
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
        activeEntry = null;
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
                    // TEMP
                    var nbor = HexTiler.GetNbor( GetPlayer().GetRow(), GetPlayer().GetCol(), nborNum );
                    GetPlayer().MoveTo( nbor.i, nbor.j, 1.0, false );
                }

                /*
                //----------------------------------------
                //  Kill words that are below the player
                //----------------------------------------
                if( entry != activeEntry && entry.pos.y < climber.transform.position.y )
                {
                    words.ReplaceEntry(num);
                }
                */
            }

            if( activeEntry != null )
            {
                answerDisplay.text = "{"+inputMgr.GetInput()+"}\n+" + previewScore.ToString("0.0");
                answerDisplay.transform.position = Utils.WorldToGUIPoint(activeEntry.pos) + gsAnswerDisplayOffset;
            }
            else
                answerDisplay.text = "";
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
