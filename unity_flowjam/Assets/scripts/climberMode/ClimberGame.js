#pragma strict

import System.Collections.Generic;

static var main:ClimberGame;

var lava:Lava;
var climber:ClimberGuy;
var stateOut:GUIText;
var centerText:GUIText;
var words:WordSpawner;
var inputMgr:TextInput;
var wheel:HexWheel;

var answerDisplayPrefab:GameObject;
var answerDisplayColor = Color.red;
var selectedPromptColor = Color.yellow;
var answerOffsetPixels:Vector3 = Vector3(0, 24, 0);
var feedbackOffsetPixels:Vector3 = Vector3(0, -24, 0);

// Only public because GameModes need it
public var answerDisplay:GUIText;
public var feedbackDisplay:GUIText;
private var state = "startscreen";

private class GameMode
{
    protected var game:ClimberGame;
    protected var activeEntry:WordEntry;
    protected var activeNbor:Int2;
    protected var activeNborNum = -1;
    protected var activeScore = 0.0;
    protected var feedbackMsg = "";
    var usedWords = new HashSet.<String>();

    function SetGame(game:ClimberGame)
    {
        this.game = game;
    }

    public function GetHelpText() { return ""; }
    public function Start()
    {
        usedWords.Clear();
    }

    public function Update()
    {
        for( var nborNum = 0; nborNum < 6; nborNum++ )
        {
            if( Input.GetKeyDown((nborNum+1)+"") )
            {
                var climber = ClimberGuy.main;
                activeNborNum = nborNum;
                activeNbor = HexTiler.GetNbor( climber.GetRow(), climber.GetCol(), nborNum );
                SetActiveEntry( game.words.GetEntry( activeNbor.i, activeNbor.j ) );
                game.wheel.hidden = nborNum;
            }
        }
    }

    public function LateUpdate()
    {
        if( activeEntry != null )
        {
            game.answerDisplay.text = game.inputMgr.GetInput()+"_";
            game.answerDisplay.transform.position = Utils.WorldToGUIPoint(activeEntry.pos)
                + Utils.PixelsToGUIOffset(game.answerOffsetPixels);

            game.feedbackDisplay.text = feedbackMsg;
            game.feedbackDisplay.transform.position = Utils.WorldToGUIPoint(activeEntry.pos)
                + Utils.PixelsToGUIOffset(game.feedbackOffsetPixels);
        }
        else
        {
            game.answerDisplay.text = "";
            game.feedbackDisplay.text = "";
        }
    }

    public function OnInputEnter() {}

    public function OnInputCharacter()
    {
        if( activeEntry == null )
            feedbackMsg = "press a number";
        else
        {
            var input = game.inputMgr.GetInput();
            var word = activeEntry.word;

            activeScore = 0;

            if( input == "" )
                feedbackMsg = "TYPE!";
            else if( !RhymeScorer.main.IsValidAnswer(input) )
                feedbackMsg = "Not a word";
            else if( usedWords.Contains(input) )
                feedbackMsg = "Used before";
            else if( RhymeScorer.main.IsTooSimilar( input, word ) )
                feedbackMsg = "Too similar";
            else
            {
                activeScore = RhymeScorer.main.ScoreWords( input, word );

                if( activeScore == 0 )
                    feedbackMsg = "Doesn't rhyme";
                else
                {
                    var kudos = [ "OK", "Good", "Great", "Amazing", "Impossible" ];
                    feedbackMsg = kudos[ Mathf.Ceil(activeScore)-1 ] + " +" + GetLastScore();
                }
            }
        }
    }

    public function GetShouldReplaceWords() { return true; }
    public function GetGameOverText() { return "Game over!"; }
    public function GetLastScore() { return activeScore; }

    function SetActiveEntry(entry:WordEntry)
    {
        if( activeEntry != entry )
        {
            if( activeEntry != null && activeEntry.object != null )
                activeEntry.object.GetComponent(GUIText).material.color = Color.white;

            activeEntry = entry;

            game.inputMgr.ClearInput();
            OnInputCharacter();

            if( activeEntry != null && activeEntry.object != null )
                activeEntry.object.GetComponent(GUIText).material.color = game.selectedPromptColor;

            if( entry == null )
                game.wheel.hidden = -1;
        }
    }

