#pragma strict

static var main:ClimberGame;

var lava:Lava;
var climber:ClimberGuy;
var stateOut:GUIText;
var gameOverText:GUIText;
var words:WordSpawner;
var inputMgr:TextInput;
var moveTargetPreview:GameObject;

var answerDisplay:GUIText;
var gsAnswerDisplayOffset:Vector3 = Vector3(0, -1.0, 0);

var distancePerScore = 1.0;

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
    inputMgr.GetComponent(Connectable).AddListener(this.gameObject, "OnInputEnter");
    inputMgr.GetComponent(Connectable).AddListener(this.gameObject, "OnInputCharacter");
    inputMgr.GetComponent(Connectable).AddListener(this.gameObject, "OnBackspace", "OnInputCharacter");

    gameOverText.material.color = Color(0,0,0.8);
    stateOut.material.color = Color(0,0,0.8);
    answerDisplay.material.color = Color(0,0.8,0);
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
    state = "gameover";
    OnGameOver();
}

function OnActiveEntryChanged()
{
    if( activeEntry == null )
        return;

    inputMgr.ClearInput();
    OnInputCharacter();
}

function OnGameOver()
{
    words.OnGameOver();
    lava.OnGameOver();
}

function Update ()
{
    moveTargetPreview.SetActive(false);
    
    if( state == "startscreen" )
    {
        gameOverText.text = "LAVA IS RISING! To climb, press a number, then type a rhyming word.\nSPACE BAR TO START";
        stateOut.text = "";
        answerDisplay.text = "";

        if( Input.GetKeyDown("space") )
        {
            words.OnGameStart();
            lava.OnGameStart();
            state = "started";
        }
    }
    else if( state == "started" )
    {
        stateOut.text = "HEIGHT: " + climber.transform.position.y.ToString("0.0") + " M";

        gameOverText.text = "";

        if( lava.transform.position.y >= climber.transform.position.y )
        {
            state = "gameover";
            OnGameOver();
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
        stateOut.text = "Game over man!";
        stateOut.material.color = Color.blue;

        gameOverText.text = "GAME OVER! Reached " + climber.transform.position.y.ToString("0.0") + " meters!";
    }

}
