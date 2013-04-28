#pragma strict

//----------------------------------------
//  Constants
//----------------------------------------
static var s_useIntraWordCombos = false;

//----------------------------------------
//  Statics
//----------------------------------------
static var instance:GameController = null;

//----------------------------------------
//  Editor inputs
//----------------------------------------
var promptDisplay:GUIText;
var answerDisplay:GUIText;
var feedbackDisplay:GUIText;

//----------------------------------------
//  Resources
//----------------------------------------
var typeSound:AudioClip;
var eraseSound:AudioClip;
var bonus2sound:AudioClip[];
var comboBreakSound:AudioClip;

//----------------------------------------
//  Game state
//----------------------------------------
private var totalScore = 0.0;
private var comboCount = 0;
private var answerWord = '';

//----------------------------------------
//  Animation state
//----------------------------------------

function GetScore() { return totalScore; }
function GetComboCount() { return comboCount; }

function Awake()
{
    Utils.Assert(instance == null);
    instance = this;
}

function Start()
{
    totalScore = 0.0;
    comboCount = 0;
    PresentNewWord();
    GetComponent(Connectable).TriggerEvent("OnRoundStart");
}

class ScoreInfo
{
    var bonus:int;
    var score:float;
};

private function ScoreWords(a:String, b:String)
{
    var raw = RhymeScorer.Get().ScoreWords(a,b);

    // We adjust the score to reflect the fact that rhyming syllables gets much harder they more you already have
    // so, map the score to an x^2 curve, sort of..
    var info = new ScoreInfo();
    info.bonus = Mathf.Floor(raw)-1;
    info.score = raw + info.bonus;
    return info;
}

private function PresentNewWord()
{
    promptDisplay.text = RhymeScorer.Get().GetRandomPromptWord();
    answerWord = '';
    feedbackDisplay.text = 'ENTER A WORD THAT RHYMES!!\nOr blank to skip';
    feedbackDisplay.material.color = Color(1.0, 1.0, 1.0, 1.0);
    UpdateAnswerDisplay();
}

private function UpdateAnswerDisplay()
{
    answerDisplay.text = '{'+answerWord+'}';
}

function IsTooSimilar( prompt:String, answer:String )
{
    return RhymeScorer.Get().IsTooSimilar(prompt, answer);
}

private function UpdateAllDisplays()
{
    if( RhymeScorer.Get().GetIsWord( answerWord ) )
    {
        if( IsTooSimilar( promptDisplay.text, answerWord ) )
        {
            feedbackDisplay.text = 'TOO SIMILAR. LAME!!';
            feedbackDisplay.material.color = Color(1.0, 1.0, 0, 1.0);
        }
        else
        {
            var info = ScoreWords( answerWord, promptDisplay.text );
            var score = info.score;
            if( score > 0 )
            {
                feedbackDisplay.material.color = Color(0.0, 1.0, 0, 1.0);

                if( info.bonus >= 3 )
                    feedbackDisplay.text = 'OMG WTF BBQ';
                else if( info.bonus >= 2 )
                    feedbackDisplay.text = 'EXCELLENT!';
                else if( info.bonus >= 1 )
                    feedbackDisplay.text = 'GREAT!';
                else if( info.score > 0 )
                    feedbackDisplay.text = 'GOOD';

                feedbackDisplay.text += ' +' +score.ToString('0.0');

                if( comboCount > 1 )
                    feedbackDisplay.text += ' x '+comboCount+' combo = '+(score*comboCount);
            }
            else
            {
                feedbackDisplay.text = '+0';
                feedbackDisplay.material.color = Color(1.0, 1.0, 0, 1.0);
            }

        }
    }
    else
    {
        feedbackDisplay.text = 'NOT A WORD YO!';
        feedbackDisplay.material.color = Color(1.0, 1.0, 0, 1.0);
    }

    UpdateAnswerDisplay();
}


function Update()
{
    promptDisplay.transform.position.x = 0.5 - Mathf.Sin(2*Mathf.PI*1.0*Time.time)*0.010;
    answerDisplay.material.color = Color(0.5, 1.0, 0.5, 1.0) + Utils.RandomColor();

    var soundToPlay:AudioClip = null;

    for( var c:char in Input.inputString )
    {
        // Backspace - Remove the last character
        if( c == "\b"[0] )
        {
            if( answerWord.Length != 0 )
            {
                answerWord = answerWord.Substring(0, answerWord.Length - 1);
                UpdateAllDisplays();
                soundToPlay = eraseSound;
            }
            else
            {
                //soundToPlay = 'error';
            }
        }
        else if( c == "\n"[0] || c == "\r"[0] ) // "\n" for Mac, "\r" for windows.
        {
            var info = ScoreWords( answerWord, promptDisplay.text );
            var score = info.score;
            totalScore += Mathf.Max(1, comboCount)*score;


            if( score > 0 )
            {
                if( s_useIntraWordCombos )
                    comboCount++;
                GetComponent(Connectable).TriggerEvent("OnRhymeSuccess");

                var soundId = Mathf.Min( bonus2sound.length-1, info.bonus );
                soundToPlay = bonus2sound[soundId];
            }
            else
            {
                if( comboCount > 0 )
                {
                    GetComponent(Connectable).TriggerEvent("OnComboBreak");
                    soundToPlay = comboBreakSound;
                }
                comboCount = 0;
                GetComponent(Connectable).TriggerEvent("OnRhymeFail");

                // TODO - play a fail sound?
                soundToPlay = typeSound;
            }

            PresentNewWord();
        }
        else
        {
            answerWord += c;
            UpdateAllDisplays();
            soundToPlay = typeSound;
        }
    }

    if( soundToPlay != null )
        AudioSource.PlayClipAtPoint( soundToPlay, Camera.main.transform.position );

}
