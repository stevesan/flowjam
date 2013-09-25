
using UnityEngine;
using System.Collections;
using System.Collections.Generic;
using SteveSharp;

public class TopdownGame : MonoBehaviour
{
    public TopdownPlayer player;
    public TextInput input;
    public Bullet bulletPrefab;

    enum State { Loading, Moving, Typing };
    State state = State.Loading;

    public GameObject typeModeObjects;
    public GUIText typeModeText;
    public GUIText typeModeFeedback;
    public GUIText healthText;
    public AudioClip startTypingClip;
    public AudioClip fireBulletClip;
    public AudioClip cancelClip;
    public LevelSpawner levelSpawner;

    HashSet<string> usedWords = new HashSet<string>();

    void Awake()
    {
        typeModeObjects.SetActive(false);
        bulletPrefab.gameObject.SetActive(false);
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
        input.ClearInput();
        typeModeText.text = "_";
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
                bullet.Init(toTarget.normalized, input.GetInput(), this);
                bulletsFired = true;

            }
            target.OnIsNotInDanger();
        }

        if( bulletsFired )
        {
            AudioSource.PlayClipAtPoint(fireBulletClip, player.transform.position);
            usedWords.Add( input.GetInput() );
        }
        else
            AudioSource.PlayClipAtPoint(cancelClip, player.transform.position);
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

        if( !RhymeScorer.main.AllNucleiiMatchExists( attackString, targetWord ) )
            return false;

        return true;
    }

    bool CanAttackTarget( Attackable target )
    {
        if( target == null )
            return false;

        return IsEffectiveAgainst( input.GetInput(), target.GetWord() );
    }

    void UpdateHealth()
    {
        healthText.text = "";
        for( int i = 0; i < player.GetHealth(); i++ )
            healthText.text += "=";
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
            }
        }
        else if( state == State.Moving )
        {
            UpdateHealth();

            if( Input.GetKeyDown(KeyCode.Return) )
            {
                EnterTypingMode();
            }
        }
        else if( state == State.Typing )
        {
            UpdateHealth();

            if( Input.GetKeyDown(KeyCode.Return) )
            {
                ExitTypingMode(
                        RhymeScorer.main.IsValidAnswer(input.GetInput())
                        && !usedWords.Contains(input.GetInput()) );
            }
            else if( Input.GetKeyDown(KeyCode.Escape) )
            {
                ExitTypingMode( false );
            }
            else
            {
                typeModeText.text = "["+input.GetInput()+"]";

                if( input.GetInput().Length == 0 )
                {
                    typeModeText.color = Color.white;
                    typeModeFeedback.text = "type";
                    typeModeFeedback.color = Color.white;
                }
                else if( usedWords.Contains(input.GetInput() ) )
                {
                    typeModeText.color = Color.white;
                    typeModeFeedback.text = "already used!";
                    typeModeFeedback.color = Color.white;
                }
                else if( RhymeScorer.main.IsValidAnswer( input.GetInput() ) )
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
                        }
                        else
                            target.OnIsNotInDanger();
                    }

                    if( canAttackAny )
                    {
                        typeModeText.color = Color.red;
                        typeModeFeedback.text = "space to attack!";
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
}
