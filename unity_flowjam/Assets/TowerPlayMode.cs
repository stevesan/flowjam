using UnityEngine;
using System.Collections.Generic;
using System.Collections;
using SteveSharp;

public class TowerPlayMode : MonoBehaviour
{
    public int difficulty = 0;
    public int numWords = 3;
    public int numInitRows = 5;
    public GUIText wordPrefab;
    public GUIText playerInputDisplay;
    public GUIText scoreDisplay;
    public TowerDisplay tower;
    public AudioClip letterDestroySound;
    public AudioClip riseSound;
    public AudioClip gameOverSound;

    string playerInput;
    int score = 0;

    string state = "playing";

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
            string word = RhymeScorer.main.GetRandomPromptWord(difficulty);
            words.Add(word);
            wordDisplays[i].text = words[i];
        }

        playerInput = "";
        score = 0;

        tower.Reset();
        for( int i = 0; i < numInitRows; i++ )
            tower.PushRow();

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
                if( RhymeScorer.main.ScoreStrings( playerInput, word ) >= 1.0f )
                {
                    words[i] = RhymeScorer.main.GetRandomPromptWord(difficulty);
                    gotSome = true;
                }
            }
        }

        if( gotSome )
        {
            usedWords.Add(playerInput);

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
                        yield return new WaitForSeconds(0.4f);
                    }
                }

                if( done )
                    break;
            }

            /* Old code where each letter removes all instances in the tower
            // remove letters from tower
            HashSet<char> inputChars = new HashSet<char>();
            foreach( char c in playerInput )
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

            if( tower.TopRowOccupied() )
            {
                AudioSource.PlayClipAtPoint( gameOverSound, transform.position );
                state = "gameover";
            }
            else
            {
                AudioSource.PlayClipAtPoint( riseSound, transform.position );
                tower.PushRow();
                playerInput = "";
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
	
	// Update is called once per frame
	void Update()
    {
        if( state == "playing" )
        {
            HandleInput();

            scoreDisplay.text = "SCORE: "+score;

            playerInputDisplay.text = "["+playerInput+"]";

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
                if( usedWords.Contains(playerInput) )
                    playerInputDisplay.text += "\nused!";
                else if( playerInput.Length > 1 && !RhymeScorer.main.IsValidAnswer(playerInput) )
                    playerInputDisplay.text += "\nnot a word!";

                for( int i = 0; i < words.Count; i++ )
                {
                    string word = words[i];
                    wordDisplays[i].text = word;
                }

                // highlight vulnerable words
                if( RhymeScorer.main.IsValidAnswer( playerInput ) )
                {
                    for( int i = 0; i < words.Count; i++ )
                    {
                        string word = words[i];
                        if( RhymeScorer.main.ScoreStrings( playerInput, word ) > 0 )
                            wordDisplays[i].text = word + " <-- ENTER TO ATTACK";
                        else if( RhymeScorer.main.IsTooSimilar(playerInput, word ) )
                            wordDisplays[i].text = word + " <-- TOO SIMILAR";
                    }
                }

                //----------------------------------------
                //  Highlight letters in tower that are vulnerable
                //----------------------------------------
                tower.ClearHighlights();
                foreach( char c in playerInput )
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
        else if( state == "gameover" )
        {
            scoreDisplay.text = "SCORE: "+score;
            playerInputDisplay.text = "TEH GAME OVER\npress space to try again";

            if( Input.GetKeyDown(KeyCode.Space) )
                Reset();
        }
	}
}
