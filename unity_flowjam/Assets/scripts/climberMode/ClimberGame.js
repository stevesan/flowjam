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

private class GameMode
{
    public function GetHelpText() { return ""; }
    public function Start(game:ClimberGame) { }
    public function Update(game:ClimberGame) { }
    public function OnPlayerMove(game:ClimberGame) { }
    public function GetShouldReplaceWords() { return true; }
    public function GetScore(game:ClimberGame) { return game.GetLastScore(); }
    public function GetGameOverText(game:ClimberGame) { return "Game over!"; }
}

private class ActionGameMode extends GameMode
{
    public function GetHelpText()
    {
        return "LAVA IS RISING!\nTo move, press a number and type a rhyming word.\nMOVE FAST! You can't hold on forever.";
    }

    public function Start(game:ClimberGame)
    {
        game.words.Reset(999, 999);
        ClimberCamera.main.SetFollow(true);
    }

    public function Update(game:ClimberGame)
    {
        game.stateOut.text = "HEIGHT: " + game.climber.transform.position.y.ToString("0.0") + " M";
        game.centerText.text = "";

        if( game.lava.transform.position.y >= game.climber.transform.position.y )
        {
            game.TriggerGameOver();
        }
        else
        {
            //----------------------------------------
            //  Check for drop
            //----------------------------------------
            if( game.climber.GetGripSecs() < 0 )
            {
                game.MovePlayer( game.climber.GetRow()-2, game.climber.GetCol(), 0 );
                game.GetComponent(Connectable).TriggerEvent("OnPlayerDrop");
            }
        }
    }

    public function GetScore(game:ClimberGame) { return game.GetGripBonus(); }

    public function GetGameOverText(game:ClimberGame)
    {
        return "GAME OVER! Reached " + game.climber.transform.position.y.ToString("0.0") + " meters";
    }
}

private class RaceGameMode extends GameMode
{
    private var elapsedTime = 0.0;
    private var startHeight = 0.0;
    private var goalHeight = 30.0;
    private var newRecord = false;

    public function GetHelpText()
    {
        return "To move, press a number and type a rhyming word.\nReach "+goalHeight+" M as fast as possible!";
    }

    public function Start(game:ClimberGame)
    {
        game.words.Reset(999, 999);
        game.climber.SetShowGripSecs(false);
        ClimberCamera.main.SetFollow(true);
        game.lava.Disable();
        elapsedTime = 0.0;
        startHeight = game.climber.transform.position.y;
        newRecord = false;
    }

    public function GetTime()
    {
        return elapsedTime;
    }

    public function GetBestTime()
    {
        return PlayerPrefs.GetFloat("bestRaceTime", 999.0);
    }

    public function Update(game:ClimberGame)
    {
        elapsedTime += Time.deltaTime;

        var ht = game.climber.transform.position.y - startHeight;
        game.stateOut.text = "HEIGHT: " + ht.ToString("0.0") + " / "+goalHeight+" M\n";
        game.stateOut.text += "TIME: " + GetTime().ToString("0.00") + " / " + GetBestTime().ToString("0.00") + " S\n";
        game.centerText.text = "";

        if( ht > goalHeight )
        {
            game.TriggerGameOver();
            if( GetTime() < GetBestTime() )
            {
                newRecord = true;
                PlayerPrefs.SetFloat("bestRaceTime", GetTime());
            }
        }
    }

    public function GetScore(game:ClimberGame) { return game.GetGripBonus(); }

    public function GetGameOverText(game:ClimberGame)
    {
        return "FINISHED!\nTIME: " + GetTime().ToString("0.00") + " seconds\n"+
            "BEST TIME: " + PlayerPrefs.GetFloat("bestRaceTime", 999.0).ToString("0.00")
            + (newRecord ? "\nNEW RECORD :D :D :D" : "");
    }
}

private class RelaxGameMode extends GameMode
{
    private var score = 0.0;

    public function GetHelpText()
    {
        return "To move, press a number and type a rhyming word.\nBetter rhymes get more points";
    }

    public function Start(game:ClimberGame)
    {
        score = 0;

        game.lava.Disable();
        game.climber.SetShowGripSecs(false);
        game.words.Reset(4,1);
        ClimberCamera.main.SetFollow(false);
    }

