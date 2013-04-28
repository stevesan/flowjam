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
var scoreSound:AudioClip;
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
    var numSyls:int;
    var score:float;
};

private function ScoreWords(a:String, b:String)
{
    var raw = RhymeScorer.Get().ScoreWords(a,b);

    // We adjust the score to reflect the fact that rhyming syllables gets much harder they more you already have
    // so, map the score to an x^2 curve, sort of
    var rv = new ScoreInfo();
    rv.numSyls = Mathf.Floor(raw);
    rv.score = raw * rv.numSyls;
    return rv;
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
            //feedbackDisplay.text = info.numSyls + ' syllables = '+score+ ' points';
            if( score > 0 )
            {
                feedbackDisplay.material.color = Color(0.0, 1.0, 0, 1.0);

                if( info.numSyls >= 4 )
                    feedbackDisplay.text = 'GOD-LIKE :O';
                else if( info.numSyls >= 3 )
                    feedbackDisplay.text = 'EXCELLENT!';
                else if( info.numSyls >= 2 )
                    feedbackDisplay.text = 'GREAT!';
                else if( info.numSyls >= 1 )
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

    var inputSoundClip:AudioClip = null;

    for( var c:char in Input.inputString )
    {
        // Backspace - Remove the last character
        if( c == "\b"[0] )
        {
            if( answerWord.Length != 0 )
            {
                answerWord = answerWord.Substring(0, answerWord.Length - 1);
                UpdateAllDisplays();
                inputSoundClip = eraseSound;
            }
            else
            {
                //soundToPlay = 'error';
            }
        }
        else if( c == "\n"[0] || c == "\r"[0] ) // "\n" for Mac, "\r" for windows.
        {
            if( RhymeScorer.Get().GetIsWord( answerWord ) )
            {
                var info = ScoreWords( answerWord, promptDisplay.text );
                var score = info.score;
                totalScore += Mathf.Max(1, comboCount)*score;

                if( score > 0 )
                {
                    if( s_useIntraWordCombos )
                        comboCount++;
                    GetComponent(Connectable).TriggerEvent("OnRhymeSuccess");
                    inputSoundClip = scoreSound;
                }
                else
                {
                    if( comboCount > 0 )
                    {
                        GetComponent(Connectable).TriggerEvent("OnComboBreak");
                        inputSoundClip = comboBreakSound;
                    }
                    comboCount = 0;
                    GetComponent(Connectable).TriggerEvent("OnRhymeFail");
                }
            }
            else
            {
                if( comboCount > 0 )
                {
                    GetComponent(Connectable).TriggerEvent("OnComboBreak");
                    inputSoundClip = comboBreakSound;
                }
                comboCount = 0;
                GetComponent(Connectable).TriggerEvent("OnRhymeFail");
            }

            PresentNewWord();
        }
        else
        {
            answerWord += c;
            UpdateAllDisplays();

            inputSoundClip = typeSound;
        }
    }

    if( inputSoundClip != null )
        AudioSource.PlayClipAtPoint( inputSoundClip, Camera.main.transform.position );

}
