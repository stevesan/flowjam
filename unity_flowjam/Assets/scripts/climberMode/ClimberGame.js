#pragma strict

static var main:ClimberGame;

var lava:Lava;
var climber:ClimberGuy;
var stateOut:GUIText;
var centerText:GUIText;
var words:WordSpawner;
var inputMgr:TextInput;
var moveTargetPreview:GameObject;

var answerDisplayPrefab:GameObject;
var answerDisplayColor = Color.red;
var gsAnswerDisplayOffset:Vector3 = Vector3(0, -1.0, 0);

var distancePerScore = 1.0;

private var answerDisplay:GUIText;
private var state = "startscreen";
private var activeEntry:WordEntry;
private var previewScore = 0.0;
private var activeNumber = 0;

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

    var answerDisplayObject = Instantiate( answerDisplayPrefab, Vector3.zero, answerDisplayPrefab.transform.rotation );
    answerDisplayObject.SetActive(true);
    answerDisplayPrefab.SetActive(false);

    answerDisplay = answerDisplayObject.GetComponent(GUIText);
    answerDisplay.material.color = answerDisplayColor;
}

function GetMoveDirection(entry:WordEntry)
{
    var dir = (entry.pos - climber.transform.position).normalized;
    return dir;
}

function GetMoveDistance(score:float)
{
    return score * distancePerScore;
}

function GetMoveTarget(entry, score)
{
    return climber.transform.position + GetMoveDirection(entry) * GetMoveDistance(score);
}

function GetIsPlaying()
{
    return state == "started";
}

function OnInputEnter()
{
    if( activeEntry == null )
        return;

    var input = inputMgr.GetInput();
    var word = activeEntry.word;
    var score = RhymeScorer.main.ScoreWordsWithBonus( input, word );

    if( score.score > 0.0 )
    {
        // move the guy!
        climber.DoMove( GetMoveDirection(activeEntry), GetMoveDistance(score.score) );
        activeEntry = null;
        inputMgr.ClearInput();
        words.ReplaceEntry(activeNumber);
    }
}

function OnInputCharacter()
{
    if( activeEntry == null )
        return;

    var input = inputMgr.GetInput();
    var word = activeEntry.word;
    var score = RhymeScorer.main.ScoreWordsWithBonus( input, word );
    previewScore = score.score;
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
        activeNumber = -1;
        words.OnGameStart();
        lava.OnGameStart();
        ClimberGuy.main.OnGameStart();
        state = "started";
    }
}

function UpdateHeightText()
{
    stateOut.text = "HEIGHT: " + climber.transform.position.y.ToString("0.0") + " M";
}

function Update ()
{
    moveTargetPreview.SetActive(false);
    
    if( state == "startscreen" )
    {
        centerText.text = "LAVA IS RISING! To climb, press a number, then type a rhyming word.\nSPACE BAR TO START";
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
            for( var num = 0; num < 10; num++ )
            {
                var entry = words.GetEntry(num);

                // user selecting this word?
                if( Input.GetKeyDown(num+"") )
                {
                    if( entry != activeEntry )
                    {
                        activeEntry = entry;
                        activeNumber = num;
                        OnActiveEntryChanged();
                    }
                }

                //----------------------------------------
                //  Kill words that are below the player
                //----------------------------------------
                if( entry != activeEntry && entry.pos.y < climber.transform.position.y )
                {
                    words.ReplaceEntry(num);
                }
            }

            if( activeEntry != null )
            {
                answerDisplay.text = "{"+inputMgr.GetInput()+"}\n+" + previewScore.ToString("0.0");

                if( previewScore > 0 )
                {
                    // show target preview
                    moveTargetPreview.SetActive(true);
                    moveTargetPreview.transform.position = GetMoveTarget(activeEntry, previewScore);
                }

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
