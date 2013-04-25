#pragma strict

var wordDisplay:GUIText;
var inputDisplay:GUIText;
var scoreDisplay:GUIText;
var scoreFeedbackDisplay:GUIText;

var totalScore = 0.0;

function Start()
{
    scoreDisplay.text = '0';
    PresentNewWord();
}

private function PresentNewWord()
{
    wordDisplay.text = RhymeScorer.Get().GetRandomWord();
    inputDisplay.text = '';
    scoreFeedbackDisplay.text = 'TYPE A RHYME!!';
}

private function OnInputChanged()
{
    if( RhymeScorer.Get().GetIsWord( inputDisplay.text ) )
    {
        var score = RhymeScorer.Get().ScoreWords( inputDisplay.text, wordDisplay.text );
        scoreFeedbackDisplay.text = ''+score;
    }
    else
    {
        scoreFeedbackDisplay.text = 'NOT A WORD YO!';
    }
}

function Update()
{
    var score = 0.0;

    for( var c:char in Input.inputString )
    {
        // Backspace - Remove the last character
        if( c == "\b"[0] )
        {
            if( inputDisplay.text.Length != 0 )
            {
                inputDisplay.text = inputDisplay.text.Substring(0, inputDisplay.text.Length - 1);
                OnInputChanged();
            }
        }
        else if( c == "\n"[0] || c == "\r"[0] ) // "\n" for Mac, "\r" for windows.
        {
            if( RhymeScorer.Get().GetIsWord( inputDisplay.text ) )
            {
                score = RhymeScorer.Get().ScoreWords( inputDisplay.text, wordDisplay.text );
                totalScore += score;
                scoreDisplay.text = ""+totalScore;
            }

            PresentNewWord();
        }
        else
        {
            inputDisplay.text += c;
            OnInputChanged();
        }
    }
}