    function MovePlayer(i:int, j:int, gripBonus:float )
    {
        var climber = ClimberGuy.main;

        if( GetShouldReplaceWords() )
            // spawn a new word where we used to be
            game.words.ReplaceEntry( climber.GetRow(), climber.GetCol() );

        // Destroy word at move target
        game.words.DestroyEntry( i, j );

        // Move the climber!
        climber.MoveTo( i, j, gripBonus, false );

        // Reset input
        SetActiveEntry(null);
    }
}

private class ActionGameMode extends GameMode
{
    public function GetHelpText()
    {
        return "LAVA IS RISING!\nTo move, press a number and type a rhyming word.\nMOVE FAST! You can't hold on forever.";
    }

    function GetGripBonus()
    {
        return Mathf.Max( 0, 2 * (activeScore-1) );
    }

    public function Start()
    {
        super.Start();
        SetActiveEntry(null);
        game.words.Reset(999, 999);
        ClimberCamera.main.SetFollow(true);
    }

    public function Update()
    {
        super.Update();

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
                MovePlayer( game.climber.GetRow()-2, game.climber.GetCol(), 0 );
                game.GetComponent(Connectable).TriggerEvent("OnPlayerDrop");
            }
        }

    }

    public function GetGameOverText()
    {
        return "GAME OVER! Reached " + game.climber.transform.position.y.ToString("0.0") + " meters";
    }

    function OnInputEnter()
    {
        if( activeEntry == null )
            return;

        if( activeScore > 0.0 )
        {
            var doubleNbor = HexTiler.GetNbor( activeNbor.i, activeNbor.j, activeNborNum );

            MovePlayer( activeNbor.i, activeNbor.j, GetGripBonus() );
            game.GetComponent(Connectable).TriggerEvent("OnPlayerMove");
        }
        else
        {
            // play error sound, flash feedback msg
        }
    }
}

public class RaceMode extends GameMode
{
    public var goalHeight = 300.0;

    private var elapsedTime = 0.0;
    private var startHeight = 0.0;
    private var newRecord = false;

    public function GetHelpText()
    {
        return "Press a number\nthen type a rhyming word.\nReach the top ASAP!";
    }

