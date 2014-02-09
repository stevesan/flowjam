using UnityEngine;
using System.Collections.Generic;
using System.Collections;
using SteveSharp;

public class TowerPlayMode : MonoBehaviour
{
    public int wordLevel = 0;
    public int numWords = 3;
    public int numInitRows = 5;
    public GUIText wordPrefab;
    public GUIText answerDisplay;
    public GUIText feedbackDisplay;
    public GUIText scoreDisplay;
    public GUIText countdown;
    public TowerDisplay tower;
    public AudioClip letterDestroySound;
    public AudioClip extraLetterSound;
    public AudioClip riseSound;
    public AudioClip gameOverSound;

    public int difficulty = 0;
    public bool timedAdd = false;
    public bool addPerTurn = true;
    public bool addExtraLetters = false;
    public bool removeAllLetterInstances = false;
    public bool debugShowAnalysis = false;
    public bool addToLowest = true;

    public float rowPeriod = 5f;

    string playerInput;
    int score = 0;

    string state = "playing";

    float rowCountdown = 0f;

    List<string> words = new List<string>();
    List<GUIText> wordDisplays = new List<GUIText>();
    HashSet<string> usedWords = new HashSet<string>();

    public static int LowChar2Int( char c )
    {
        Utils.Assert( c >= 'a' && c <= 'z' );
        return (int)(c-'a');
    }

	// Use this for initialization
	void Start()
    {
        for( int i = 0; i < numWords; i++ )
        {
            GUIText word = Utility.Instantiate(
                    wordPrefab.gameObject,
                    wordPrefab.transform.position,
                    transform ).GetComponent<GUIText>();
            Vector2 ofs = word.pixelOffset;
            ofs.y -= i*30;
            word.pixelOffset = ofs;
            wordDisplays.Add(word);
        }

        Reset();
	}

    void Reset()
    {
        usedWords.Clear();
        words.Clear();

        for( int i = 0; i < numWords; i++ )
        {
            string word = RhymeScorer.main.GetRandomPromptWord(wordLevel);
            words.Add(word);
            wordDisplays[i].text = words[i];
        }

        playerInput = "";
        score = 0;

        tower.Reset( 3+difficulty, 10 );
        for( int i = 0; i < numInitRows; i++ )
            tower.PushRow();

        rowCountdown = rowPeriod;

        state = "playing";
    }

    IEnumerator OnPlayerEnter()
    {
        state = "animating";

        bool gotSome = false;

        if( !usedWords.Contains(playerInput) )
        {
            for( int i = 0; i < words.Count; i++ )
            {
                string word = words[i];
                if( RhymeScorer.main.ScoreStrings( playerInput, word ) > 0.0f )
                {
                    words[i] = RhymeScorer.main.GetRandomPromptWord(wordLevel);
                    gotSome = true;
                }
            }
        }

        if( gotSome )
        {
            usedWords.Add(playerInput);
            string oldInput = playerInput;
            playerInput = "";

            List<char> extraLetters = new List<char>();
            if( addExtraLetters )
            {
                foreach( char c in oldInput )
                {
                    if( !tower.Contains(c) )
                        extraLetters.Add(c);
                }
            }

            while(true)
            {
                bool done = true;

                for( int x = 0; x < tower.width; x++ )
                for( int y = 0; y < tower.height; y++ )
                {
                    if( tower.IsMarked(x, y) )
                    {
                        done = false;
                        tower.ClearBlock(x,y);
                        score++;

                        AudioSource.PlayClipAtPoint( letterDestroySound, transform.position );
                        yield return new WaitForSeconds(0.2f);
                    }
                }

                if( done )
                    break;
            }

            /* Old code where each letter removes all instances in the tower
            // remove letters from tower
            HashSet<char> inputChars = new HashSet<char>();
            foreach( char c in oldInput )
                inputChars.Add(System.Char.ToLower(c));

            // Need multiple passes..
            bool done = false;
            while(!done)
            {
                done = true;
                for( int x = 0; x < tower.width; x++ )
                for( int y = 0; y < tower.height; y++ )
                {
                    if( inputChars.Contains(tower.GetLower(x,y)) )
                    {
                        done = false;
                        tower.ClearBlock(x,y);
                        score++;

                        yield return new WaitForSeconds(0.5f);
                    }
                }
            }
            */

            if( addExtraLetters )
            {
                foreach( char c in extraLetters )
                {
                    int col = addToLowest ? tower.GetLowestColumn() : tower.GetHighestColumn();
                    tower.PushBlock( col, c );
                    AudioSource.PlayClipAtPoint( extraLetterSound, transform.position );
                    yield return new WaitForSeconds(0.2f);
                }
            }

            if( addPerTurn )
            {
                tower.PushRow();
            }

            if( tower.TopRowOccupied() )
            {
                AudioSource.PlayClipAtPoint( gameOverSound, transform.position );
                state = "gameover";
            }
            else
            {
                if( addPerTurn )
                    AudioSource.PlayClipAtPoint( riseSound, transform.position );
                state = "playing";
            }
        }
        else
            state = "playing";
    }

