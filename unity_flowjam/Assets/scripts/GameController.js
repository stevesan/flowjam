#pragma strict

//----------------------------------------
//  Editor inputs
//----------------------------------------
var wordDisplay:GUIText;
var inputDisplay:GUIText;
var scoreDisplay:GUIText;
var scoreFeedbackDisplay:GUIText;

//----------------------------------------
//  Resources
//----------------------------------------
var typeSound:AudioClip;

//----------------------------------------
//  Game state
//----------------------------------------
private var totalScore = 0.0;
private var answerWord = '';

//----------------------------------------
//  Animation state
//----------------------------------------
private var scoreFlicker = new SlicedAnimation();

function Start()
{
    scoreDisplay.text = 'SCORE: 0';
    PresentNewWord();

    scoreFlicker.Play();
}

private function PresentNewWord()
{
    wordDisplay.text = RhymeScorer.Get().GetRandomPromptWord();
    answerWord = '';
    scoreFeedbackDisplay.text = 'ENTER A WORD THAT RHYMES!!\nOr blank to skip';
    scoreFeedbackDisplay.material.color = Color(1.0, 1.0, 1.0, 1.0);
    UpdateAnswerDisplay();
}

private function UpdateAnswerDisplay()
{
    inputDisplay.text = answerWord + '|';
}

function IsTooSimilar( prompt:String, answer:String )
{
    return RhymeScorer.Get().IsTooSimilar(prompt, answer);
}

private function UpdateAllDisplays()
{
    if( RhymeScorer.Get().GetIsWord( answerWord ) )
    {
        if( IsTooSimilar( wordDisplay.text, answerWord ) )
        {
            scoreFeedbackDisplay.text = 'TOO SIMILAR. LAME!!';
            scoreFeedbackDisplay.material.color = Color(1.0, 1.0, 0, 1.0);
        }
        else
        {
            var score = RhymeScorer.Get().ScoreWords( answerWord, wordDisplay.text );
            scoreFeedbackDisplay.text = '+'+score;
            scoreFeedbackDisplay.material.color = Color(0.0, 1.0, 0, 1.0);
        }
    }
    else
    {
        scoreFeedbackDisplay.text = 'NOT A WORD YO!';
        scoreFeedbackDisplay.material.color = Color(1.0, 1.0, 0, 1.0);
    }

    UpdateAnswerDisplay();
}


function Update()
{
    scoreFlicker.BeginUpdate();
    if( scoreFlicker.CheckSlice(0.5) )
    {
        if( scoreFlicker.JustStartedSlice() )
            scoreDisplay.material.color = Color(1.0, 0.0, 0.0, 1.0) + Utils.RandomColor();
        scoreDisplay.material.color.a = 1.0-scoreFlicker.GetSliceFraction()*0.2;
    }
    else
        // loop
        scoreFlicker.Play();
    scoreFlicker.EndUpdate();

    scoreDisplay.transform.position.x = 0.5 + Mathf.Sin(2*Mathf.PI*1.0*Time.time)*0.010;
    // This is nauseating..
    //scoreDisplay.transform.position.x = 0.5 + Mathf.Lerp(-0.003, 0.003, Random.value);
    //scoreDisplay.transform.position.y = 0.9 + Mathf.Lerp(-0.003, 0.003, Random.value);

    wordDisplay.transform.position.x = 0.5 - Mathf.Sin(2*Mathf.PI*1.0*Time.time)*0.010;

    inputDisplay.material.color = Color(0.5, 1.0, 0.5, 1.0) + Utils.RandomColor();

    for( var c:char in Input.inputString )
    {
        // Backspace - Remove the last character
        if( c == "\b"[0] )
        {
            if( answerWord.Length != 0 )
            {
                answerWord = answerWord.Substring(0, answerWord.Length - 1);
                UpdateAllDisplays();
            }
        }
        else if( c == "\n"[0] || c == "\r"[0] ) // "\n" for Mac, "\r" for windows.
        {
            if( RhymeScorer.Get().GetIsWord( answerWord ) )
            {
                var score = RhymeScorer.Get().ScoreWords( answerWord, wordDisplay.text );
                totalScore += score;
                scoreDisplay.text = "SCORE: "+totalScore;
            }

            PresentNewWord();
        }
        else
        {
            answerWord += c;
            UpdateAllDisplays();
        }
    }

    if( Input.inputString.length > 0 )
    {
        AudioSource.PlayClipAtPoint(typeSound, Camera.main.transform.position);
    }
}