    public function Start()
    {
        super.Start();
        SetActiveEntry(null);
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

    function OnInputEnter()
    {
        if( activeEntry == null )
            return;

        if( activeScore > 0.0 )
        {
            // do this before we clear the input on move
            usedWords.Add(game.inputMgr.GetInput());
            Debug.Log("adding "+game.inputMgr.GetInput());

            var doubleNbor = HexTiler.GetNbor( activeNbor.i, activeNbor.j, activeNborNum );

            if( GetIsDoubleMove() && ClimberGrid.mainTiler.GetTiles().IsValid(doubleNbor) )
            {
                MovePlayer( doubleNbor.i, doubleNbor.j, 0 );
            }
            else
            {
                MovePlayer( activeNbor.i, activeNbor.j, 0 );
            }
            game.GetComponent(Connectable).TriggerEvent("OnPlayerMove");
        }
        else
        {
            // play error sound, flash feedback msg
        }
    }

    public function Update()
    {
        super.Update();

        elapsedTime += Time.deltaTime;

        var ht = game.climber.transform.position.y - startHeight;
        game.stateOut.text = "HEIGHT: " + (ht/(goalHeight-startHeight)*100).ToString("0")+"%\n";
        game.stateOut.text += "TIME: " + GetTime().ToString("0.00") + " BEST: " + GetBestTime().ToString("0.00");
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

    public function GetGameOverText()
    {
        return "FINISHED!\nTIME: " + GetTime().ToString("0.00") + " seconds\n"+
            "BEST TIME: " + PlayerPrefs.GetFloat("bestRaceTime", 999.0).ToString("0.00")
            + (newRecord ? "\nNEW RECORD :D :D :D" : "");
    }

    public function GetIsDoubleMove()
    {
        return activeScore > 1.0;
    }
}
var raceMode = new RaceMode();

public class RelaxMode extends GameMode
{
    public var rowRadius = 4;
    public var colRadius = 1;
    private var score = 0.0;

    public function GetHelpText()
    {
        return "To move, press a number and type a rhyming word.\nBetter rhymes get more points";
    }

    public function Start()
    {
        super.Start();
        SetActiveEntry(null);
        score = 0;

        game.lava.Disable();
        game.climber.SetShowGripSecs(false);
        game.words.Reset( rowRadius, colRadius );
        ClimberCamera.main.SetFollow(false);
    }

    public function Update()
    {
        super.Update();
        game.centerText.text = "";
        game.stateOut.text = "Score: " + score.ToString("0.0");
    }

    function OnInputEnter()
    {
        if( activeEntry == null )
            return;

        if( activeScore > 0.0 )
        {
            var doubleNbor = HexTiler.GetNbor( activeNbor.i, activeNbor.j, activeNborNum );

            MovePlayer( activeNbor.i, activeNbor.j, 0 );
            OnPlayerMove();
            game.GetComponent(Connectable).TriggerEvent("OnPlayerMove");
        }
        else
        {
            // play error sound, flash feedback msg
        }
    }

    public function OnPlayerMove()
    {
        score += activeScore;
    }

    public function GetShouldReplaceWords() { return false; }
}
var relaxMode = new RelaxMode();

private var gameMode:GameMode = null;

function Awake()
{
    main = this;

    lava.gameObject.SetActive(false);
}

function Start()
{
    var inputEvents = inputMgr.GetComponent(Connectable);
    inputEvents.AddListener(this.gameObject, "OnInputEnter");
    inputEvents.AddListener(this.gameObject, "OnInputCharacter");
    inputEvents.AddListener(this.gameObject, "OnBackspace", "OnInputCharacter");

    centerText.material.color = Color(1,1,1);
    stateOut.material.color = Color(1,1,1);

    var answerDisplayObject = Utils.SpawnFromPrefab( answerDisplayPrefab );
    answerDisplayObject.SetActive(true);
    answerDisplayPrefab.SetActive(false);

    answerDisplay = answerDisplayObject.GetComponent(GUIText);
    answerDisplay.material.color = answerDisplayColor;

    var feedbackDisplayObj = Utils.SpawnFromPrefab( answerDisplayPrefab );
    feedbackDisplayObj.SetActive(true);
    answerDisplayPrefab.SetActive(false);

    feedbackDisplay = feedbackDisplayObj.GetComponent(GUIText);
    feedbackDisplay.material.color = answerDisplayColor;
}

function GetIsPlaying()
{
    return state == "playing";
}

function OnInputCharacter()
{
    if( gameMode != null )
        gameMode.OnInputCharacter();
}

function OnInputEnter()
{
    if( gameMode != null )
        gameMode.OnInputEnter();
}

function OnHitKillZone()
{
    GetComponent(Connectable).TriggerEvent("OnPlayerDie");
    TriggerGameOver();
}

function TriggerGameOver()
{
    if( state == "playing" )
    {
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
        lava.OnGameStart();
        ClimberGuy.main.OnGameStart();
        state = "playing";
        gameMode.Start();
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

        if( Input.GetKeyDown("r") && Application.isEditor )
        {
            PlayerPrefs.DeleteKey("bestRaceTime");
        }

        if( RhymeScorer.main.GetIsReady() )
        {
            centerText.text = "Press a number:\n"
                + "1. Relax Mode\n"
                + "2. Action Mode\n"
                + "3. Race Mode\n";

            if( Input.GetKeyDown("1") )
            {
                gameMode = relaxMode;
                state = "helpscreen";
            }
            else if( Input.GetKeyDown("2") )
            {
                gameMode = new ActionGameMode();
                state = "helpscreen";
            }
            else if( Input.GetKeyDown("3") )
            {
                gameMode = raceMode;
                state = "helpscreen";
            }

            if( gameMode != null )
                gameMode.SetGame(this);
        }
        else
        {
            centerText.text = "Please wait..";
        }

        stateOut.text = "";
        answerDisplay.text = "";
        feedbackDisplay.text = "";
    }
    else if( state == "helpscreen" )
    {
        stateOut.text = "";
        answerDisplay.text = "";
        feedbackDisplay.text = "";
        centerText.text = gameMode.GetHelpText() + "\n\nSPACE BAR TO START";

        if( Input.GetKeyDown("space") )
            StartPlaying();
    }
    else if( state == "playing" )
    {
        gameMode.Update();
    }
    else if( state == "gameover" )
    {
        stateOut.text = "";
        centerText.text = gameMode.GetGameOverText();
        centerText.text += "\n\nSPACE BAR TO RESTART";
        answerDisplay.text = "";
        feedbackDisplay.text = "";

        if( Input.GetKeyDown("space") )
            StartPlaying();
    }

}

function LateUpdate()
{
    if( state == "playing" )
        gameMode.LateUpdate();
}

function GetLastScore()
{
    return gameMode.GetLastScore();
}