    void OnPlayerEscape()
    {
        playerInput = "";
    }
    
    void HandleInput()
    {
        //----------------------------------------
        //  Process input text
        //----------------------------------------
        foreach( char c in Input.inputString )
        {
            // Backspace - Remove the last character
            if( c == '\b' )
            {
                if( playerInput.Length > 0 )
                {
                    playerInput = playerInput.Substring(0, playerInput.Length - 1);
                }
            }
            else if( c >= 'a' && c <= 'z' )
                playerInput += c;
        }

    }

    void UpdateInputAndWordList()
    {
        for( int i = 0; i < words.Count; i++ )
        {
            string word = words[i];
            wordDisplays[i].text = word;
        }

        bool anyAttackable = false;

        if( playerInput == "" )
            feedbackDisplay.text = "Type:";
        else if( usedWords.Contains(playerInput) )
            feedbackDisplay.text = "Already used!";
        else if( playerInput.Length > 1 && !RhymeScorer.main.IsValidAnswer(playerInput) )
            feedbackDisplay.text = "Not a word!";
        else
        {
            // Entered a valid word..

            // highlight vulnerable words
            bool anyTooSimilar = false;
            if( RhymeScorer.main.IsValidAnswer( playerInput ) )
            {
                for( int i = 0; i < words.Count; i++ )
                {
                    string word = words[i];
                    if( RhymeScorer.main.ScoreStrings( playerInput, word ) > 0 )
                    {
                        wordDisplays[i].text = word + " <--";
                        anyAttackable = true;
                    }
                    else if( RhymeScorer.main.IsTooSimilar(playerInput, word ) )
                    {
                        anyTooSimilar = true;
                    }
                }
            }

            if( anyAttackable )
                feedbackDisplay.text = "ENTER TO ATTACK!";
            else if( anyTooSimilar )
                feedbackDisplay.text = "Too similar!";
            else
                feedbackDisplay.text = "Does not rhyme..";
        }

        tower.attackOK = anyAttackable;
    }
	
	// Update is called once per frame
	void Update()
    {
        scoreDisplay.text = "SCORE: "+score;
        answerDisplay.text = "["+playerInput+"]";

        if( state == "playing" )
        {
            // debug
            if( Application.isEditor && Input.GetKeyDown(KeyCode.Equals) )
                debugShowAnalysis = !debugShowAnalysis;

            HandleInput();

            //----------------------------------------
            //  Process other keys
            //----------------------------------------
            if( Input.GetKeyDown(KeyCode.Return) )
            {
                StartCoroutine(OnPlayerEnter());
            }
            else if( Input.GetKeyDown(KeyCode.Escape) )
            {
                OnPlayerEscape();
            }
            else
            {
                UpdateInputAndWordList();

                //----------------------------------------
                //  Highlight letters in tower that are vulnerable
                //----------------------------------------
                tower.ClearHighlights();

                foreach( char c in playerInput )
                {
                    if( removeAllLetterInstances )
                    {
                        for( int x = 0; x < tower.width; x++ )
                        for( int y = 0; y < tower.height; y++ )
                        {
                            if( tower.GetLower(x,y) == System.Char.ToLower(c) )
                                tower.Mark(x,y, true);
                        }
                    }
                    else
                    {
                        int x = tower.GetHighestColumnContaining(c);
                        if( x != -1 )
                        {
                            int y = tower.FindUnmarkedInColumn( x, c );
                            tower.Mark( x, y, true );
                        }
                    }
                }
            }

            //----------------------------------------
            //  Timed rows
            //----------------------------------------
            if( timedAdd )
            {
                rowCountdown -= Time.deltaTime;
                if( rowCountdown < 0 )
                {
                    tower.PushRow();
                    if( tower.TopRowOccupied() )
                    {
                        AudioSource.PlayClipAtPoint( gameOverSound, transform.position );
                        state = "gameover";
                    }
                    else
                        AudioSource.PlayClipAtPoint( riseSound, transform.position );
                    rowCountdown = rowPeriod;
                }
                countdown.text = ""+Mathf.CeilToInt(rowCountdown);
            }
            else
                countdown.text = "";
        }
        else if( state == "animating" )
        {
            HandleInput();
            UpdateInputAndWordList();
        }
        else if( state == "gameover" )
        {
            scoreDisplay.text = "SCORE: "+score;
            answerDisplay.text = "TEH GAME OVER\nSpace to restart";

            if( Input.GetKeyDown(KeyCode.Space) )
                Reset();
        }
	}

    void OnGUI()
    {
        if( debugShowAnalysis )
        {
            GUILayout.BeginArea( new Rect(Screen.width*0.75f, 0, Screen.width*0.25f, Screen.height) );
            RhymeTester.PhraseAnalysisGUI(words[0]);
            RhymeTester.PhraseAnalysisGUI(playerInput);
            GUILayout.EndArea();
        }
    }
}