    public function Update(game:ClimberGame)
    {
        game.centerText.text = "";
        game.stateOut.text = "Score: " + score.ToString("0.0");
    }

    public function OnPlayerMove(game:ClimberGame)
    {
        score += game.GetLastScore();
    }

    public function GetShouldReplaceWords() { return false; }

    public function GetScore(game:ClimberGame) { return game.GetLastScore(); }
}

private var gameMode:GameMode = null;

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
    return state == "playing";
}

function SetActiveEntry(entry:WordEntry)
{
    if( activeEntry != entry )
    {
        if( activeEntry != null && activeEntry.object != null )
            activeEntry.object.GetComponent(GUIText).material.color = Color.yellow;

        activeEntry = entry;

        inputMgr.ClearInput();
        OnInputCharacter();

        if( activeEntry != null && activeEntry.object != null )
            activeEntry.object.GetComponent(GUIText).material.color = Color.white;
    }
}

function GetLastScore() { return activeScore; }

function GetGripBonus() { return Mathf.Max( 0, 2 * (activeScore-1) ); }

function MovePlayer( i:int, j:int, gripBonus:float )
{
    var climber = ClimberGuy.main;

    if( gameMode.GetShouldReplaceWords() )
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
        MovePlayer( activeNbor.i, activeNbor.j, GetGripBonus() );
        GetComponent(Connectable).TriggerEvent("OnPlayerMove");
        gameMode.OnPlayerMove( this );
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
        else
        {
            var kudos = [ "OK", "Good", "Great", "Amazing", "Impossible" ];

            feedbackMsg = kudos[ Mathf.Ceil(activeScore)-1 ] + " +" + gameMode.GetScore(this);
        }
    }
}

function OnHitKillZone()
{
    TriggerGameOver();
}

function TriggerGameOver()
{
    if( state == "playing" )
    {
        GetComponent(Connectable).TriggerEvent("OnPlayerDie");

        SetActiveEntry(null);
        words.OnGameOver();
        lava.OnGameOver();
        ClimberGuy.main.OnGameOver();
        state = "gameover";
    }
}

function StartPlaying()
{
    if( state == "gameover" || state == "helpscreen" )
    {
        SetActiveEntry(null);
        lava.OnGameStart();
        ClimberGuy.main.OnGameStart();
        state = "playing";
        gameMode.Start(this);
        words.DestroyEntry( ClimberGuy.main.GetRow(), ClimberGuy.main.GetCol() );
    }
}

function GetPlayer()
{
    return ClimberGuy.main;
}

function Update()
{
    if( state == "startscreen" )
    {
        centerText.text = "Press a number:\n"
            + "1. Relax Mode\n"
            + "2. Action Mode\n"
            + "3. Race Mode\n"
            + "4. 1 vs. 1 Mode\n";

        if( Input.GetKeyDown("1") )
        {
            gameMode = new RelaxGameMode();
            state = "helpscreen";
        }
        else if( Input.GetKeyDown("2") )
        {
            gameMode = new ActionGameMode();
            state = "helpscreen";
        }
        else if( Input.GetKeyDown("3") )
        {
            gameMode = new RaceGameMode();
            state = "helpscreen";
        }
        /*
        else if( Input.GetKeyDown("4") )
            state = "versusStartscreen";
            */

        stateOut.text = "";
        answerDisplay.text = "";
    }
    else if( state == "helpscreen" )
    {
        stateOut.text = "";
        answerDisplay.text = "";
        centerText.text = gameMode.GetHelpText() + "\n\nSPACE BAR TO START";

        if( Input.GetKeyDown("space") )
            StartPlaying();
    }
    else if( state == "playing" )
    {
        for( var nborNum = 0; nborNum < 6; nborNum++ )
        {
            if( Input.GetKeyDown((nborNum+1)+"") )
            {
                activeNbor = HexTiler.GetNbor( climber.GetRow(), climber.GetCol(), nborNum );
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

        gameMode.Update(this);
    }
    else if( state == "gameover" )
    {
        stateOut.text = "";
        centerText.text = gameMode.GetGameOverText(this);
        centerText.text += "\n\nSPACE BAR TO RESTART";
        answerDisplay.text = "";

        if( Input.GetKeyDown("space") )
            StartPlaying();
    }

}
