
using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using SteveSharp;

public class TopdownGame : MonoBehaviour
{
    public TopdownPlayer player;
    public Bullet bulletPrefab;

    enum State { Loading, Moving, Typing };
    State state = State.Loading;

    public GameObject typeModeObjects;
    public GUIText typeModeText;
    public GUIText typeModeFeedback;
    public GUIText inventoryDisplay;
    public GUIText healthText;
    public AudioClip startTypingClip;
    public AudioClip fireBulletClip;
    public AudioClip cancelClip;
    public LevelSpawner levelSpawner;
    public LineRenderer linePrefab;

    HashSet<string> usedWords = new HashSet<string>();

    HashSet<LineRenderer> targetLines = new HashSet<LineRenderer>();

    Dictionary<char, int> inventory = new Dictionary<char, int>();

    List<char> vowels = new List<char>();

    string rawAttack = "";

    bool IsLimitedLetter( char c )
    {
        return true;
    }

    void Awake()
    {
        typeModeObjects.SetActive(false);
        bulletPrefab.gameObject.SetActive(false);
        inventoryDisplay.gameObject.SetActive(false);

        for( char c = 'a'; c <= 'z'; c++ )
        {
            if( IsLimitedLetter(c) )
                inventory[c] = 1;
        }
    }

    void Reset()
    {
        usedWords.Clear();
        typeModeObjects.SetActive(false);
        bulletPrefab.gameObject.SetActive(false);

        if( state != State.Loading )
            state = State.Moving;
    }

    void Start()
    {
        Reset();
    }

    public TopdownPlayer GetPlayer()
    {
        return player;
    }

    void EnterTypingMode()
    {
        player.respondToInput = false;  
        state = State.Typing;
        typeModeObjects.SetActive(true);
        typeModeText.text = "TYPE!";
        rawAttack = "";
        typeModeFeedback.text = "";
        AudioSource.PlayClipAtPoint(startTypingClip, Camera.main.transform.position);
    }

    void ExitTypingMode(bool attack)
    {
        player.respondToInput = true;  
        state = State.Moving;
        typeModeObjects.SetActive(false);

        bool bulletsFired = false;

        // gather enemies within radius
        // damage them if their word rhymes with this one
        // if any damaged, put word in cooldown queue
        HashSet<Attackable> targets = player.GetVisibility().GetActiveTargets();
        foreach( Attackable target in targets )
        {
            if( target == null )
                continue;

            if( attack && CanAttackTarget( target ) )
            {
                Vector3 toTarget = target.transform.position - player.transform.position;
                Bullet bullet = Utility.MyInstantiate<Bullet>(bulletPrefab, player.transform.position );
                bullet.Init(toTarget.normalized, rawAttack, this);
                bulletsFired = true;

            }
            target.OnIsNotInDanger();
        }

        if( bulletsFired )
        {
            AudioSource.PlayClipAtPoint(fireBulletClip, player.transform.position);
            usedWords.Add( rawAttack );

        }
        else
        {
            // refund letters
            foreach( char c in rawAttack )
            {
                if( IsLimitedLetter(c) )
                    inventory[c]++;
            }

            AudioSource.PlayClipAtPoint(cancelClip, player.transform.position);
        }
    }

    public bool IsEffectiveAgainst( string attackString, string targetWord )
    {
        if( !RhymeScorer.main.IsValidAnswer( attackString ) )
            return false;

        if( RhymeScorer.main.IsTooSimilar( attackString, targetWord ) )
        {
            return false;
        }

        //if( RhymeScorer.main.ScoreStrings( attackString, targetWord ) == 0 )
            //return false;

        if( !RhymeScorer.main.AllNucleiiCoverExists( attackString, targetWord ) )
            return false;

        return true;
    }

    bool CanAttackTarget( Attackable target )
    {
        if( target == null )
            return false;

        return IsEffectiveAgainst( rawAttack, target.GetWord() );
    }

