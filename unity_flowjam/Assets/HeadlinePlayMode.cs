using UnityEngine;
using System.Collections.Generic;
using SteveSharp;

public class HeadlinePlayMode : MonoBehaviour
{
    public int difficulty = 0;
    public int numWords = 10;
    public GUIText wordPrefab;
    public GUIText playerInputDisplay;
    public GUIText inventoryItemPrefab;
    public GUIText scoreDisplay;

    string playerInput;
    int score = 0;

    bool inputEnabled = true;

    class InventoryItem
    {
        public int count;
        public char letter;
        public GUIText display;

        public void Reset()
        {
            count = 1;
        }

        public void Add(int delta)
        {
            count += delta;
        }
    }
    Dictionary<char, InventoryItem> inventory = new Dictionary<char, InventoryItem>();

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

        Vector2 ofs2 = new Vector2(0,0);
        for( char c = 'a'; c <= 'z'; c++ )
        {
            InventoryItem item = new InventoryItem();
            item.count = 1;
            item.letter = c;
            item.display = Utility.Instantiate(
                    inventoryItemPrefab.gameObject,
                    inventoryItemPrefab.transform.position,
                    transform ).GetComponent<GUIText>();
            item.display.pixelOffset += ofs2;

            inventory[c] = item;

            ofs2.x += 35;
            if( (int)(c-'a'+1) % 5 == 0 )
            {
                ofs2.x = 0;
                ofs2.y -= 45;
            }
        }

        Reset();
	}

    void Reset()
    {
        for( char c = 'a'; c <= 'z'; c++ )
            inventory[c].Reset();

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
    }

    public bool CanAffordWord( string word )
    {
        // count all letters in word
        int[] char2count = new int[26];
        foreach( char c in word.ToLower() )
        {
            if( c >= 'a' && c <= 'z' )
            {
                char2count[ LowChar2Int(c) ]++;
            }
        }

        foreach( char c in word.ToLower() )
        {
            if( inventory[c].count < char2count[ LowChar2Int(c) ] )
                return false;
        }

        return true;
    }

    void UpdateInventoryDisplay()
    {
        int count = 0;
        foreach( char c in inventory.Keys )
        {
            InventoryItem item = inventory[c];
            item.display.text = System.Char.ToUpper(item.letter)+""+item.count;

            if( item.count < 1 )
                item.display.color = Color.red;
            else if( item.count < 3 )
                item.display.color = Color.yellow;
            else
                item.display.color = Color.green;
        }
    }

    void OnPlayerEnter()
    {
        bool gotSome = false;

        if( !usedWords.Contains(playerInput) )
        {
            for( int i = 0; i < words.Count; i++ )
            {
                string word = words[i];
                if( RhymeScorer.main.ScoreStrings( playerInput, word ) >= 1.0f )
                {
                    // give those letters
                    foreach( char c in word )
                        inventory[c].Add(1);

                    // reset the word
                    words[i] = RhymeScorer.main.GetRandomPromptWord(difficulty);

                    gotSome = true;
                    score++;
                }
            }
        }

        if( gotSome )
        {
            usedWords.Add(playerInput);
            playerInput = "";
        }
    }

    void OnPlayerEscape()
    {
        // refund letters
        foreach( char c in playerInput )
            inventory[c].Add(1);

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
                    // refund
                    inventory[ playerInput[ playerInput.Length-1 ] ].Add(1);

                    playerInput = playerInput.Substring(0, playerInput.Length - 1);
                }
            }
            else if( (c >= "a"[0] && c <= "z"[0])
                    || (c >= "A"[0] && c <= "Z"[0])
                    || c == " "[0] )
            {
                char lc = System.Char.ToLower(c);
                if( inventory[lc].count > 0 )
                {
                    playerInput += lc;
                    inventory[lc].Add(-1);
                }
            }
        }

        //----------------------------------------
        //  Process other keys
        //----------------------------------------
        if( Input.GetKeyDown(KeyCode.Return) )
        {
            OnPlayerEnter();
        }
        else if( Input.GetKeyDown(KeyCode.Escape) )
        {
            OnPlayerEscape();
        }
    }
	
	// Update is called once per frame
	void Update()
    {
        UpdateInventoryDisplay();
        HandleInput();

        scoreDisplay.text = "SCORE: "+score;

        playerInputDisplay.text = "["+playerInput+"]";

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
                    wordDisplays[i].text = word + " !!!";
            }
        }

	}
}