    void UpdateHealth()
    {
        healthText.text = "";
        for( int i = 0; i < player.GetHealth(); i++ )
            healthText.text += "=";
    }

    void UpdateInventory()
    {
        inventoryDisplay.text = "";
        foreach( char c in inventory.Keys )
            inventoryDisplay.text += System.Char.ToUpper(c)+"" +inventory[c]+ " ";
    }

    void Update()
    {
        if( state == State.Loading )
        {
            if( RhymeScorer.main.GetIsReady() )
            {
                state = State.Moving;
                levelSpawner.Spawn();
                player.transform.position = levelSpawner.GetPlayerStart();
                inventoryDisplay.gameObject.SetActive(true);
            }
        }
        else if( state == State.Moving )
        {
            UpdateHealth();
            UpdateInventory();

            if( Input.GetKeyDown(KeyCode.Return) )
            {
                EnterTypingMode();
            }
        }
        else if( state == State.Typing )
        {
            UpdateHealth();
            UpdateInventory();

            foreach( char c in Input.inputString )
            {
                // Backspace - Remove the last character
                if( c == '\b' )
                {
                    if( rawAttack.Length > 0 )
                    {
                        // refund
                        inventory[ rawAttack[ rawAttack.Length-1 ] ]++;

                        rawAttack = rawAttack.Substring(0, rawAttack.Length - 1);
                    }
                }
                else if( (c >= "a"[0] && c <= "z"[0])
                        || (c >= "A"[0] && c <= "Z"[0])
                        || c == " "[0] )
                {
                    char lc = System.Char.ToLower(c);
                    if( IsLimitedLetter(lc) )
                    {
                        if( inventory[lc] > 0 )
                        {
                            rawAttack += lc;
                            inventory[lc]--;
                        }
                        else
                            Debug.Log("out of letter "+c);
                    }
                    else
                        rawAttack += lc;
                }
            }

            if( Input.GetKeyDown(KeyCode.Return) )
            {
                ExitTypingMode( RhymeScorer.main.IsValidAnswer(rawAttack) );
            }
            else if( Input.GetKeyDown(KeyCode.Escape) )
            {
                ExitTypingMode( false );
            }
            else
            {
                typeModeText.text = "["+rawAttack+"]";

                if( rawAttack.Length == 0 )
                {
                    typeModeText.color = Color.white;
                    typeModeText.text = "type!";
                    typeModeFeedback.text = "";
                    typeModeFeedback.color = Color.white;
                }
                else if( RhymeScorer.main.IsValidAnswer( rawAttack ) )
                {
                    // gather enemies within radius
                    // highlight them if their word rhymes with this one
                    HashSet<Attackable> targets = player.GetVisibility().GetActiveTargets();
                    bool canAttackAny = false;
                    foreach( Attackable target in targets )
                    {
                        if( target == null )
                            continue;

                        if( CanAttackTarget(target) )
                        {
                            canAttackAny = true;
                            target.OnIsInDanger();
                            ShowLine(target);
                        }
                        else
                            target.OnIsNotInDanger();
                    }

                    if( canAttackAny )
                    {
                        typeModeText.color = Color.red;
                        typeModeFeedback.text = "enter to attack!";
                        typeModeFeedback.color = Color.red;
                    }
                    else
                    {
                        typeModeText.color = Color.white;
                        typeModeFeedback.text = "no rhyming targets";
                        typeModeFeedback.color = Color.white;
                    }
                }
                else
                {
                        typeModeText.color = Color.white;
                        typeModeFeedback.text = "not a word";
                        typeModeFeedback.color = Color.white;
                }
            }
        }
    }

    void ShowLine( Attackable target )
    {
    }

    void OnAttackableDie( Attackable victim )
    {
        Debug.Log("killed "+victim.word.text );

        // give all letters as inventory
        foreach( char c in victim.word.text )
        {
            if( inventory.ContainsKey(c) )
                inventory[c]++;
        }
    }
}
